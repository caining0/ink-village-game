import * as THREE from './vendor/three.module.js';
import {upgradeFighter} from './fighter.js';

const $=id=>document.getElementById(id),canvas=$('view');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})}
catch(error){$('status').textContent='无法创建三维画面，请使用 Chrome 并启用硬件加速。';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;
renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xeae6da);scene.fog=new THREE.Fog(0xeae6da,8,20);
const camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.01,40);
scene.add(new THREE.HemisphereLight(0xfffaf1,0x8e9b8d,.82));
const key=new THREE.DirectionalLight(0xfff2dd,1.25);key.position.set(-2.5,4,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=3;key.shadow.camera.bottom=-1;key.shadow.normalBias=.012;key.shadow.radius=4;scene.add(key);
const fill=new THREE.DirectionalLight(0xdcebe7,.48);fill.position.set(3,2,3);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffebc8,.9);rim.position.set(1,3,-3);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xeae6da,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);
const ring=new THREE.Mesh(new THREE.RingGeometry(.78,.785,120),new THREE.MeshBasicMaterial({color:0xaab39b,transparent:true,opacity:.6,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.002;scene.add(ring);
const actor={group:new THREE.Group(),body:new THREE.Group()};actor.group.add(actor.body);scene.add(actor.group);
const query=new URLSearchParams(location.search);
let portrait=query.get('view')==='face',yaw=query.get('view')==='back'?Math.PI:query.get('view')==='side'?Math.PI/2:0,pitch=0,zoom=1,drag=null,auto=false,pose='idle';
const clock=new THREE.Clock();let ready=false;
const activate=(ids,selected)=>{for(const id of ids){$(id).classList.toggle('active',id===selected);$(id).setAttribute('aria-pressed',String(id===selected));}};
function setView(id){portrait=id==='face';yaw=id==='turn'?Math.PI:id==='side'?Math.PI/2:0;pitch=0;zoom=1;activate(['full','face','side','turn'],id);}
for(const id of ['full','face','side','turn'])$(id).onclick=()=>setView(id);
function setPose(id){if(!ready)return;pose=id;activate(['idle','walk','sword'],id);actor.animator.stop(.2);actor.animator.setArmed(id==='sword');actor.rigged.sword.setDrawn(id==='sword');if(id==='sword')actor.play('cloud',.9);}
for(const id of ['idle','walk','sword'])$(id).onclick=()=>setPose(id);
$('rotate').onclick=()=>{auto=!auto;$('rotate').classList.toggle('active',auto);$('rotate').setAttribute('aria-pressed',String(auto));};
canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.008;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag[1])*.003,-.35,.4);drag=[e.clientX,e.clientY];};
canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.001,.65,1.6)},{passive:false});
window.addEventListener('blur',()=>drag=null);
try{
 await upgradeFighter(actor);ready=true;setPose(query.get('pose')==='walk'?'walk':'idle');
 setView(portrait?'face':query.get('view')==='back'?'turn':query.get('view')==='side'?'side':'full');
 $('status').textContent='青蘅 · 实机三维角色';document.body.dataset.ready='true';
 // Read-only inspection handle for local browser verification.
 window.__characterPreview={actor,scene,camera,renderer};
}catch(error){$('status').textContent='角色加载失败：'+error.message;console.error(error);}
function render(){
 requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.035),t=clock.elapsedTime;
 if(ready){actor.animator.setLocomotion({speed:pose==='walk'?1.8:0,dirX:0,dirZ:1,combat:pose==='sword',turn:0});actor.animator.update(dt,actor.rigged.group);actor.rigged.update(dt,t);}
 if(auto&&!drag)yaw+=dt*.24;
 const head=ready?actor.rigged.rig.bones.head.getWorldPosition(new THREE.Vector3()):new THREE.Vector3(0,1.59,0);
 const y=portrait?head.y+.055:.9,d=(portrait?.8:3.75)*zoom;
 const framing=innerWidth<760?(portrait?.08:.28):(portrait?.13:.56);
 camera.position.set(Math.sin(yaw)*d-framing,y+pitch+(portrait?0:.08),Math.cos(yaw)*d);camera.lookAt(-framing,y,0);
 renderer.render(scene,camera);
}
render();
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
