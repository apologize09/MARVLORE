import test from 'node:test';
import assert from 'node:assert/strict';
import {sequenceClock,sequenceTiming,entrancePose,ENTRANCE} from '../src/hero/entrance-sequence.js';
import {ellipseRail} from '../src/hero/ellipse-rail.js';
const count=7,rail=ellipseRail(420,126),timing=sequenceTiming(count);
function pose(time,index=0,width=1440,height=650){
 const clock=sequenceClock(time,count),u=.25-5/count+index/count+clock.phase,[x,y]=rail.sample(u),w=(y/126+1)/2;
 return entrancePose({time,index,count,width,height,itemWidth:213.3,itemHeight:120,u,clock,
  orbit:{x:width/2+x,y:height/2+y,scale:1+.85*(.3*w-.45*(1-w)),opacity:1-.85*.55*(1-w),z:100}});
}
test('七张卡片都从舞台左侧外依次飞入',()=>{
 for(const [width,height] of [[1280,500],[1920,750],[2560,1000]])for(let i=0;i<count;i++){
  const p=pose(0,i,width,height);
  assert.ok(p.x+213.3/2<0);
  assert.equal(p.opacity,0);
 }
 const first=pose(ENTRANCE.delay+.1,0),last=pose(ENTRANCE.delay+.1,6);
 assert.ok(first.opacity>0);assert.equal(last.opacity,0);
});
test('正面圆环排好后直接变轨，没有整组旋转阶段',()=>{
 const radii=Array.from({length:count},(_,i)=>{const p=pose(timing.assembled,i);return Math.hypot(p.x-720,p.y-325);});
 assert.ok(Math.max(...radii)-Math.min(...radii)<1e-8);
 assert.equal(timing.morphStart,timing.assembled);
 assert.equal(sequenceClock(timing.assembled,count).stage,'morph');
 assert.equal(sequenceClock(timing.assembled-1e-5,count).phase,0);
 for(let t=0;t<timing.end;t+=.01)assert.notEqual(sequenceClock(t,count).stage,'spin');
});
test('飞入、直接变轨与匀速巡航的接点位置和速度连续',()=>{
 const epsilon=1e-5;
 for(const t of [timing.morphStart,timing.end])for(let i=0;i<count;i++){
  const a=pose(t-epsilon,i),b=pose(t,i),c=pose(t+epsilon,i);
  const left=[(b.x-a.x)/epsilon,(b.y-a.y)/epsilon],right=[(c.x-b.x)/epsilon,(c.y-b.y)/epsilon];
  assert.ok(Math.hypot(c.x-a.x,c.y-a.y)<.02);
  assert.ok(Math.hypot(right[0]-left[0],right[1]-left[1])<.2,`velocity seam at ${t}, card ${i}`);
  for(const prop of ['scale','opacity'])assert.ok(Math.abs((c[prop]-b[prop])/epsilon-(b[prop]-a[prop])/epsilon)<.002);
 }
});
test('入场结束后衔接原弧长轨道，整圈保持24秒周期和固定速率',()=>{
 const start=timing.end+.1,frames=24*60,speeds=[];
 for(let n=0;n<frames;n++){
  const a=pose(start+n/60),b=pose(start+(n+1)/60);
  speeds.push(Math.hypot(b.x-a.x,b.y-a.y)*60);
 }
 assert.ok((Math.max(...speeds)-Math.min(...speeds))/(rail.length/24)<.001);
 const a=pose(start),b=pose(start+24);
 assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<1e-8);
});
