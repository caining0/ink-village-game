// Browser regression check for actual GL output, DPR sizing and WebGL1 fallback.
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
import assert from 'node:assert/strict';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:8765';
const browser = await chromium.launch({
  ...(process.env.CHROME_BIN ? {executablePath: process.env.CHROME_BIN} : {channel: 'chrome'}),
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
  for (const dpr of [1, 2]) {
    const page = await browser.newPage({viewport: {width: 480, height: 320}, deviceScaleFactor: dpr});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/__render-check', route => route.fulfill({
      contentType: 'text/html', body: '<!doctype html><title>Render check</title><link rel="icon" href="data:,">'
    }));
    await page.goto(base + '/__render-check');
    const results = await page.evaluate(async () => {
      const THREE = await import('/vendor/three.module.js');
      const {createPost} = await import('/render-pipeline.js');
      const results = [];
      for (const legacy of [false, true]) {
        const canvas = document.createElement('canvas');
        const context = legacy ? canvas.getContext('webgl', {preserveDrawingBuffer: true}) : undefined;
        if (legacy && !context) { results.push({legacy, skipped: true}); continue; }
        const renderer = new THREE.WebGLRenderer({canvas, context, antialias: true, preserveDrawingBuffer: true});
        renderer.setPixelRatio(devicePixelRatio);
        renderer.setSize(160, 96);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
        camera.position.z = 2;
        const material = new THREE.MeshBasicMaterial();
        const geometry = new THREE.PlaneGeometry(2, 2);
        scene.add(new THREE.Mesh(geometry, material));
        const pipeline = createPost(renderer, scene, camera);
        const gl = renderer.getContext();
        function pixel() {
          const out = new Uint8Array(4);
          gl.readPixels(gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
          return [...out];
        }
        const colors = [];
        for (const color of [[.18, .18, .18], [.03, .24, .12], [.8, .8, .8], [.6, .05, .03]]) {
          material.color.setRGB(...color);
          renderer.render(scene, camera);
          const direct = pixel();
          pipeline.render();
          const post = pixel();
          colors.push({color, direct, post});
        }
        const initial = [pipeline.target.width, pipeline.target.height];
        renderer.setSize(100, 72);
        pipeline.resize();
        const resized = [pipeline.target.width, pipeline.target.height];
        pipeline.setEnabled(false);
        pipeline.render();
        const bypass = pixel();
        results.push({legacy, webgl2: renderer.capabilities.isWebGL2, samples: pipeline.target.samples,
          initial, resized, colors, bypass, error: gl.getError()});
        pipeline.dispose(); material.dispose(); geometry.dispose(); renderer.dispose(); renderer.forceContextLoss();
      }
      return results;
    });
    assert.deepEqual(errors, [], 'no shader compilation or page errors');
    for (const result of results) {
      if (result.skipped) { console.log(`DPR ${dpr}: WebGL1 unavailable`); continue; }
      assert.deepEqual(result.initial, [160 * dpr, 96 * dpr]);
      assert.deepEqual(result.resized, [100 * dpr, 72 * dpr]);
      assert.equal(result.error, 0, 'no WebGL errors');
      if (result.webgl2) assert.ok(result.samples > 0, 'offscreen MSAA enabled');
      for (const {direct, post} of result.colors) {
        assert.equal(post[3], 255);
        assert.ok(Math.max(...direct.slice(0, 3)) > 0, 'test actually rendered');
        for (let i = 0; i < 3; i++) assert.ok(Math.abs(direct[i] - post[i]) <= 2,
          `output color differs: direct=${direct} post=${post}`);
      }
      assert.deepEqual(result.bypass, result.colors.at(-1).direct);
      console.log(`PASS DPR ${dpr}, ${result.webgl2 ? 'WebGL2 MSAA' : 'WebGL1 FXAA'}: resize, colors, bypass, GL errors`);
    }
    await page.close();
  }
} finally { await browser.close(); }
