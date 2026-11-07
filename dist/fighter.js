import {releasePlaceholder} from './lifecycle.mjs';
import {createCharacter} from './vendor/longwind/character/character.js';
import {Animator,CLIPS} from './vendor/longwind/character/animator.js';
import {G} from './vendor/longwind/core/globals.js';
import {applyHeroineAppearance} from './heroine-appearance.js';
const clipFor={cloud:'attack1',river:'attack2',wind:'attack3',heavy:'heavy',counter:'thrust'};
export async function upgradeFighter(actor,enemy=false,elder=false){
 const ch=await createCharacter({kind:elder?'citizen_old':enemy?'bandit':'heroine',seed:enemy?2:1});
 if(!enemy&&!elder){
  // Keep soft skin and silk under the scene's light; a four-band toon ramp flattened the face.
  ch.materials.skin.roughness=.72;
  ch.materials.cloth.roughness=.65;
  ch.materials.bronze.metalness=.68;ch.materials.bronze.roughness=.32;
  try{await applyHeroineAppearance(ch)}catch(error){ch.dispose();throw error;}
 }
 if(actor.removed){ch.dispose();return actor;}releasePlaceholder(actor);actor.body.visible=false;actor.group.add(ch.group);ch.group.traverse(o=>o.layers.set(0));
 const anim=new Animator(ch.rig,{heightAt:()=>0,style:enemy?'bandit':elder?'hero':'heroine'});anim.setArmed(!elder);ch.sword.setDrawn(!elder);actor.rigged=ch;if(!enemy&&!elder)actor.group.userData.appearance='青蘅 · Blender v2 头脸与发饰 / 原创中式衣裙 / 长剑';actor.animator=anim;actor.play=(id,duration)=>{const clip=clipFor[id]||id;if(!CLIPS[clip])return;anim.play(clip,{fade:.07,speed:duration?CLIPS[clip].meta.duration/duration:1,loop:false});};
 actor.animate=(t,moving,attack=0,dodge=0,dt=1/60)=>{G.uTime.value=t;anim.setLocomotion({speed:moving?(actor.gaitSpeed??(enemy?1.8:1.8)):0,dirX:actor.gaitDirX??0,dirZ:actor.gaitDirZ??1,combat:enemy||(!elder&&!!actor.combatMode),turn:0});anim.update(dt,ch.group);ch.update(dt,t);};
 const disposeOld=actor.dispose;actor.dispose=()=>{ch.dispose();disposeOld?.()};return actor;
}
export async function prepareEnemies(){const {characterData}=await import('./vendor/longwind/character/character.js');await characterData('bandit',2);}
