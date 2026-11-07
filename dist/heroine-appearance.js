import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';

const headURL=new URL('./assets/characters/qingheng-game-head-v2.glb',import.meta.url).href;
// Each heroine owns her textures, materials, geometry and expressions.
export async function applyHeroineAppearance(ch){
 const {scene}=await new GLTFLoader().loadAsync(headURL);
 const textures=new Set(),geometries=new Set(),expressions=[];
 for(const mesh of ch.meshes){
  if(mesh.name==='char:face'||mesh.name==='char:facepaint'){mesh.visible=false;continue;}
  if(!['char:skin','char:hair'].includes(mesh.name))continue;
  const g=mesh.geometry,si=g.getAttribute('skinIndex'),sw=g.getAttribute('skinWeight'),idx=g.index;
  if(!si||!sw||!idx)continue;
  const isHead=v=>{let weight=0;for(let k=0;k<4;k++)if(ch.rig.skeleton.bones[si.array[v*si.itemSize+k]]?.name==='head')weight+=sw.array[v*sw.itemSize+k];return weight>.5;};
  const kept=[];for(let i=0;i<idx.count;i+=3){const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);if(isHead(a)&&isHead(b)&&isHead(c))continue;kept.push(a,b,c);}
  g.setIndex(kept);
 }
 scene.name='qingheng-blender-head-v2';scene.scale.setScalar(ch.scale);
 scene.traverse(o=>{
  if(!o.isMesh)return;
  geometries.add(o.geometry);o.frustumCulled=false;o.castShadow=true;o.receiveShadow=false;
  if(o.morphTargetDictionary?.blink!==undefined)expressions.push(o);
  const list=Array.isArray(o.material)?o.material:[o.material];
  for(const m of list){
   // Preserve Blender v2 skin/iris vertex colors and authored PBR materials.
   m.side=THREE.DoubleSide;
   if(m.map){m.map.anisotropy=4;textures.add(m.map);}
   ch.materials.list.push(m);
  }
 });
 ch.rig.bones.head.add(scene);
 const oldUpdate=ch.update.bind(ch);let nextBlink=2.3,blinkTime=-1;
 ch.update=(dt,t)=>{
  oldUpdate(dt,t);nextBlink-=dt;
  if(nextBlink<=0&&blinkTime<0){blinkTime=0;nextBlink=3.4+Math.random()*2.8;}
  let blink=0;if(blinkTime>=0){blinkTime+=dt;blink=Math.sin(Math.min(1,blinkTime/.16)*Math.PI);if(blinkTime>=.16)blinkTime=-1;}
  for(const mesh of expressions)mesh.morphTargetInfluences[mesh.morphTargetDictionary.blink]=blink;
 };
 const oldDispose=ch.dispose.bind(ch);ch.dispose=()=>{scene.removeFromParent();for(const g of geometries)g.dispose();for(const t of textures){t.image?.close?.();t.dispose();}oldDispose();};
 ch.appearance={name:'青蘅',source:'Project-authored Blender v2 head, hair and accessories; existing animated outfit',head:scene};
 return ch;
}
