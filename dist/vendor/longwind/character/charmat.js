// Integration material adapter for the MIT procedural Long Wind rig.
// Uses this project's own textures; excludes upstream restricted character/mocap assets.
import * as THREE from '../../three.module.js';
import {clothMap,strawMap} from '../../../art.js';
export function createCharUniforms(){return {uContact:{value:new THREE.Vector4(0,.5,1,0)},uWindLocal:{value:new THREE.Vector3(.6,0,.8)},uWindAmp:{value:1}};}
export async function createCharMaterials(){const M={};for(const key of ['cloth','skin','hair','straw','leather','steel','bronze','lacquer','gauze']){M[key]=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:key==='steel'?.28:.88,metalness:key==='steel'?.6:key==='bronze'?.4:0,side:THREE.DoubleSide});}M.cloth.map=clothMap;M.straw.map=strawMap;M.gauze.transparent=true;M.gauze.opacity=.7;M.face=new THREE.MeshStandardMaterial({color:0xf5d2bc,roughness:1,emissive:0x50352c,emissiveIntensity:.18,side:THREE.FrontSide});M.facepaint=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});M.list=Object.values(M);return M;}
