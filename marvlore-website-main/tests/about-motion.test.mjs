import test from 'node:test';
import assert from 'node:assert/strict';
import {aboutGeometry,aboutMotionFrame} from '../dist/about-motion-model.js';
const dimensions={width:1160,height:720,size:230,drop:140,groupHeights:[125,165,145]};
const g=aboutGeometry(dimensions);

test('three text groups take turns before the third group has completed its hold',()=>{
 for(const [p,index] of [[.18,0],[.46,1],[.74,2]]){
  const frame=aboutMotionFrame(p,g);
  assert.equal(frame.expansion,0);
  frame.groups.forEach((group,i)=>assert.equal(group.opacity,i===index?1:0));
 }
});
test('third group unfolds continuously into three separated readable groups',()=>{
 const before=aboutMotionFrame(.8,g),after=aboutMotionFrame(.800001,g),end=aboutMotionFrame(1,g);
 assert.ok(Math.abs(before.groups[2].y-after.groups[2].y)<.001);
 assert.equal(before.groups[2].opacity,1);
 end.groups.forEach(group=>assert.equal(group.opacity,1));
 for(let i=0;i<2;i++){
  const bottom=end.groups[i].y+g.groupHeights[i]/2;
  const nextTop=end.groups[i+1].y-g.groupHeights[i+1]/2;
  assert.ok(nextTop-bottom>=g.gap-.001);
 }
 assert.ok(end.rows[0].y<before.rows[0].y);
 assert.ok(end.rows[1].y>before.rows[1].y);
 assert.ok(end.rows[1].y+g.arcHeight<=g.height+g.tail);
});
test('card intro and text start together, complete in place and preserve square proportions',()=>{
 const first=aboutMotionFrame(.1,g,0),during=aboutMotionFrame(.1,g,.2),last=aboutMotionFrame(.1,g,1);
 assert.equal(first.groups[0].opacity,0);
 assert.ok(during.groups[0].opacity>0);
 assert.ok(during.cards.some(c=>c.entry>0&&c.entry<1));
 assert.ok(last.cards.every(c=>c.entry===1&&c.scale===1&&c.opacity===1));
 for(let row=0;row<2;row++){
  const cards=last.cards.filter(c=>c.row===row);
  assert.ok(Math.abs((cards[0].x+cards[4].x)/2-cards[2].x)<.001);
 }
});
test('scroll reversal and stage boundaries have no position or opacity discontinuities',()=>{
 for(const p of [.27,.32,.34,.415,.55,.6,.62,.695,.8,.98]){
  const a=aboutMotionFrame(p-1e-6,g),b=aboutMotionFrame(p+1e-6,g);
  a.groups.forEach((v,i)=>{assert.ok(Math.abs(v.y-b.groups[i].y)<.01);assert.ok(Math.abs(v.opacity-b.groups[i].opacity)<.001);});
 }
 const forward=[.1,.5,.9].map(p=>aboutMotionFrame(p,g));
 const reverse=[.9,.5,.1].map(p=>aboutMotionFrame(p,g)).reverse();
 assert.deepEqual(forward,reverse);
});
