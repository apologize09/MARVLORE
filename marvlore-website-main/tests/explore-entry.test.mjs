import test from 'node:test';
import assert from 'node:assert/strict';
import {FLIGHT_PREROLL,exploreBackgroundVisibility} from '../dist/explore-entry.js';
import {createExplorePlayback} from '../dist/explore-playback.js';
import {makeFlight,flightPose,sheetVertex,RELEASE_INTERVAL} from '../dist/explore-flight.js';

test('sheets unfold into view one by one without a populated first frame or a long blank lead-in',()=>{
 for(const [width,height] of [[1280,870],[1440,900],[1920,1080]]){
  const count=elapsed=>{
   const time=FLIGHT_PREROLL+elapsed;let visible=0;
   for(let id=0;id<=Math.floor(time/RELEASE_INTERVAL);id++){
    const flight=makeFlight(id,width,height),age=time-id*RELEASE_INTERVAL;
    const point=sheetVertex(flight,flightPose(flight,age),.5,.5);
    if(age<flight.life&&point.alpha>.25&&Math.abs(point.x)<width/2&&Math.abs(point.y)<height/2)visible++;
   }
   return visible;
  };
  assert.ok(count(0)<=1,'The background should not appear as a complete group');
  assert.ok(count(1.5)>=1,`${width}×${height}: the first sheet should arrive promptly`);
  assert.ok(count(3)>=4,`${width}×${height}: later sheets should keep flowing into view`);
  assert.ok(count(3)>count(1.5));
 }
});

test('background arrives before pinning and uses the same opacity when scrolling back',()=>{
 assert.equal(exploreBackgroundVisibility(-1),0);
 assert.ok(exploreBackgroundVisibility(-.3)>.2);
 assert.ok(exploreBackgroundVisibility(0)>.95);
 assert.equal(exploreBackgroundVisibility(.1),1);
 const positions=[-.5,-.3,-.1,0,.1];
 const forward=positions.map(exploreBackgroundVisibility);
 assert.deepEqual([...positions].reverse().map(exploreBackgroundVisibility).reverse(),forward);
 assert.ok(forward.every((value,index)=>index===0||value>=forward[index-1]));
});

test('pre-roll happens once and the captured flight clock resumes continuously after returning',()=>{
 const state=createExplorePlayback({initialFlightTime:FLIGHT_PREROLL});
 assert.equal(state.flightTime,FLIGHT_PREROLL);
 state.step(.1);assert.equal(state.flightTime,FLIGHT_PREROLL+.1);
 state.setProgress(.6);const captured=state.captureTime;
 for(let i=0;i<180;i++)state.step(1/60);
 assert.equal(state.flightTime,captured);
 state.setProgress(0);
 for(let i=0;i<180;i++)state.step(1/60);
 assert.equal(state.captureTime,null);
 assert.ok(state.flightTime>captured);
 const resumed=state.flightTime;
 state.setProgress(.2);assert.equal(state.captureTime,resumed);
 assert.equal(state.captureVersion,2);
});
