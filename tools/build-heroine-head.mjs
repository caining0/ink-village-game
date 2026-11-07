import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Reproducible head-only adaptation. The source's clothes and body are not shipped.
// Usage: node tools/build-heroine-head.mjs /path/to/VRM1_Constraint_Twist_Sample.vrm
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=process.argv[2];
if(!input)throw new Error('Pass the official VRM sample file as the first argument.');
const bytes=await fs.readFile(input);
const source=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
const binStart=20+bytes.readUInt32LE(12)+8;
const sourceBin=bytes.subarray(binStart);
const meta=source.extensions.VRMC_vrm.meta;
if(meta.name!=='VRM1_Constraint_Twist_Sample'||meta.modification!=='allowModificationRedistribution'||!meta.allowRedistribution)throw new Error('Unexpected model or permissions');
const doc={asset:{version:'2.0',generator:'Yunqi head-only adaptation',copyright:meta.copyrightInformation},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],textures:[],images:[],samplers:source.samplers,accessors:[],bufferViews:[],buffers:[],extras:{source:'https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample',license:meta.licenseUrl,originalMetadata:meta,adaptation:'Head and hair only; local anchor and scale changed; two expression morphs retained. Clothing is original Yunqi procedural work.'}};
const chunks=[];let length=0;
function buffer(data,target){const padded=Buffer.alloc(Math.ceil(data.length/4)*4);data.copy(padded);const id=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:length,byteLength:data.length,...(target?{target}:{})});chunks.push(padded);length+=padded.length;return id;}
function values(id){
 const a=source.accessors[id],v=source.bufferViews[a.bufferView],sizes={5121:1,5123:2,5125:4,5126:4},counts={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},n=counts[a.type],size=sizes[a.componentType];
 const number=(offset,type)=>type===5126?sourceBin.readFloatLE(offset):type===5125?sourceBin.readUInt32LE(offset):type===5123?sourceBin.readUInt16LE(offset):sourceBin.readUInt8(offset);
 const out=new Array(a.count*n).fill(0);
 if(v)for(let i=0;i<a.count;i++)for(let k=0;k<n;k++)out[i*n+k]=number((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||n*size)+k*size,a.componentType);
 if(a.sparse){const sp=a.sparse,iv=source.bufferViews[sp.indices.bufferView],vv=source.bufferViews[sp.values.bufferView];for(let i=0;i<sp.count;i++){const index=number((iv.byteOffset||0)+(sp.indices.byteOffset||0)+i*sizes[sp.indices.componentType],sp.indices.componentType);for(let k=0;k<n;k++)out[index*n+k]=number((vv.byteOffset||0)+(sp.values.byteOffset||0)+(i*n+k)*size,a.componentType);}}
 return out;
}
function accessor(array,type,componentType=5126,target=34962,bounds=false){const T=componentType===5125?Uint32Array:Float32Array,a=new T(array),count=array.length/({SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[type]),out={bufferView:buffer(Buffer.from(a.buffer),target),componentType,count,type};if(bounds){const n=array.length/count;out.min=Array.from({length:n},()=>Infinity);out.max=Array.from({length:n},()=>-Infinity);for(let i=0;i<array.length;i++){out.min[i%n]=Math.min(out.min[i%n],array[i]);out.max[i%n]=Math.max(out.max[i%n],array[i]);}}doc.accessors.push(out);return doc.accessors.length-1;}
const matMap=new Map(),texMap=new Map();
function texture(id){if(texMap.has(id))return texMap.get(id);const t=source.textures[id],im=source.images[t.source],v=source.bufferViews[im.bufferView];const image=doc.images.length;doc.images.push({name:im.name,mimeType:im.mimeType,bufferView:buffer(sourceBin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength))});const index=doc.textures.length;doc.textures.push({source:image,sampler:t.sampler});texMap.set(id,index);return index;}
function material(id){if(matMap.has(id))return matMap.get(id);const src=source.materials[id],p=src.pbrMetallicRoughness;const m={name:src.name,doubleSided:true,alphaMode:src.alphaMode||'OPAQUE',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:texture(p.baseColorTexture.index)},metallicFactor:0,roughnessFactor:.8}};if(src.alphaCutoff!==undefined)m.alphaCutoff=src.alphaCutoff;const index=doc.materials.length;doc.materials.push(m);matMap.set(id,index);return index;}
const factor=.78,anchor=1.445,lift=.035;
for(const mesh of source.meshes){
 const primitives=[];
 for(const p of mesh.primitives){
  const name=source.materials[p.material].name;
  if(mesh.name==='Body'&&!['Body_00_SKIN','HairBack_00_HAIR'].includes(name))continue;
  const positions=values(p.attributes.POSITION),indices=values(p.indices),kept=[];
  for(let i=0;i<indices.length;i+=3){const ids=indices.slice(i,i+3);if(mesh.name==='Body'&&name==='Body_00_SKIN'&&ids.some(v=>positions[v*3+1]<1.34))continue;kept.push(...ids);}
  if(!kept.length)continue;
  const vertices=[...new Set(kept)],remap=new Map(vertices.map((v,i)=>[v,i]));
  const out={attributes:{},indices:accessor(kept.map(v=>remap.get(v)),'SCALAR',5125,34963),material:material(p.material)};
  for(const [key,n]of [['POSITION',3],['NORMAL',3],['TEXCOORD_0',2]]){if(p.attributes[key]===undefined)continue;const src=key==='POSITION'?positions:values(p.attributes[key]),data=[];for(const v of vertices)for(let k=0;k<n;k++){const x=src[v*n+k];data.push(key==='POSITION'?(k===1?(x-anchor)*factor+lift:x*factor):x);}out.attributes[key]=accessor(data,n===3?'VEC3':'VEC2',5126,34962,key==='POSITION');}
  // Retain blink and smile as actual geometry changes, rather than painting facial features.
  if(p.targets){out.targets=[12,29].map(t=>{const target={};for(const key of ['POSITION','NORMAL']){if(p.targets[t]?.[key]===undefined)continue;const src=values(p.targets[t][key]),data=[];for(const v of vertices)for(let k=0;k<3;k++)data.push(src[v*3+k]*(key==='POSITION'?factor:1));target[key]=accessor(data,'VEC3');}return target;});}
  primitives.push(out);
 }
 if(!primitives.length)continue;
 const id=doc.meshes.length;doc.meshes.push({name:mesh.name,primitives,...(mesh.name==='Face'?{weights:[0,.12],extras:{targetNames:['blink','smile']}}:{})});doc.scenes[0].nodes.push(doc.nodes.length);doc.nodes.push({name:mesh.name,mesh:id});
}
doc.buffers=[{byteLength:length}];
const text=Buffer.from(JSON.stringify(doc)),json=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(json);
const bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+json.length+8+bin.length,8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
const destination=path.join(root,'dist/assets/characters/qingheng-head.glb');await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,Buffer.concat([header,jh,json,bh,bin]));console.log(`Built ${destination}: ${(header.readUInt32LE(8)/1024/1024).toFixed(2)} MiB, ${doc.materials.length} materials`);
