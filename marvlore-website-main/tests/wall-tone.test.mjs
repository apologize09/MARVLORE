import test from 'node:test';
import assert from 'node:assert/strict';
import {wallCardHit,pickWallCard,wallToneProgress} from '../dist/wall-tone.js';
import {createDirectWall} from '../dist/explore-direct-wall.js';

const quad=[{x:-100,y:80,z:0},{x:100,y:80,z:0},{x:100,y:-80,z:0},{x:-100,y:-80,z:0}];
test('hover excludes empty canvas, card gaps, and clipped round corners',()=>{
 assert.equal(wallCardHit(quad,{x:101,y:0},1.25),null);
 assert.equal(wallCardHit(quad,{x:-100,y:80},1.25),null);
 assert.ok(wallCardHit(quad,{x:-90,y:70},1.25));
 assert.deepEqual(wallCardHit(quad,{x:0,y:0},1.25),{u:.5,v:.5,z:0});
});

const flatVertex=(pose,u,v)=>({x:(u-.5)*200,y:(.5-v)*160,z:pose.z});
const flat=(index,z,extra={})=>({index,pose:{z,w:200,h:160,alpha:1,weight:1,...extra}});
test('only the frontmost card beneath the pointer restores colour',()=>{
 const items=[flat(4,0),flat(9,30)];
 assert.equal(pickWallCard(items,flatVertex,{x:0,y:0,active:true}),9);
 assert.equal(pickWallCard(items,flatVertex,{x:0,y:0,active:false}),-1);
 assert.equal(pickWallCard(items,flatVertex,{x:250,y:0,active:true}),-1);
});
test('hidden and still-landing cards do not become hover targets',()=>{
 assert.equal(pickWallCard([flat(0,0,{alpha:0}),flat(1,0,{weight:.5})],flatVertex,{x:0,y:0,active:true}),-1);
});

test('hit testing follows the actual rotating wall projection',()=>{
 const wall=createDirectWall(1440,900,Array.from({length:60},()=>({})),new Map());
 for(const rotation of [0,.35,-1,2.3]){
  const items=wall.frame(1,rotation);
  const middle=items.filter(item=>item.pose.target.alpha&&item.pose.entry.slot%3===1)
   .sort((a,b)=>Math.abs(wall.vertex(a.pose,.5,.5).x)-Math.abs(wall.vertex(b.pose,.5,.5).x))[0];
  const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>wall.vertex(middle.pose,u,v));
  const point=wall.vertex(middle.pose,.25,.75);
  const hit=wallCardHit(corners,point,middle.pose.w/middle.pose.h);
  assert.ok(hit);
  assert.ok(Math.abs(hit.u-.25)<1e-7);
  assert.ok(Math.abs(hit.v-.75)<1e-7);
  assert.equal(pickWallCard(items,(pose,u,v)=>wall.vertex(pose,u,v),{...wall.vertex(middle.pose,.5,.5),active:true}),middle.index);
 }
});

test('the mask stays off for free flight and fades in only as the wall settles',()=>{
 for(const morph of [0,.2,.5,.82])assert.equal(wallToneProgress(morph),0);
 assert.ok(wallToneProgress(.9)>0&&wallToneProgress(.9)<1);
 assert.equal(wallToneProgress(1),1);
 assert.equal(wallToneProgress(2),1);
});
