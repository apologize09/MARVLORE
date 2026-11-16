import test from 'node:test';
import assert from 'node:assert/strict';
import {createTagPhysics,TAG_STEP} from '../src/services/tag-physics.js';
import {serviceTagAssets} from '../dist/service-tag-assets.js';
import {serviceTagRows} from '../dist/service-tags.js';

test('a single level tag visually settles at the bottom of the arena',()=>{
 const height=400,sim=createTagPhysics({sizes:[{width:200,height:100}],width:1000,height,spawnOffset:500,random:()=>.5});
 for(let i=0;i<2000;i++)sim.advance(TAG_STEP);
 const body=sim.bodies[0];
 assert.ok(Math.abs((body.position.y+50)-height)<2,'rendered bottom should touch the viewport floor');
 sim.destroy();
});

function fixture(seed=19){
 let state=seed;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
 const width=1440,height=width*954/3450;
 const sizes=serviceTagRows.flat().map(({id})=>({width:serviceTagAssets[id].width/3450*width*.7475,height:serviceTagAssets[id].height/3450*width*.7475}));
 return createTagPhysics({sizes,width,height,spawnOffset:900-height,random});
}

test('60 Hz and 120 Hz renders produce the same falling trajectories',()=>{
 const a=fixture(),b=fixture();
 for(let i=0;i<360;i++){a.advance(TAG_STEP*2);b.advance(TAG_STEP);b.advance(TAG_STEP);}
 a.bodies.forEach((body,i)=>{assert.ok(Math.abs(body.position.x-b.bodies[i].position.x)<1e-6);assert.ok(Math.abs(body.position.y-b.bodies[i].position.y)<1e-6);});
 a.destroy();b.destroy();
});

test('all 21 scaled tags fall into the screen without downward speed spikes',()=>{
 for(const seed of [3,19,81]){
  const sim=fixture(seed);
  for(let step=0;step<1440;step++){
   const before=sim.bodies.map(b=>({released:b.plugin.released,y:b.velocity.y}));
   sim.advance(TAG_STEP);
   sim.bodies.forEach((b,i)=>{if(before[i].released&&!b.isSleeping)assert.ok(b.velocity.y-before[i].y<=.22001,'a contact must not abruptly accelerate a tag downwards');});
  }
  assert.equal(sim.bodies.filter(b=>b.plugin.released).length,21);
  for(const b of sim.bodies){assert.ok(b.bounds.min.y+502>0);assert.ok(b.bounds.max.y<400);assert.ok(b.bounds.min.x>0);assert.ok(b.bounds.max.x<1440);}
  sim.destroy();
 }
});

test('impacts produce a small elastic response which settles',()=>{
 const sim=fixture(19);let maxSquash=0,upward=false;
 for(let i=0;i<2400;i++){
  sim.advance(TAG_STEP);
  for(const b of sim.bodies){maxSquash=Math.max(maxSquash,Math.abs(b.plugin.impact.value));if(b.plugin.released&&b.position.y>0&&b.velocity.y<-.1)upward=true;}
 }
 assert.ok(upward,'at least one tag should rebound after an impact');
 assert.ok(maxSquash>.03&&maxSquash<=.10001,'contact deformation must be visible and bounded');
 assert.ok(sim.bodies.every(b=>Math.abs(b.plugin.impact.value)<.001),'elastic response should settle');
 sim.destroy();
});
