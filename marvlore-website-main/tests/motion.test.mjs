import test from 'node:test';
import assert from 'node:assert/strict';
const preference={matches:false,addEventListener(){}};
globalThis.matchMedia=()=>preference;
let nextFrame=0;
const frames=new Map();
globalThis.requestAnimationFrame=fn=>{frames.set(++nextFrame,fn);return nextFrame;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const {stepSpring,Spring,releaseVelocity,rubberband,projectSnap}=await import('../dist/motion.js');
function settle(spring){for(let i=0;i<240&&spring.frame;i++){const fn=frames.get(spring.frame);frames.delete(spring.frame);fn((i+1)*1000/60);}}

test('默认弹簧逐步接近目标且不会超调',()=>{
 let value=0,velocity=0,previous=0;
 for(let i=0;i<120;i++){[value,velocity]=stepSpring(value,velocity,1,1/60);assert.ok(value>=previous&&value<=1);previous=value;}
 assert.ok(Math.abs(value-1)<.000001);
});
test('动画中反向保持当前值和速度，最终收敛到新目标',()=>{
 let settled;
 const spring=new Spring(0,()=>{},{onRest:v=>settled=v});spring.to(1);
 const frame=frames.get(spring.frame);frames.delete(spring.frame);frame(16);
 const value=spring.value,velocity=spring.velocity;
 assert.ok(value>0&&velocity>0);spring.to(0);
 assert.equal(spring.value,value);assert.equal(spring.velocity,velocity);
 settle(spring);assert.equal(settled,0);assert.equal(spring.value,0);
});
test('拖动松手携带速度，暂停后松手不会沿用过期速度',()=>{
 const history=[{time:10,value:0},{time:35,value:10},{time:60,value:20}];
 assert.equal(releaseVelocity(history,70),400);
 assert.equal(releaseVelocity(history,180),0);
});
test('橡皮筋边界连续且阻力随距离增加',()=>{
 assert.equal(rubberband(0,500),0);
 assert.ok(rubberband(50,500)>0&&rubberband(50,500)<50);
 assert.ok(rubberband(500,500)/500<rubberband(50,500)/50);
});
test('一次短甩动切到相邻卡片，不因惯性绕完整圈返回原卡',()=>{
 assert.equal(projectSnap(.9,0,8),1);
 assert.equal(projectSnap(-.9,0,-8),-1);
 assert.equal(projectSnap(2.1,0,0),2);
});
test('减少动态模式直接抵达目标并执行完成逻辑',()=>{
 preference.matches=true;let painted,finished;
 const spring=new Spring(0,v=>painted=v,{onRest:v=>finished=v});spring.to(1);
 assert.equal(painted,1);assert.equal(finished,1);assert.equal(spring.frame,0);preference.matches=false;
});
