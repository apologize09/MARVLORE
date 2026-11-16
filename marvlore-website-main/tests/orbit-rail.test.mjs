import test from 'node:test';
import assert from 'node:assert/strict';
import {ellipseRail} from '../src/hero/ellipse-rail.js';
const rail=ellipseRail(420,126);
test('六至八张卡片整圈逐帧位移速度恒定，两侧转弯不加速',()=>{
 const frames=24*60,expected=rail.length/frames;
 let minimum=Infinity,maximum=0,cornerMinimum=Infinity,cornerMaximum=0;
 for(const count of [6,7,8])for(let card=0;card<count;card++)for(let frame=0;frame<frames;frame++){
  const a=rail.sample(frame/frames+card/count),b=rail.sample((frame+1)/frames+card/count);
  const speed=Math.hypot(b[0]-a[0],b[1]-a[1]);
  minimum=Math.min(minimum,speed);maximum=Math.max(maximum,speed);
  if(Math.abs(a[0])>400){cornerMinimum=Math.min(cornerMinimum,speed);cornerMaximum=Math.max(cornerMaximum,speed);}
 }
 assert.ok((maximum-minimum)/expected<.001);
 assert.ok((cornerMaximum-cornerMinimum)/expected<.001);
 assert.ok(Math.abs(expected-maximum)/expected<.001);
});
test('跨圈位置和两侧切线连续',()=>{
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 for(const turn of [0,.5,1]){
  const a=rail.sample(turn-1e-6),b=rail.sample(turn),c=rail.sample(turn+1e-6);
  assert.ok(Math.abs(distance(a,b)-distance(b,c))<1e-7);
 }
 assert.deepEqual(rail.sample(0),rail.sample(1));
});
test('桌面缩放和旋转保持路径计时，24 秒周期不随尺寸改变',()=>{
 const a=ellipseRail(420,126),b=ellipseRail(420*1.5,126*1.5,20);
 assert.ok(Math.abs(b.length/a.length-1.5)<1e-10);
 assert.ok(Math.abs(a.sample(a.front)[1]-126)<1e-8);
});
