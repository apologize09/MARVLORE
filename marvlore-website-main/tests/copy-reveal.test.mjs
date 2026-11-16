import test from 'node:test';
import assert from 'node:assert/strict';
import {copyRevealRange} from '../src/about/copy-reveal-range.js';
test('all twelve lines start and finish in top-to-bottom order',()=>{
 const ranges=Array.from({length:12},(_,i)=>copyRevealRange(i,12,3200,900));
 ranges.forEach((range,i)=>{assert.ok(range.end>range.start);if(i){assert.ok(range.start>ranges[i-1].start);assert.ok(range.end>ranges[i-1].end);}});
 assert.ok(Math.abs(ranges.at(-1).end-(3200+440/2-900*.58))<.001);
});

test('all copy is clear before its actual center reaches the viewport center',()=>{
 for(const height of [720,948,1080,1440])for(const copyHeight of [400,440,520]){
  const centeredScroll=3200+copyHeight/2-height/2;
  for(let index=0;index<12;index++){
   const range=copyRevealRange(index,12,3200,height,copyHeight);
   assert.ok(range.end<=centeredScroll-height*.079);
  }
 }
});

test('line fades have enough scroll distance to see the motion at desktop heights',()=>{
 for(const height of [720,900,1080]){
  const first=copyRevealRange(0,12,3200,height);
  assert.ok(first.end-first.start>=height*.26);
 }
});
test('last line completes while the full copy still fits in desktop view',()=>{
 for(const height of [720,900,1080]){
  const last=copyRevealRange(11,12,3200,height),top=3200-last.end;
  assert.ok(top>=0);assert.ok(top+440<height);
 }
});
