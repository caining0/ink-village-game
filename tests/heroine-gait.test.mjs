import {test} from 'node:test';import assert from 'node:assert/strict';
import {GAIT_STYLES} from '../dist/vendor/longwind/character/clips/locomotion.js';
test('heroine stroll keeps short narrow steps, almost forward toes and quiet upper-body motion',()=>{const s=GAIT_STYLES.heroine;assert.ok(s);for(const speed of [.8,1.6,1.8]){assert.ok(s.stepLen(speed)<=.58);assert.ok(s.width(speed)>=.045&&s.width(speed)<=.075);assert.ok(s.toeOut(speed)<=2);assert.ok(s.bobW(speed)<=.012);assert.ok(s.arm(speed)<=.07);assert.ok(s.lift(speed)<=.065);}});
