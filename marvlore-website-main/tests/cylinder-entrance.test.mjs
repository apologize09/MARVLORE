import test from 'node:test';
import assert from 'node:assert/strict';
import {cylinderIntroClock,cylinderIntroPose,cylinderIntroTiming,CYLINDER_ENTRANCE} from '../src/hero/cylinder-entrance.js';

const count=8,timing=cylinderIntroTiming(count);
const dimensions={count,width:1300,height:490,centerY:55,cardWidth:396,cardHeight:396*9/16,radius:646};
const sample=(time,index=0,settings={})=>cylinderIntroPose({...dimensions,...settings,time,index});

test('all cards enter sequentially from outside the same right edge',()=>{
 for(const [width,height] of [[1000,480],[1300,490],[2000,800]])for(let index=0;index<count;index++){
  const pose=sample(0,index,{width,height});
  assert.ok(pose.x-dimensions.cardWidth*pose.scale/2 > width/2);
  assert.equal(pose.opacity,0);
 }
 assert.ok(sample(CYLINDER_ENTRANCE.delay+.1).opacity>0);
 assert.equal(sample(CYLINDER_ENTRANCE.delay+.1,count-1).opacity,0);
});

test('title starts at half size with the same shrink and reaches unchanged top size',()=>{
 const end=CYLINDER_ENTRANCE.delay+1.1;
 assert.equal(cylinderIntroClock(0,count).titleScale,.54);
 assert.ok(cylinderIntroClock(.9,count).titleScale<cylinderIntroClock(0,count).titleScale);
 assert.equal(cylinderIntroClock(end,count).titleScale,1);
 assert.equal(cylinderIntroClock(end,count).titleLift,1);
});

test('cards follow the same clockwise arc from the right-side stack',()=>{
 for(let index=0;index<count;index++){
  const start=timing.unfoldStart;
  const stacked=sample(timing.assembled,index),waiting=sample(start,index);
  if(index<count-1)assert.ok(Math.abs(stacked.x-waiting.x)+Math.abs(stacked.y-waiting.y)<1e-8);
  assert.ok(stacked.x>=stacked.circleRadius);
  const dealt=sample(timing.circleAt,index);
  const theta=Math.PI*2.5-index/count*Math.PI*2;
  assert.ok(Math.abs(dealt.x-Math.cos(theta)*dealt.circleRadius)<1e-8);
  assert.ok(Math.abs(dealt.y-dimensions.centerY-Math.sin(theta)*dealt.circleRadius)<1e-8);
 }
 const front=sample(timing.unfoldStart+CYLINDER_ENTRANCE.dealDuration*.22,0);
 assert.ok(front.y>dimensions.centerY,'front card initially travels down the right side, clockwise');
});

test('the completed circle goes directly into the morph without rotating',()=>{
 assert.ok(timing.circleAt>timing.assembled);
 const poses=Array.from({length:count},(_,index)=>sample(timing.circleAt,index));
 const radii=poses.map(p=>Math.hypot(p.x,p.y-dimensions.centerY));
 assert.ok(Math.max(...radii)-Math.min(...radii)<1e-8);
 assert.ok(timing.morphStart>timing.assembled);
 assert.equal(cylinderIntroClock(timing.circleAt,count).stage,'morph');
 for(let index=0;index<count;index++){
  const pose=poses[index];
  assert.ok(Math.abs(pose.yaw)<1e-8);assert.ok(Math.abs(pose.roll)<1e-8);assert.equal(pose.opacity,1);
  const held=sample(timing.morphStart,index);
  assert.ok(Math.abs(held.x-pose.x)+Math.abs(held.y-pose.y)<1e-8,'no spin is inserted after dealing');
  assert.ok(Math.abs(Math.hypot(held.x,held.y-dimensions.centerY)-radii[index])<1e-8);
 }
});

test('the following chain opens gradually and ends in cylinder projection order',()=>{
 for(const progress of [.2,.45,.7,.95]){
  const time=timing.unfoldStart+progress*CYLINDER_ENTRANCE.dealDuration;
  const poses=Array.from({length:count},(_,index)=>sample(time,index));
  const width=Math.max(...poses.map(p=>p.x))-Math.min(...poses.map(p=>p.x));
  assert.ok(width>0);
 }
 for(let index=0;index<count;index++){
  const p=sample(timing.circleAt,index),base=index/count*Math.PI*2;
  assert.ok(Math.abs(p.x-Math.sin(base)*p.circleRadius)<1e-8);
  assert.ok(Math.abs(p.y-dimensions.centerY-Math.cos(base)*p.circleRadius)<1e-8);
 }
 assert.equal(timing.circleAt,timing.morphStart);
});

test('every circle card fits the desktop content area without changing aspect ratio',()=>{
 for(const [width,height] of [[1000,480],[1300,490],[2000,800]])for(let index=0;index<count;index++){
  const p=sample(timing.circleAt,index,{width,height});
  assert.ok(Math.abs(p.x)+dimensions.cardWidth*p.scale/2<=width/2);
  assert.ok(Math.abs(p.y-dimensions.centerY)+dimensions.cardHeight*p.scale/2<=height/2);
  assert.ok(p.scale>0&&p.scale<=1);
 }
});

test('position, orientation and scale have continuous velocity across each stage seam',()=>{
 const epsilon=1e-5;
 for(const time of [CYLINDER_ENTRANCE.delay,timing.assembled,timing.unfoldStart,timing.circleAt,timing.morphStart,timing.end])for(let index=0;index<count;index++){
  const a=sample(time-epsilon,index),b=sample(time,index),c=sample(time+epsilon,index);
  for(const key of ['x','y','z','yaw','roll','scale','opacity']){
   assert.ok(Math.abs(c[key]-a[key])<.02,`${key} position seam`);
   const left=(b[key]-a[key])/epsilon,right=(c[key]-b[key])/epsilon;
   assert.ok(Math.abs(right-left)<.1,`${key} velocity seam at ${time}`);
  }
 }
});

test('last morph frame matches native cylinder placement, including dragged angle',()=>{
 for(const angle of [0,-37,125])for(let index=0;index<count;index++){
  const p=sample(timing.end,index,{angle}),theta=(index/count*360+angle)*Math.PI/180;
  assert.ok(Math.abs(p.x-Math.sin(theta)*dimensions.radius)<1e-8);
  assert.ok(Math.abs(p.y)<1e-8);
  assert.ok(Math.abs(p.z-Math.cos(theta)*dimensions.radius)<1e-8);
  assert.ok(Math.abs(p.scale-1)<1e-8);assert.ok(Math.abs(p.roll)<1e-8);
  assert.ok(Math.abs(Math.cos(p.yaw*Math.PI/180)-Math.cos(theta))<1e-8);
 }
});
