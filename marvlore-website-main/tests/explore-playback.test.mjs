import test from 'node:test';
import assert from 'node:assert/strict';
import {createExplorePlayback} from '../dist/explore-playback.js';
import {createDirectWall} from '../dist/explore-direct-wall.js';

const run=(state,seconds,options)=>{for(let i=0;i<Math.ceil(seconds*60);i++)state.step(1/60,options);};
const settle=(state,progress)=>{state.setProgress(progress);run(state,4);};

test('fast scroll captures the displayed flight immediately, exactly once, with no timed stall',()=>{
 const state=createExplorePlayback();run(state,.2);const displayed=state.flightTime;
 state.setProgress(.6);assert.equal(state.captureTime,displayed);
 run(state,.2);assert.ok(state.morph>0);assert.equal(state.captureVersion,1);
 run(state,20);assert.equal(state.flightTime,displayed);assert.equal(state.captureTime,displayed);
});

test('return starts from the current rotated wall and preserves that orientation throughout the transition',()=>{
 const state=createExplorePlayback();run(state,3);settle(state,1);run(state,90);state.rotate(17*Math.PI);
 const frozen=state.captureTime,phase=state.rotation;
 const passage=createDirectWall(1440,900,Array.from({length:60},()=>({})),new Map());
 const sample=()=>passage.frame(.5,state.rotation).map(item=>[item.index,passage.vertex(item.pose,.25,.75)]);
 const expected=sample();
 state.setProgress(.98);assert.equal(state.rotation,phase);
 run(state,.2);assert.equal(state.rotation,phase);
 settle(state,.5);assert.equal(state.rotation,phase);
 assert.equal(state.captureTime,frozen);assert.equal(state.captureVersion,1);
 assert.deepEqual(sample(),expected);
 settle(state,.2);settle(state,.5);assert.deepEqual(sample(),expected);
});

test('an interrupted return uses the same capture and reverses from its current pose',()=>{
 const state=createExplorePlayback();run(state,3);settle(state,1);
 const capture=state.captureTime;state.setProgress(.15);run(state,.2);
 const before=state.morph;assert.ok(before<1&&before>.15);
 state.setProgress(.8);assert.equal(state.morph,before);
 run(state,3);assert.ok(Math.abs(state.morph-.8)<.001);
 assert.equal(state.captureTime,capture);assert.equal(state.captureVersion,1);
});

test('free flight resumes only after the return is complete and recaptures its current frame',()=>{
 const state=createExplorePlayback();run(state,3);settle(state,.6);
 const first=state.captureTime;settle(state,0);
 assert.equal(state.morph,0);assert.equal(state.captureTime,null);
 run(state,2);assert.ok(state.flightTime>first);
 const next=state.flightTime;state.setProgress(.3);
 assert.equal(state.captureTime,next);assert.equal(state.captureVersion,2);
});

test('reduced motion and wall dragging do not accumulate an autonomous phase',()=>{
 const state=createExplorePlayback();state.setProgress(1,true);
 assert.equal(state.morph,1);assert.equal(state.captureTime,0);
 run(state,20,{reduced:true});assert.equal(state.rotation,0);
 state.rotate(.7);run(state,20,{dragging:true});assert.ok(Math.abs(state.rotation-.7)<1e-10);
 state.setProgress(.7,true);assert.equal(state.rotation,.7);assert.equal(state.captureTime,0);
});


test('changing scroll direction preserves position and velocity at the interruption',()=>{
 const state=createExplorePlayback();state.setProgress(1);run(state,.12);
 const before=state.morph,speed=state.velocity;
 state.setProgress(.1);assert.equal(state.morph,before);assert.equal(state.velocity,speed);
 run(state,1);assert.ok(Math.abs(state.morph-.1)<.001);assert.ok(Math.abs(state.velocity)<.01);
});

test('small scroll oscillations near the entry do not discard and recapture cards',()=>{
 const state=createExplorePlayback();run(state,2);state.setProgress(.15);run(state,1);
 const capture=state.captureTime;
 for(let i=0;i<4;i++){
  state.setProgress(0,false,{releaseFlight:false});run(state,1);
  assert.equal(state.morph,0);assert.equal(state.captureTime,capture);
  state.setProgress(.15,false,{releaseFlight:false});run(state,1);
 }
 assert.equal(state.captureVersion,1);
 state.setProgress(0,false,{releaseFlight:true});run(state,1);assert.equal(state.captureTime,null);
});

test('skipping the whole section synchronizes its endpoint before it becomes visible again',()=>{
 const state=createExplorePlayback();state.setProgress(1);run(state,.05);assert.ok(state.morph<1);
 const capture=state.captureTime;state.synchronize();assert.equal(state.morph,1);assert.equal(state.velocity,0);
 assert.equal(state.captureTime,capture);
 state.setProgress(0);state.synchronize();assert.equal(state.morph,0);assert.equal(state.captureTime,null);
});

test('progress follows the same damping at 30, 60 and 120 frames per second',()=>{
 const values=[30,60,120].map(fps=>{const state=createExplorePlayback();state.setProgress(.8);for(let i=0;i<fps*.5;i++)state.step(1/fps);return state.morph;});
 assert.ok(Math.max(...values)-Math.min(...values)<1e-10);
});
