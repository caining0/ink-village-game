import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';

const canvas=document.getElementById('portrait');
const stage=canvas.parentElement;
const status=document.getElementById('status');
const closeupButton=document.getElementById('closeup');
const spinButton=document.getElementById('spin');
const query=new URLSearchParams(location.search);
const angles={front:0,'three-quarter':.58,side:Math.PI/2,back:Math.PI};
let view=Object.hasOwn(angles,query.get('view'))?query.get('view'):'three-quarter';
let yaw=angles[view],pitch=0,zoom=1,closeup=query.get('closeup')==='1',spin=false,drag=null;
let renderer;
try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
}catch(error){
 status.textContent='三维画面无法启动，可以点击右侧的三张渲染原图查看造型。';
 document.body.dataset.error='webgl';
 throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xdce0d8);
const camera=new THREE.PerspectiveCamera(32,1,.02,60);
scene.add(new THREE.HemisphereLight(0xfffcf4,0x7f9085,.65));
const targetLight=new THREE.Object3D();targetLight.position.set(0,1.6,0);scene.add(targetLight);
const key=new THREE.DirectionalLight(0xfff6ea,1.05);key.position.set(-3.2,5.3,4.2);key.target=targetLight;
key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-2,right:2,top:3,bottom:-1,near:.5,far:16});
key.shadow.normalBias=.0015;key.shadow.bias=-.0001;scene.add(key);
const fill=new THREE.DirectionalLight(0xe7f1ff,.4);fill.position.set(3.2,3,2.2);fill.target=targetLight;scene.add(fill);
const rim=new THREE.DirectionalLight(0xfff6df,.9);rim.position.set(1,4.3,-2.7);rim.target=targetLight;scene.add(rim);
const base=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.075,96),new THREE.MeshStandardMaterial({color:0xc9d3c5,roughness:.4}));
base.scale.z=.51;base.position.set(0,.06,-.08);base.receiveShadow=true;scene.add(base);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.12}));
floor.rotation.x=-Math.PI/2;floor.position.y=.015;floor.receiveShadow=true;scene.add(floor);

function updateControls(){
 for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===view));
 closeupButton.setAttribute('aria-pressed',String(closeup));
 spinButton.setAttribute('aria-pressed',String(spin));
}
function setView(next){view=next;yaw=angles[next];pitch=0;zoom=1;spin=false;updateControls();}
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>setView(button.dataset.view);
closeupButton.onclick=()=>{closeup=!closeup;zoom=1;pitch=0;updateControls();};
spinButton.onclick=()=>{spin=!spin;updateControls();};
document.getElementById('reset').onclick=()=>{closeup=false;setView('three-quarter');};
canvas.addEventListener('pointerdown',event=>{
 drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);
 spin=false;spinButton.setAttribute('aria-pressed','false');
});
canvas.addEventListener('pointermove',event=>{
 if(!drag||drag.id!==event.pointerId)return;
 yaw-=(event.clientX-drag.x)*.007;
 pitch=THREE.MathUtils.clamp(pitch+(event.clientY-drag.y)*.003,-.4,.4);
 drag.x=event.clientX;drag.y=event.clientY;
});
const endDrag=()=>{drag=null;};
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
canvas.addEventListener('lostpointercapture',endDrag);window.addEventListener('blur',endDrag);
canvas.addEventListener('wheel',event=>{event.preventDefault();zoom=THREE.MathUtils.clamp(zoom*Math.exp(event.deltaY*.0007),.62,1.6);},{passive:false});
updateControls();
try{
 const gltf=await new GLTFLoader().loadAsync('./assets/characters/qingheng-head-study-v2.glb');
 const model=gltf.scene;
 const bounds=new THREE.Box3().setFromObject(model);
 if(!Number.isFinite(bounds.max.y)||bounds.max.y-bounds.min.y<1)throw new Error('模型尺寸无效');
 let meshes=0,triangles=0,vertexColorMeshes=0;
 model.traverse(object=>{
  if(!object.isMesh)return;
  meshes++;triangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3;
  if(object.geometry.attributes.color)vertexColorMeshes++;
  object.castShadow=true;object.receiveShadow=false;
 });
 scene.add(model);
 status.textContent='头肩造型已载入 · 可旋转查看';
 document.body.dataset.ready='true';
 window.__qinghengHeadPreview={model,scene,camera,renderer,meshes,triangles,vertexColorMeshes,animations:gltf.animations.length,
  get state(){return {view,yaw,pitch,zoom,closeup,spin};},setView};
}catch(error){
 status.textContent='三维稿加载失败，可点击渲染原图查看：'+error.message;
 document.body.dataset.error='load';console.error(error);
}
function resize(){
 const width=stage.clientWidth,height=stage.clientHeight;
 if(!width||!height)return;
 renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);resize();
const clock=new THREE.Clock();
const aim=new THREE.Vector3();
renderer.setAnimationLoop(()=>{
 const dt=Math.min(clock.getDelta(),.05);
 if(document.hidden)return;
 if(spin&&!drag)yaw+=dt*.28;
 const distance=(closeup?2.85:5.65)*zoom*Math.max(1,.83/camera.aspect);
 const y=closeup?2.12:1.47;
 aim.set(0,y,closeup?.04:0);
 camera.position.set(Math.sin(yaw)*distance,y+Math.sin(pitch)*distance,Math.cos(yaw)*distance);
 camera.lookAt(aim);renderer.render(scene,camera);
});
