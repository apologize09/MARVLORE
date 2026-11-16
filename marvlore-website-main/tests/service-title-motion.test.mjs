import test from 'node:test';
import assert from 'node:assert/strict';
import {servicesTitleFrame,TAGS_ENTER_AT} from '../src/services/title-motion.js';
const metrics=[{top:260,height:70},{top:330,height:70},{top:420,height:40}];

test('unstarted lines are completely hidden and enter from top to bottom',()=>{
 assert.deepEqual(servicesTitleFrame(0,720,metrics).lines.map(line=>line.opacity),[0,0,0]);
 const first=servicesTitleFrame(.0125,720,metrics).lines;
 assert.ok(first[0].opacity>0);assert.equal(first[1].opacity,0);assert.equal(first[2].opacity,0);
 const second=servicesTitleFrame(.0375,720,metrics).lines;
 assert.ok(second[0].opacity>second[1].opacity);assert.ok(second[1].opacity>0);assert.equal(second[2].opacity,0);
 assert.ok(servicesTitleFrame(.22,720,metrics).lines.every(line=>line.opacity===1));
});

test('each line rises continuously from below while becoming clear',()=>{
 for(let index=0;index<3;index++){
  const before=servicesTitleFrame(index*.025,720,metrics).lines[index];
  const middle=servicesTitleFrame(index*.025+.08,720,metrics).lines[index];
  const after=servicesTitleFrame(index*.025+.16+.000001,720,metrics).lines[index];
  assert.ok(before.enterY>=120);assert.equal(before.opacity,0);
  assert.ok(middle.enterY>0&&middle.enterY<before.enterY);
  assert.ok(middle.opacity>0&&middle.opacity<1);assert.ok(middle.blur>0&&middle.blur<4);
  assert.equal(after.enterY,0);assert.equal(after.opacity,1);assert.equal(after.blur,0);
 }
});

test('exit only fades lines after they have moved close to the top edge',()=>{
 let sawTopGoneWithLastClear=false;
 for(let p=.34;p<TAGS_ENTER_AT;p+=.001){
  const frame=servicesTitleFrame(p,720,metrics);
  frame.lines.forEach((line,index)=>{
   if(line.opacity<.999){assert.ok(metrics[index].top+frame.y<720*.12);assert.ok(line.leaveY<0,'each departing line also moves upward on its own');}
  });
  if(frame.lines[0].opacity===0&&frame.lines[2].opacity===1)sawTopGoneWithLastClear=true;
 }
 assert.ok(sawTopGoneWithLastClear);
 const end=servicesTitleFrame(TAGS_ENTER_AT,720,metrics);
 assert.ok(end.lines.every(line=>line.opacity===0));
 assert.ok(metrics.every(line=>line.top+line.height+end.y<0));
});
