import test from 'node:test';
import assert from 'node:assert/strict';
import {createDirectWall,directWallProgress,WALL_SCROLL_START,WALL_SCROLL_END,WALL_SCROLL_LINK,WALL_LAND_END} from '../dist/explore-direct-wall.js';
import {makeFlight,flightPose,sheetVertex} from '../dist/explore-flight.js';

const cards=Array.from({length:60},()=>({}));
const width=1440,height=900;
const flight=makeFlight(6,width,height),pose=flightPose(flight,flight.releaseTime+.7);
const source={f:flight,pose,vertex:(u,v)=>sheetVertex(flight,pose,u,v)};
const wall=createDirectWall(width,height,cards,new Map([[6,source]]));
const item=(p,index=6,rotation=0)=>wall.frame(p,rotation).find(x=>x.index===index).pose;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const world=p=>[p.x*(1000-p.z)/1000,p.y*(1000-p.z)/1000,p.z];

test('direct landing starts from the exact captured curved surface, including its fading edges',()=>{
 for(const u of [-.16,0,.25,.5,1,1.16])for(const v of [0,.5,1]){
  assert.deepEqual(wall.vertex(item(0),u,v),source.vertex(u,v));
 }
});

test('captured cards keep their geometry and land precisely on the existing three-row wall',()=>{
 const u=.5,v=.5,entry=item(0).entry;
 const p=item(WALL_LAND_END*(entry.delay+entry.duration*.5)),start=world(source.vertex(u,v));
 const end=world(wall.vertex(item(WALL_LAND_END),u,v));
 const middle=world(wall.vertex(p,u,v));
 middle.forEach((x,i)=>near(x,start[i]+(end[i]-start[i])*p.weight));
 for(const progress of [WALL_LAND_END,1]){
  const centre=wall.vertex(item(progress),.5,.5);
  const slot=item(progress).entry.slot,a=(Math.floor(slot/3)-2)*Math.PI/10;
  const radius=1.88*(193.6+8.64)/Math.sin(Math.PI/5),z=radius*(1-Math.cos(a))*1000/900,k=1000/(1000-z);
  near(centre.x,radius*Math.sin(a)*k);near(centre.y,-(slot%3-1)*191.3856*k);near(centre.z,z);
 }
});

test('landing velocity eases to rest before wall rotation begins',()=>{
 const entry=item(0).entry,finish=WALL_LAND_END*(entry.delay+entry.duration);
 const end=wall.vertex(item(finish+.00001),.25,.75),almost=wall.vertex(item(finish-.0001),.25,.75);
 assert.ok(Math.hypot(end.x-almost.x,end.y-almost.y,end.z-almost.z)<.0001);
 const start=source.vertex(.25,.75),just=wall.vertex(item(.0001),.25,.75);
 assert.ok(Math.hypot(start.x-just.x,start.y-just.y,start.z-just.z)<.0001);
});

test('unseen cards start outside the frame with no fade-in replacement and all surfaces remain finite',()=>{
 const unseen=wall.vertex(item(0,9),.5,.5);
 assert.equal(unseen.alpha,1);assert.ok(Math.abs(unseen.x)>width/2);
 for(let p=0;p<=1;p+=.02)for(const {pose} of wall.frame(p)){
  for(const u of [0,.5,1])for(const v of [0,.5,1]){
   const vertex=wall.vertex(pose,u,v);
   assert.ok(Object.values(vertex).every(Number.isFinite));
   assert.ok(vertex.alpha>=0&&vertex.alpha<=1);
  }
 }
});

test('the shortened scroll interval reaches the wall before its navigation target',()=>{
 assert.equal(directWallProgress(WALL_SCROLL_START),0);
 near(directWallProgress((WALL_SCROLL_START+WALL_SCROLL_END)/2),.5);
 assert.equal(directWallProgress(WALL_SCROLL_END),1);
 assert.equal(directWallProgress(WALL_SCROLL_LINK),1);
 assert.equal(directWallProgress(-5),0);
});


