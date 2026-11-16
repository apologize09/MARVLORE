import test from 'node:test';
import assert from 'node:assert/strict';
import {servicesListFrame} from '../src/services/title-motion.js';

test('service entries remain hidden during the title and settle fully before leaving the screen',()=>{
 for(let i=0;i<10;i++){
  assert.equal(servicesListFrame(.5,i,900).opacity,0);
  assert.deepEqual(servicesListFrame(.9,i,900),{opacity:1,blur:0,y:0});
 }
});
test('scrolling back and forth yields the same frame without replaying or retaining an entrance',()=>{
 const checkpoints=[.57,.62,.69,.77,.84];
 const original=checkpoints.map(p=>servicesListFrame(p,4,900));
 for(const p of [1,.82,.61,.73,.55,.9])servicesListFrame(p,4,900);
 assert.deepEqual(checkpoints.map(p=>servicesListFrame(p,4,900)),original);
 assert.ok(servicesListFrame(.66,1,900).opacity>servicesListFrame(.66,6,900).opacity);
});
