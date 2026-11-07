// Interim reference-inspired heroine, built solely from the existing MIT procedural kit.
// This is a playable silhouette approximation, not the final generated likeness/model.
import * as THREE from '../../three.module.js';
import {robe,trousers,skirt,sash,shoes,ribbon} from './outfits.js';
import {hairCap,hairTail,headMatrix} from './outfitsHead.js';
import {headSDF,BONE_INDEX,BONE_NAMES} from './humanoid.js';
import {V,tube,paint,skinRigid,skinDense,xform} from './outfitsKit.js';
import {COL} from './cloth.js';
const JADE=[.095,.31,.18],IVORY=[.92,.86,.71],GOLD=[.73,.50,.21],HAIR=[.024,.014,.012];

function ornament(ctx,points,radius,color,bone='head',headLocal=false){
 const m=tube(points,radius,{sides:5,samples:points.length*3});
 paint(m,{color,color2:color,cloth:[0,0,1,1]});
 if(headLocal)xform(m,headMatrix(ctx));
 if(bone==='body')skinDense(m,(x,y,z,v,out)=>out.set(ctx.weightsAt(x,y,z)),BONE_NAMES.map((_,i)=>i),0);
 else skinRigid(m,BONE_INDEX[bone]);
 ctx.asm.add('bronze',m,{uvScale:12});
}
function flower(ctx,center,r,headLocal=true){
 // Five rounded petals, small jade centre, all bound to head or torso.
 for(let k=0;k<5;k++){
  const a=k/5*Math.PI*2,pts=[];
  for(let i=0;i<=12;i++){const t=i/12*Math.PI*2,u=r*(.6+.48*Math.cos(t)),v=r*.38*Math.sin(t);pts.push([center[0]+Math.cos(a)*u-Math.sin(a)*v,center[1]+Math.sin(a)*u+Math.cos(a)*v,center[2]+.0015*Math.sin(t)]);}
  ornament(ctx,pts,.0018,GOLD,headLocal?'head':'body',headLocal);
 }
 const pts=Array.from({length:13},(_,i)=>{const a=i/12*Math.PI*2;return [center[0]+Math.cos(a)*r*.2,center[1]+Math.sin(a)*r*.2,center[2]+.002]});
 ornament(ctx,pts,.003,JADE,headLocal?'head':'body',headLocal);
}
// Clean ink-line features on the real facial surface. No photographic face projection.
function inkFace(ctx){
 const sdf=headSDF(ctx.b);
 const front=(x,y)=>{let lo=.015,hi=.16;for(let i=0;i<22;i++){const z=(lo+hi)/2;if(sdf(x,y,z)<0)lo=z;else hi=z;}return hi+.0011;};
 function patch(cx,cy,rx,ry,color,almond=false){
  const pts=[cx,cy,front(cx,cy)+.0002],norm=[0,0,1],idx=[];
  const N=48;for(let i=0;i<=N;i++){const a=i/N*Math.PI*2;const x=cx+rx*Math.cos(a),y=cy+ry*Math.sin(a)*(almond?Math.pow(Math.abs(Math.sin(a)),.28):1)+ (almond?(x-cx)*Math.sign(cx)*.07:0);pts.push(x,y,front(x,y));norm.push(0,0,1);if(i<N)idx.push(0,i+1,i+2);}
  const m={positions:new Float32Array(pts),normals:new Float32Array(norm),indices:new Uint32Array(idx)};paint(m,{color});xform(m,headMatrix(ctx));skinRigid(m,BONE_INDEX.head);ctx.asm.add('facepaint',m);
 }
 function stroke(points,r,color){const m=tube(points.map(([x,y])=>[x,y,front(x,y)+.0006]),r,{sides:6,samples:32});paint(m,{color});xform(m,headMatrix(ctx));skinRigid(m,BONE_INDEX.head);ctx.asm.add('facepaint',m);}
 const INK=[.048,.023,.020];
 for(const sign of [-1,1]){
  const x=sign*.030,y=.039;
  patch(x,y,.0192,.0088,INK,true);
  patch(x,y-.0007,.0178,.0072,[.94,.92,.84],true);
  patch(x,y,.0064,.0071,[.09,.23,.13]);
  patch(x,y,.0030,.0055,[.015,.024,.018]);
  patch(x-.0017,y+.0025,.0016,.0017,[1,.99,.94]);
  stroke(Array.from({length:12},(_,i)=>{const t=i/11;return [sign*(.013+.037*t),.061+.006*Math.sin(t*Math.PI)-.006*t]}),.0018,INK);
  // A short upper outer lash reads as brushwork at normal gameplay distance.
  stroke([[sign*.044,.044],[sign*.050,.047],[sign*.053,.050]],.0011,INK);
 }
 patch(0,-.027,.013,.0045,[.60,.17,.17]);
 patch(0,-.0248,.012,.002,[.72,.27,.26]);
 stroke([[-.011,-.026],[0,-.0268],[.011,-.026]],.0006,[.35,.09,.09]);
}
export function heroineRecipe(){return {
 info:'interim heroine · reference-inspired procedural proxy',skin:'full',hands:{L:'swordfinger',R:'grip'},
 weapon:{type:'jian',opts:{tasselColor:JADE,gripColor:IVORY,scabbardColor:JADE}},
 dress(ctx){
  const s=ctx.s;
  inkFace(ctx);
  // Raised closed collar and short sleeves; a narrow midriff gap above the waist sash.
  robe(ctx,{name:'jadeTop',sleeve:'narrow',sleeveR:.056,cuff:-.36,collar:'open',neckR:.048,collarDY:.04,neckT:.014,
   waistY:1.10,blouseY:1.16,color:JADE,trim:GOLD,trimW:.014,cuffTrimW:.015,lining:IVORY,t:.016,drape:.025,blouse:.002,folds:.35,mottle:.025});
  const shorts=trousers(ctx,{color:IVORY,y0:1.045,y1:.80,bag:0,t:.009,tris:2000});
  // Two ivory tiers over fitted opaque inner shorts. Their chain pins resist excessive lift.
  for(const [name,top,hem,clear] of [['ivoryLower',1.035,.67,.035],['ivoryUpper',1.04,.75,.052]]){
   skirt(ctx,{under:shorts.sdf,name,y0:top,hemY:hem,n:12,nu:72,ny:18,rows:[top,.94,.82,hem],pins:[1,.75,.3,.12],
    color:IVORY,trim:GOLD,trimW:.012,lining:IVORY,folds:{n:18,amp:.012},clear:[clear,clear+.015,clear+.055],flare:.11,drag:1.5,stiff:.6,flutter:.2,mottle:.02});
  }
  // Green petal overskirt: open front and back, preserving the ivory layered silhouette.
  skirt(ctx,{under:shorts.sdf,name:'jadePetals',y0:1.045,hemY:.80,n:12,nu:72,ny:18,rows:[1.045,.96,.88,.80],pins:[1,.8,.4,.16],
   slits:[{angle:0,top:1.01},{angle:Math.PI,top:1.01}],color:JADE,trim:GOLD,trimW:.017,lining:IVORY,folds:{n:10,amp:.008},clear:[.07,.075,.115],flare:.12,drag:1.6,stiff:.65,flutter:.15});
  const panel=ctx.asm.parts.get('cloth').at(-1),indices=[];
  for(let i=0;i<panel.indices.length;i+=3){let x=0,z=0,y=0;for(let j=0;j<3;j++){const v=panel.indices[i+j]*3;x+=panel.positions[v];y+=panel.positions[v+1];z+=panel.positions[v+2];}if(y/3>1.015*s||Math.abs(x)>.66*Math.abs(z))indices.push(...panel.indices.subarray(i,i+3));}panel.indices=new Uint32Array(indices);
  sash(ctx,{name:'ivoryWaist',y0:1.015,y1:1.075,t:.023,color:IVORY,pattern:'silk',knot:[-.07,0],tails:[.30,.24],tailW:.023,cord:GOLD,fringe:true});
  shoes(ctx,{color:IVORY,sole:GOLD,top:.22,boot:true,t:.012,mat:'leather',soleH:.014});
  hairCap(ctx,{color:HAIR,bun:[.17,-.055,.038],t:.01});
  hairTail(ctx,{name:'highPonytail',color:HAIR,root:[0,.17,-.085],dir:[0,-1,-.28],length:.72,n:10,strands:7,width:.016,bow:.10,tie:GOLD,radius:.026});
  // Side locks soften the face without covering the eyes.
  for(const sign of [-1,1])hairTail(ctx,{name:'sideLock'+sign,color:HAIR,root:[sign*.062,.095,.035],dir:[sign*.10,-1,.08],length:.17,n:5,strands:2,width:.005,bow:.005});
  // Layered swept fringe: curved tapered locks, bound to the head in true 3D.
  for(const sign of [-1,1])for(let k=0;k<6;k++){
    const pts=[];for(let i=0;i<=16;i++){const t=i/16;pts.push([sign*(.006+k*.005+.060*t),.147-.055*t-.045*t*t,.070+.024*Math.sin(t*Math.PI)-.018*t]);}
    const m=tube(pts,t=>.006*(1-t*.85),{sides:7,samples:40,flat:.5});paint(m,{color:HAIR});xform(m,headMatrix(ctx));skinRigid(m,BONE_INDEX.head);ctx.asm.add('hair',m);
  }
  // Fine gold botanical embroidery follows the garment surface, not a flat overlay.
  for(const sign of [-1,1])for(let j=0;j<3;j++){
    const pts=[];for(let i=0;i<22;i++){const t=i/21,a=t*Math.PI*2.5;pts.push([(sign*(.055+j*.025)+Math.cos(a)*.014*t)*s,(1.18+j*.043+Math.sin(a)*.026*t)*s,(.143-j*.004)*s]);}
    ornament(ctx,pts,.0012*s,GOLD,'body');
  }
  flower(ctx,[0,.19,-.043],.025);flower(ctx,[-.04,.166,-.035],.018);flower(ctx,[.04,.166,-.035],.018);
  flower(ctx,[-.19*s,1.36*s,.069*s],.027*s,false);
  // Frog fastenings on the closed Chinese front, with a gold centre seam.
  for(const y of [1.33,1.275,1.22,1.165]){
   const z=(y>1.26?.145:.125)*s;const pts=[[-.032*s,y*s,z],[-.014*s,(y+.007)*s,z],[0,y*s,z],[.014*s,(y+.007)*s,z],[.032*s,y*s,z]];
   ornament(ctx,pts,.002*s,GOLD,'body');
  }
  for(const sign of [-1,1]){
   ornament(ctx,[[sign*.077,.02,.005],[sign*.083,-.025,.012],[sign*.08,-.065,.01]],.002,GOLD,'head',true);
   const start=V(sign*.14*s,1.02*s,.15*s);
   ribbon(ctx,{name:'waistTassel'+sign,parent:'hips',start,dir:V(sign*.06,-1,.08).normalize(),length:.26*s,n:5,width:.009*s,side:V(1,0,0),color:GOLD,color2:GOLD,mask:COL.LEGS|COL.PELVIS,fringe:true,flutter:.3,stiff:.4});
  }
 }
};}
