import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/cnn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const root=fileURLToPath(new URL('../',import.meta.url));
const output=resolve(root,'docs/visual-review/qingheng-blender-v2');
await mkdir(output,{recursive:true});
const errors=[],failed=[],external=[];
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.DEMO_URL||'http://127.0.0.1:8765';
function watch(page){
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('requestfailed',request=>failed.push({url:request.url(),error:request.failure()}));
 page.on('response',response=>{if(!response.ok())failed.push({url:response.url(),status:response.status()});});
 page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base+'/'))external.push(request.url());});
}
try{
 const page=await browser.newPage({viewport:{width:1360,height:1000},deviceScaleFactor:1});watch(page);
 await page.goto(base+'/qingheng-head.html');
 await page.waitForFunction(()=>document.body.dataset.ready==='true'||document.body.dataset.error,{timeout:60000});
 assert.equal(await page.getAttribute('body','data-ready'),'true');
 await page.waitForFunction(()=>[...document.querySelectorAll('.gallery img')].every(image=>image.complete&&image.naturalWidth===960));
 const metadata=await page.evaluate(()=>{
  const p=window.__qinghengHeadPreview;
  return {meshes:p.meshes,triangles:p.triangles,vertexColorMeshes:p.vertexColorMeshes,animations:p.animations,
   materials:[...new Set(p.model.children.filter(x=>x.isMesh).flatMap(x=>(Array.isArray(x.material)?x.material:[x.material]).map(m=>m.name)))],
   glError:p.renderer.getContext().getError(),renderer:p.renderer.getContext().getParameter(p.renderer.getContext().RENDERER)};
 });
 assert.equal(metadata.meshes,18);assert.equal(metadata.triangles,198164);assert.equal(metadata.animations,0);
 assert.ok(metadata.vertexColorMeshes>=2);assert.equal(metadata.glError,0);
 assert.ok(metadata.materials.every(name=>name.startsWith('QH2_')));
 for(const view of ['front','three-quarter','side','back']){
  await page.click(`[data-view="${view}"]`);
  await page.waitForFunction(expected=>window.__qinghengHeadPreview.state.view===expected,view);
  await page.screenshot({path:resolve(output,view+'.png')});
 }
 await page.click('[data-view="front"]');await page.click('#closeup');
 assert.equal(await page.evaluate(()=>window.__qinghengHeadPreview.state.closeup),true);
 await page.screenshot({path:resolve(output,'face-closeup.png')});
 const box=await page.locator('canvas').boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,180);
 await page.waitForFunction(()=>window.__qinghengHeadPreview.state.zoom>1);
 const before=await page.evaluate(()=>window.__qinghengHeadPreview.state.yaw);
 await page.mouse.down();await page.mouse.move(box.x+box.width/2+100,box.y+box.height/2+20,{steps:5});await page.mouse.up();
 assert.notEqual(await page.evaluate(()=>window.__qinghengHeadPreview.state.yaw),before);
 await page.click('#spin');
 const spinning=await page.evaluate(()=>window.__qinghengHeadPreview.state.yaw);
 await page.waitForFunction(start=>window.__qinghengHeadPreview.state.yaw>start+.02,spinning);
 await page.click('#reset');
 assert.deepEqual(await page.evaluate(()=>window.__qinghengHeadPreview.state),{view:'three-quarter',yaw:.58,pitch:0,zoom:1,closeup:false,spin:false});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});watch(mobile);
 await mobile.goto(base+'/qingheng-head.html?view=side&closeup=1');
 await mobile.waitForFunction(()=>document.body.dataset.ready==='true',{timeout:60000});
 assert.equal(await mobile.evaluate(()=>window.__qinghengHeadPreview.state.view),'side');
 assert.equal(await mobile.evaluate(()=>window.__qinghengHeadPreview.state.closeup),true);
 await mobile.click('#reset');await mobile.click('[data-view="front"]');
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await mobile.screenshot({path:resolve(output,'mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);
 const report={status:'passed',metadata,desktop:true,mobile:true,viewButtons:true,closeup:true,drag:true,wheel:true,spin:true,reset:true,queryParameters:true,galleryImages:true,errors,failed,external,
  limitation:'SwiftShader verifies loading and interaction; visual quality awaits user review. No real GPU performance claim.'};
 await writeFile(resolve(output,'verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
