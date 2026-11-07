import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,toggleFlight,stepFlight} from '../dist/qinggong.mjs';

test('takeoff lifts from ground and stays available after a long flight',()=>{
 const f=createFlight();toggleFlight(f);
 let y=.43;
 for(let i=0;i<3600;i++) {const out=stepFlight(f,{height:y,ascend:i<60,descend:false,dash:false},1/60);y=Math.min(22.39,y+out.vertical/60);}
 assert.equal(f.mode,'flight');assert.ok(y>2);assert.ok(y<=22.39);
});
test('ceiling arrests ascent and descent remains available',()=>{
 const f=createFlight();toggleFlight(f);
 assert.ok(stepFlight(f,{height:22.39,ascend:true},.1).vertical<=0);
 assert.ok(stepFlight(f,{height:22.39,descend:true},.1).vertical<0);
});
test('toggle glides gently to ground without relaunching',()=>{
 const f=createFlight();toggleFlight(f);toggleFlight(f);
 const glide=stepFlight(f,{height:5},.1);assert.ok(glide.vertical<0&&glide.vertical>=-3);
 stepFlight(f,{height:.43},.1);assert.equal(f.mode,'ground');
 assert.equal(stepFlight(f,{height:.43},.1).active,false);
});
test('descent lands, dash is faster, and large frame gaps cannot destabilize velocity',()=>{
 const f=createFlight();toggleFlight(f);
 assert.ok(stepFlight(f,{height:5,dash:true},30).speed>stepFlight(f,{height:5},.1).speed);
 assert.ok(Number.isFinite(f.vertical));
 stepFlight(f,{height:.43,descend:true},.1);assert.equal(f.mode,'ground');
});
