import test from 'node:test';
import assert from 'node:assert/strict';
import {directCylinderClock,directCylinderDuration,directCylinderPose,directCylinderTiming,directSequenceDuration,DIRECT_ENTRANCE,DIRECT_TITLE_END} from '../src/hero/direct-cylinder-entrance.js';
import {cylinderIntroClock} from '../src/hero/cylinder-entrance.js';

const count=8;
const radius=500*1.25/(2*Math.sin(Math.PI/count));
const sample=(time,index=0,direction=-1)=>directCylinderPose({time,index,count,width:1500,height:650,cardWidth:500,radius,direction});

test('cards fly into native seats without a circle or camera morph stage',()=>{
 for(let t=0;t<=directCylinderDuration(count);t+=.01){
  const clock=directCylinderClock(t,count);
  assert.ok(['title','direct-flight','rotation'].includes(clock.stage));
 }
 for(let index=0;index<count;index++){
  const pose=sample(directCylinderDuration(count),index);
  const radians=index/count*Math.PI*2;
  assert.ok(Math.abs(pose.x-radius*Math.sin(radians))<1e-8);
  assert.ok(Math.abs(pose.z-radius*Math.cos(radians))<1e-8);
  assert.equal(pose.y,0);
  assert.ok(pose.roll===0);
  assert.ok(Math.abs(Math.cos(pose.yaw*Math.PI/180)-Math.cos(radians))<1e-8);
  assert.equal(pose.scale,1);
  assert.equal(pose.opacity,1);
 }
});

test('card flight starts with the original title lift while the title keeps its full animation',()=>{
 for(let t=0;t<=DIRECT_TITLE_END+.1;t+=.01){
  const original=cylinderIntroClock(t,count),direct=directCylinderClock(t,count);
  assert.equal(direct.titleLift,original.titleLift);
  assert.equal(direct.titleScale,original.titleScale);
 }
 const liftStart=1.6;
 for(let t=0;t<=liftStart;t+=.01){
  assert.equal(directCylinderClock(t,count).stage,'title');
  for(let index=0;index<count;index++)assert.equal(sample(t,index).opacity,0);
 }
 assert.equal(directCylinderClock(liftStart,count).titleLift,0);
 assert.equal(directCylinderClock(liftStart,count).stage,'direct-flight');
 const lifting=directCylinderClock(liftStart+.15,count);
 assert.ok(lifting.titleLift>0&&lifting.titleLift<1);
 assert.ok(Array.from({length:count},(_,index)=>sample(liftStart+.15,index)).some(pose=>pose.opacity>0));
 assert.ok(directCylinderDuration(count)>DIRECT_TITLE_END);
 const landing=directCylinderClock(directCylinderDuration(count),count);
 assert.equal(landing.stage,'rotation');
 assert.equal(landing.titleLift,1);
 assert.equal(directCylinderClock(DIRECT_TITLE_END,count).titleLift,1);
 assert.equal(directCylinderClock(DIRECT_TITLE_END,count).titleScale,1);
});

test('halo remains invisible until every card lands and rotation has begun',()=>{
 const landed=directCylinderDuration(count),haloStart=landed+DIRECT_ENTRANCE.rotationLead;
 for(let t=0;t<=haloStart;t+=.01)assert.equal(directCylinderClock(t,count).halo,0);
 assert.equal(directCylinderClock(landed,count).stage,'rotation');
 assert.equal(directCylinderClock(haloStart,count).halo,0);
 assert.equal(directCylinderClock(haloStart+.2,count).stage,'halo');
 assert.ok(directCylinderClock(haloStart+.2,count).halo>0);
 assert.ok(Math.abs(directCylinderClock(directSequenceDuration(count),count).halo-1)<1e-12);
});

test('halo opacity has a smooth monotonic fade with no endpoint jumps',()=>{
 const start=directCylinderDuration(count)+DIRECT_ENTRANCE.rotationLead,end=directSequenceDuration(count);
 let previous=0;
 for(let t=start;t<=end+.01;t+=.005){
  const opacity=directCylinderClock(t,count).halo;
  assert.ok(opacity>=previous&&opacity<=1);
  previous=opacity;
 }
 assert.ok(directCylinderClock(start+.001,count).halo<1e-7);
 assert.ok(1-directCylinderClock(end-.001,count).halo<1e-7);
});

test('all cards share the same offscreen right-side entry and arrive sequentially',()=>{
 const first=sample(0);
 for(let index=0;index<count;index++){
  const pose=sample(0,index);
  assert.ok(pose.x>1500/2+500/2);
  assert.deepEqual(pose,first);
  assert.equal(pose.opacity,0);
 }
 const early=Array.from({length:count},(_,index)=>sample(DIRECT_ENTRANCE.delay+.03,index).opacity);
 assert.equal(early.filter(opacity=>opacity>0).length,1);
});

test('cards travel around the native ring in one direction without reversing or overshooting',()=>{
 for(const direction of [-1,1])for(let index=0;index<count;index++){
  const timing=directCylinderTiming(index,count,direction);
  let previous=0;
  for(let t=0;t<directCylinderDuration(count)+.1;t+=.005){
   const pose=sample(t,index,direction),travel=(pose.angle-timing.entry)*direction;
   assert.ok(travel>=previous-1e-8&&travel<=timing.travel+1e-8);
   assert.ok(pose.opacity>=0&&pose.opacity<=1);
   assert.ok(pose.scale>0&&pose.scale<=1);
   if(t>timing.start+DIRECT_ENTRANCE.flight*DIRECT_ENTRANCE.feed){
    assert.ok(Math.abs(Math.hypot(pose.x,pose.z)-radius)<1e-8);
    assert.equal(pose.y,0);
   }
   previous=travel;
  }
  const end=sample(timing.end,index,direction),near=sample(timing.end-.001,index,direction);
  assert.ok(Math.hypot(near.x-end.x,near.y-end.y,near.z-end.z)<.0001);
 }
});

test('lead cards keep their order as the shared path opens into evenly spaced seats',()=>{
 for(const direction of [-1,1]){
  const order=Array.from({length:count},(_,index)=>index).sort((a,b)=>directCylinderTiming(a,count,direction).rank-directCylinderTiming(b,count,direction).rank);
  for(let t=DIRECT_ENTRANCE.delay;t<=directCylinderDuration(count);t+=.01){
   const angles=order.map(index=>sample(t,index,direction).angle*direction);
   for(let rank=1;rank<count;rank++)assert.ok(angles[rank-1]>=angles[rank]-1e-8);
  }
 }
});

test('arriving covers reveal a broad face softly instead of appearing edge-on',()=>{
 for(let index=0;index<count;index++){
  const {start}=directCylinderTiming(index,count);
  const pose=sample(start+DIRECT_ENTRANCE.flight*.15,index);
  assert.ok(Math.cos(pose.yaw*Math.PI/180)>.85);
  assert.ok(pose.opacity>.05&&pose.opacity<.4);
  assert.ok(pose.scale>=.94&&pose.scale<1);
  assert.ok(Math.abs(pose.roll)<2);
 }
});

test('each flight has zero arrival velocity for a smooth rotation handoff',()=>{
 for(let index=0;index<count;index++){
  const {end}=directCylinderTiming(index,count);
  const epsilon=.0001,a=sample(end-epsilon,index),b=sample(end,index);
  assert.ok(Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)/epsilon<.01);
  assert.ok(Math.abs(b.yaw-a.yaw)/epsilon<.01);
 }
});
