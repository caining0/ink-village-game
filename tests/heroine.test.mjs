import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildCharacterData} from '../dist/vendor/longwind/character/humanoidBuild.js';
test('ink heroine has finite head-bound facial features at both LODs',()=>{
 for(const lod of [0,1]){
  const d=buildCharacterData('heroine',1,lod),face=d.packed.face;
  assert.ok(face,'separate face surface');
  const ink=d.packed.facepaint;assert.ok(ink?.index.length>0,'ink eyebrows, eyes and lips exist');
  for(let v=0;v<ink.skinWeight.length;v+=4)assert.ok(Math.abs(ink.skinWeight[v]+ink.skinWeight[v+1]+ink.skinWeight[v+2]+ink.skinWeight[v+3]-1)<1e-5,'facial features stay attached to the head');
  assert.ok(face.uv.every(v=>Number.isFinite(v)&&v>=0&&v<=1),'face uses bounded projected UVs rather than box wrapping');
  for(const p of Object.values(d.packed))for(const a of Object.values(p))assert.ok(a.every(Number.isFinite));
 }
});
