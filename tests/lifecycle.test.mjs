import test from 'node:test';import assert from 'node:assert/strict';
import {disposeActor,releasePlaceholder} from '../dist/lifecycle.mjs';
import {isCounterWindow} from '../dist/animation.mjs';
test('replacement releases detached geometry before it becomes unreachable',()=>{let freed=0;const part={traverse(fn){fn({geometry:{dispose(){freed++}}})}},body={children:[part],remove(p){this.children=this.children.filter(v=>v!==p)}};releasePlaceholder({body});assert.equal(freed,1);assert.equal(body.children.length,0)});
test('cleanup is idempotent and releases warning and actor resources',()=>{let warningFreed=0,freed=0;const actor={group:{},warning:{geometry:{dispose(){warningFreed++}},material:{dispose(){warningFreed++}}},dispose(){freed++}};const scene={remove(){}};disposeActor(actor,scene);disposeActor(actor,scene);assert.equal(actor.removed,true);assert.equal(freed,1);assert.equal(warningFreed,2)});
test('a counter cannot be carried into a restarted clock',()=>{assert.equal(isCounterWindow(.1,100),false);assert.equal(isCounterWindow(100.3,100),true);assert.equal(isCounterWindow(101,100),false)});
