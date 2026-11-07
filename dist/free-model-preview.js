import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';

const canvas=document.getElementById('view'),stage=canvas.parentElement,status=document.getElementById('status');
const originalButton=document.getElementById('original'),jadeButton=document.getElementById('jade');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(error){status.textContent='无法创建三维画面，请使用启用硬件加速的 Chrome。';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xeae6da);
const camera=new THREE.PerspectiveCamera(32,1,.01,40);
scene.add(new THREE.HemisphereLight(0xfffaf0,0x8e9b8d,.85));
const key=new THREE.DirectionalLight(0xfff2dd,1.2);key.position.set(-3,5,5);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-2,right:2,top:3,bottom:-1,near:.5,far:15});key.shadow.normalBias=.008;scene.add(key);
const fill=new THREE.DirectionalLight(0xdcebe7,.6);fill.position.set(3,2,3);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffebc8,.9);rim.position.set(1,3,-3);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0xeae6da,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.006;floor.receiveShadow=true;scene.add(floor);
const turntable=new THREE.Group();scene.add(turntable);
const query=new URLSearchParams(location.search);
let view=query.get('view')||'full',yaw=0,pitch=0,zoom=1,drag=null,auto=false;
let sourceMap,jadeMap;const cloth=[];
function setView(next){view=next;yaw=next==='back'?Math.PI:next==='side'?Math.PI/2:0;pitch=0;zoom=1;for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===next));}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
document.getElementById('rotate').onclick=event=>{auto=!auto;event.currentTarget.setAttribute('aria-pressed',String(auto));};
canvas.addEventListener('pointerdown',event=>{drag=[event.clientX,event.clientY];canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(!drag)return;yaw-=(event.clientX-drag[0])*.008;pitch=THREE.MathUtils.clamp(pitch+(event.clientY-drag[1])*.002,-.3,.3);drag=[event.clientX,event.clientY];});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);window.addEventListener('blur',()=>drag=null);
canvas.addEventListener('wheel',event=>{event.preventDefault();zoom=THREE.MathUtils.clamp(zoom+event.deltaY*.001,.6,1.7);},{passive:false});
function createJadeMap(map){
 const image=map.image,surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;
 const ctx=surface.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
 const pixels=ctx.getImageData(0,0,surface.width,surface.height),data=pixels.data;
 for(let i=0;i<data.length;i+=4){
  const r=data[i],g=data[i+1],b=data[i+2],hi=Math.max(r,g,b),lo=Math.min(r,g,b);
  if(hi<25||(hi-lo)/hi<.15)continue;
  // Keep the texture's luminance and low-saturation trim; recolour chromatic fabric only.
  const luminance=.2126*r+.7152*g+.0722*b,v=Math.min(255,luminance/.697);
  data[i]=Math.round(v*.45);data[i+1]=Math.round(v*.82);data[i+2]=Math.round(v*.62);
 }
 ctx.putImageData(pixels,0,0);
 const result=new THREE.CanvasTexture(surface);result.flipY=map.flipY;result.encoding=map.encoding;
 result.wrapS=map.wrapS;result.wrapT=map.wrapT;result.offset.copy(map.offset);result.repeat.copy(map.repeat);result.rotation=map.rotation;result.center.copy(map.center);
 result.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return result;
}
function setPalette(jade){
 try{
  if(jade&&!jadeMap)jadeMap=createJadeMap(sourceMap);
  for(const material of cloth){material.map=jade?jadeMap:sourceMap;material.needsUpdate=true;}
  originalButton.setAttribute('aria-pressed',String(!jade));jadeButton.setAttribute('aria-pressed',String(jade));
  document.body.dataset.palette=jade?'jade':'original';
 }catch(error){status.textContent='试色失败，可继续查看原模型。';console.error(error);}
}
originalButton.onclick=()=>setPalette(false);jadeButton.onclick=()=>setPalette(true);
try{
 const gltf=await new GLTFLoader().loadAsync('./assets/characters/xiaohua.glb'),model=gltf.scene;
 model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model),height=box.max.y-box.min.y;
 if(!(height>0&&Number.isFinite(height)))throw new Error('模型尺寸无效');
 const center=box.getCenter(new THREE.Vector3()),scale=1.75/height;
 const normalized=new THREE.Group();normalized.add(model);normalized.scale.setScalar(scale);normalized.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);turntable.add(normalized);
 let triangles=0,meshes=0;
 model.traverse(object=>{
  if(!object.isMesh)return;meshes++;object.castShadow=true;object.receiveShadow=false;
  triangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3;
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(material.map)material.map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
   if(material.name==='FabricA'&&material.map&&!cloth.includes(material)){cloth.push(material);sourceMap=material.map;}
  }
 });
 originalButton.disabled=!sourceMap;jadeButton.disabled=!sourceMap;
 status.textContent='完整三维模型已加载 · 拖动旋转，滚轮缩放';
 document.body.dataset.ready='true';document.body.dataset.palette='original';
 window.__freeModelPreview={model,scene,camera,renderer,turntable,normalized,sourceMap,triangles,meshes,animations:gltf.animations.length};
 if(query.get('palette')==='jade')setPalette(true);
}catch(error){status.textContent='模型加载失败：'+error.message;console.error(error);}
setView(view);
function resize(){const width=stage.clientWidth,height=stage.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
const clock=new THREE.Clock(),target=new THREE.Vector3();
renderer.setAnimationLoop(()=>{
 const dt=Math.min(clock.getDelta(),.05);if(auto&&!drag)yaw+=dt*.25;
 const portrait=view==='face',y=portrait?1.57:.88;
 const distance=(portrait?.7:3.8)*zoom*Math.max(1,.8/camera.aspect);
 target.set(0,y,0);camera.position.set(Math.sin(yaw)*distance,y+pitch+(portrait?0:.08),Math.cos(yaw)*distance);camera.lookAt(target);
 renderer.render(scene,camera);
});
