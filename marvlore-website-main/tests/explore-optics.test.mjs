import test from 'node:test';
import assert from 'node:assert/strict';
import {depthDefocus,motionVectorUV,passageOptics,edgeOpacity} from '../dist/explore-optics.js';

test('nearest ring cards stay sharp and the rear hemisphere gains progressively stronger defocus',()=>{
 for(const focus of [140,230,288]){
  assert.equal(depthDefocus(focus,focus),0);
  assert.equal(depthDefocus(focus*.8,focus),0);
  const values=[.5,0,-.5,-1].map(t=>depthDefocus(focus*t,focus));
  values.forEach((v,i)=>{assert.ok(Number.isFinite(v));if(i)assert.ok(v>values[i-1]);});
  assert.equal(values.at(-1),passageOptics.farBlur);
 }
});

test('motion exposure follows actual speed with the same strength at 30, 60 and 120 Hz',()=>{
 const values=[30,60,120].map(hz=>motionVectorUV(600/hz,0,1/hz,200,0,0,200));
 values.forEach(v=>{assert.ok(Math.abs(v[0]-.05)<1e-10);assert.equal(v[1],0);});
 const slower=motionVectorUV(100/60,0,1/60,200,0,0,200);
 assert.ok(slower[0]<values[0][0]);
 assert.deepEqual(motionVectorUV(0,0,1/60,200,0,0,200),[0,0]);
});

test('projected motion remains aligned on rotated cards and reverses with movement',()=>{
 const vector=motionVectorUV(8,0,1/60,0,200,-200,0);
 assert.equal(vector[0],0);assert.ok(vector[1]<0);
 const reversed=motionVectorUV(-8,0,1/60,0,200,-200,0);
 assert.ok(Math.abs(reversed[1]+vector[1])<1e-10);
});

test('edge-on cards, pauses and discontinuities do not create unbounded blur',()=>{
 assert.deepEqual(motionVectorUV(8,0,0,200,0,0,200),[0,0]);
 assert.deepEqual(motionVectorUV(8,0,.5,200,0,0,200),[0,0]);
 assert.deepEqual(motionVectorUV(500,0,1/60,200,0,0,200),[0,0]);
 assert.deepEqual(motionVectorUV(8,0,1/60,200,0,200,.001),[0,0]);
 assert.deepEqual(motionVectorUV(8,0,1/60,200,0,0,200,0),[0,0]);
 const max=motionVectorUV(200,100,1/120,40,0,0,40);
 assert.ok(Math.hypot(...max)<=passageOptics.maxUvTravel+1e-10);
});

test('edge-on silhouettes fade smoothly without stamping a dark stripe across blurred cards',()=>{
 assert.equal(edgeOpacity(0),0);assert.equal(edgeOpacity(.3),1);
 assert.equal(edgeOpacity(0,0),1);assert.equal(edgeOpacity(0,.5),.5);
 let previous=0;
 for(let i=0;i<=100;i++){
  const facing=i/100,value=edgeOpacity(facing);
  assert.ok(value>=previous&&value<=1);assert.equal(value,edgeOpacity(-facing));previous=value;
 }
 assert.ok(edgeOpacity(.04001)<1e-7);
 assert.ok(1-edgeOpacity(.29999)<1e-7);
});
