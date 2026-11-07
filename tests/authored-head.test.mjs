import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bytes=readFileSync(new URL('../dist/assets/characters/qingheng-head.glb',import.meta.url));
const jsonSize=bytes.readUInt32LE(12),model=JSON.parse(bytes.subarray(20,20+jsonSize)),bin=bytes.subarray(28+jsonSize);
function floats(index){const a=model.accessors[index],v=model.bufferViews[a.bufferView],start=(v.byteOffset||0)+(a.byteOffset||0),length=a.count*({VEC2:2,VEC3:3,SCALAR:1}[a.type]);return Array.from({length},(_,i)=>bin.readFloatLE(start+i*4));}
test('authored head is self-contained, licensed and contains no source clothing',()=>{
 assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
 const permissions=model.extras.originalMetadata;assert.equal(permissions.allowRedistribution,true);assert.equal(permissions.modification,'allowModificationRedistribution');assert.match(model.asset.copyright,/pixiv/);
 assert.ok(model.images.every(i=>i.bufferView!==undefined&&!i.uri),'offline textures embedded in GLB');
 assert.ok(model.materials.every(m=>!/CLOTH/.test(m.name)),'modern source clothing is excluded');
 for(const view of model.bufferViews)assert.ok(view.byteOffset+view.byteLength<=bin.length);
 for(const mesh of model.meshes)for(const p of mesh.primitives){const xyz=floats(p.attributes.POSITION),uv=floats(p.attributes.TEXCOORD_0);assert.ok(xyz.every(Number.isFinite));assert.ok(uv.every(Number.isFinite));for(let i=0;i<xyz.length;i+=3){assert.ok(Math.abs(xyz[i])<.2);assert.ok(xyz[i+1]>-.35&&xyz[i+1]<.25,'geometry is head-local, not a hidden whole avatar');assert.ok(Math.abs(xyz[i+2])<.2);}const a=model.accessors[p.indices],v=model.bufferViews[a.bufferView];assert.equal(a.count%3,0);for(let i=0;i<a.count;i++)assert.ok(bin.readUInt32LE(v.byteOffset+i*4)<xyz.length/3);}
});
test('blink changes the authored eye geometry while retaining the UV layout',()=>{
 const face=model.meshes.find(m=>m.name==='Face');assert.deepEqual(face.extras.targetNames,['blink','smile']);
 const eyelids=face.primitives.find(p=>model.materials[p.material].name==='FaceEyeline_00_FACE');
 assert.ok(eyelids);assert.equal(model.accessors[eyelids.targets[0].POSITION].count,model.accessors[eyelids.attributes.POSITION].count);
 const delta=floats(eyelids.targets[0].POSITION);assert.ok(delta.some(x=>Math.abs(x)>.001),'blink is a real eyelid/eye shape, not an unchanged placeholder');
});