test('visible wall cards depart and land one by one, instead of moving as one block',()=>{
 const entries=wall.frame(0).filter(({pose})=>pose.entry.cast).map(({pose})=>pose.entry);
 assert.equal(new Set(entries.map(e=>e.delay)).size,entries.length);
 const middle=wall.frame(.5).filter(({pose})=>pose.entry.cast).map(({pose})=>pose.weight);
 assert.ok(middle.some(w=>w===1));
 assert.ok(middle.some(w=>w===0));
 assert.ok(middle.some(w=>w>0&&w<1));
 assert.ok(wall.frame(WALL_LAND_END).filter(({pose})=>pose.entry.cast).every(({pose})=>pose.weight>.999999));
});


test('each captured floating card becomes a visible wall card without changing its image identity',()=>{
 const live=new Map([6,24,35,46].map((index)=>[index,source]));
 const assembly=createDirectWall(width,height,cards,live);
 const first=assembly.frame(0),last=assembly.frame(WALL_LAND_END);
 for(const [index,captured] of live){
  assert.deepEqual(assembly.vertex(first.find(i=>i.index===index).pose,.25,.75),captured.vertex(.25,.75));
  const landed=last.find(i=>i.index===index);
  assert.equal(landed.pose.target.alpha,1);assert.equal(landed.pose.entry.cast,true);
  assert.equal(landed.pose.weight,1);assert.equal(landed.index,index);
 }
 assert.equal(new Set(last.map(i=>i.pose.entry.slot)).size,cards.length);
});


test('waiting cards keep drifting on a deterministic path and reverse to the identical surface',()=>{
 const moving={...source,sample:delta=>{const next=flightPose(flight,pose.age+delta);return {f:flight,pose:next,vertex:(u,v)=>sheetVertex(flight,next,u,v)};}};
 const assembly=createDirectWall(width,height,cards,new Map([[6,moving]]));
 const before=assembly.frame(0).find(i=>i.index===6);
 const progress=Math.max(.005,before.pose.entry.delay*WALL_LAND_END*.4);
 const read=()=>assembly.frame(progress).find(i=>i.index===6);
 const first=read(),point=assembly.vertex(first.pose,.25,.75);
 if(first.pose.weight===0)assert.notDeepEqual(point,moving.vertex(.25,.75));
 assembly.frame(1,2.4);
 assert.deepEqual(assembly.vertex(read().pose,.25,.75),point);
});

test('nearby floating cards choose nearby wall seats instead of crossing by texture ID',()=>{
 const sheet=(x,y)=>({f:{size:100},pose:{},vertex:(u,v)=>({x:x+(u-.5)*100,y:y+(.5-v)*100,z:0,alpha:1,blur:0})});
 const assembly=createDirectWall(width,height,cards,new Map([[40,sheet(-500,0)],[2,sheet(500,0)]]));
 const landed=assembly.frame(1);
 assert.ok(landed.find(i=>i.index===40).pose.target.at[0]<0);
 assert.ok(landed.find(i=>i.index===2).pose.target.at[0]>0);
});


test('the currently visible cards remain staggered when returning from a rotated wall',()=>{
 const rotation=Math.PI/2;
 const visible=wall.frame(.5,rotation).filter(({pose})=>{const p=pose.target.at;return pose.target.alpha&&Math.abs(p[0]*1000/(1000-p[2]))<width*.65;});
 const weights=visible.map(({pose})=>pose.weight);
 assert.ok(weights.some(w=>w===0));assert.ok(weights.some(w=>w>0&&w<1));assert.ok(weights.some(w=>w===1));
 const expected=visible.map(({index,pose})=>[index,wall.vertex(pose,.25,.75)]);
 wall.frame(1,rotation);
 const returned=wall.frame(.5,rotation).filter(i=>visible.some(v=>v.index===i.index)).map(({index,pose})=>[index,wall.vertex(pose,.25,.75)]);
 assert.deepEqual(returned,expected);
});
