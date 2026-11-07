import * as THREE from './vendor/three.module.js';

// Keep the scene at the canvas's physical resolution. Canvas antialiasing does
// not apply to an offscreen render target, so that target needs its own AA.
export function createPost(renderer, scene, camera) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const gl = renderer.getContext();
  const samples = renderer.capabilities.isWebGL2
    ? Math.min(4, gl.getParameter(gl.MAX_SAMPLES)) : 0;
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false,
    samples
  });
  target.texture.encoding = THREE.LinearEncoding;
  target.texture.generateMipmaps = false;
  const query = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
  let enabled = query.get('render') !== 'direct';
  const uniforms = {
    image: {value: target.texture},
    resolution: {value: size},
    useFXAA: {value: samples === 0},
    ink: {value: query.get('look') === 'ink' ? 1 : 0}
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `
      uniform sampler2D image;
      uniform vec2 resolution;
      uniform bool useFXAA;
      uniform float ink;
      varying vec2 vUv;
      vec3 sampleAA(vec2 uv) {
        vec2 px = 1. / resolution;
        vec3 nw = texture2D(image, uv + vec2(-1., -1.) * px).rgb;
        vec3 ne = texture2D(image, uv + vec2( 1., -1.) * px).rgb;
        vec3 sw = texture2D(image, uv + vec2(-1.,  1.) * px).rgb;
        vec3 se = texture2D(image, uv + vec2( 1.,  1.) * px).rgb;
        vec3 center = texture2D(image, uv).rgb;
        vec3 luma = vec3(.299, .587, .114);
        float lnw = dot(nw, luma), lne = dot(ne, luma);
        float lsw = dot(sw, luma), lse = dot(se, luma);
        float lm = dot(center, luma);
        float lo = min(lm, min(min(lnw, lne), min(lsw, lse)));
        float hi = max(lm, max(max(lnw, lne), max(lsw, lse)));
        if (hi - lo < max(.025, hi * .125)) return center;
        vec2 direction = vec2(-((lnw + lne) - (lsw + lse)),
                                (lnw + lsw) - (lne + lse));
        float reduce = max((lnw + lne + lsw + lse) * .03125, .0078125);
        float inverse = 1. / (min(abs(direction.x), abs(direction.y)) + reduce);
        direction = clamp(direction * inverse, vec2(-8.), vec2(8.)) * px;
        vec3 a = .5 * (texture2D(image, uv - direction / 6.).rgb
                     + texture2D(image, uv + direction / 6.).rgb);
        vec3 b = a * .5 + .25 * (texture2D(image, uv - direction * .5).rgb
                              + texture2D(image, uv + direction * .5).rgb);
        float lb = dot(b, luma);
        return lb < lo || lb > hi ? a : b;
      }
      void main() {
        vec3 color = useFXAA ? sampleAA(vUv) : texture2D(image, vUv).rgb;
        if (ink > .5) {
          float edge = smoothstep(.25, .75, length(vUv - .5));
          color *= 1. - .035 * edge;
        }
        gl_FragColor = vec4(color, 1.);
        // Scene materials already applied tone mapping in the first pass.
        // Apply the renderer's exact output transfer function once here.
        #include <encodings_fragment>
      }`
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const screen = new THREE.Scene();
  const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  screen.add(quad);
  return {
    target,
    render() {
      if (!enabled) { renderer.render(scene, camera); return; }
      const previous = renderer.getRenderTarget();
      try {
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        renderer.setRenderTarget(previous);
        renderer.render(screen, screenCamera);
      } finally { renderer.setRenderTarget(previous); }
    },
    resize() {
      renderer.getDrawingBufferSize(size);
      target.setSize(size.x, size.y);
    },
    setEnabled(value) { enabled = Boolean(value); },
    dispose() { target.dispose(); material.dispose(); quad.geometry.dispose(); }
  };
}
