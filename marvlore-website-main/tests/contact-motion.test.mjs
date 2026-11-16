import test from 'node:test';
import assert from 'node:assert/strict';
import {contactEntryFrame} from '../src/contact/contact-motion.js';

test('all contact lines finish clearly at the last page, including its low rows',()=>{
 for(const height of [640,870,1080])for(const offset of [100,260,height*.6,height*.85,height-30]){
  assert.deepEqual(contactEntryFrame(0,offset,height),{opacity:1,blur:0,y:0});
 }
});
test('contact text stays hidden before reaching its reveal position',()=>{
 assert.equal(contactEntryFrame(1000,120,870).opacity,0);
 assert.equal(contactEntryFrame(600,650,870).opacity,0);
});
test('forward and reversed scroll sample identical contact animation states',()=>{
 const positions=[800,620,390,180,65,0];
 for(const offset of [130,380,560,730]){
  const down=positions.map(top=>contactEntryFrame(top,offset,870));
  const up=[...positions].reverse().map(top=>contactEntryFrame(top,offset,870)).reverse();
  assert.deepEqual(down,up);
  for(let i=1;i<down.length;i++){
   assert.ok(down[i].opacity>=down[i-1].opacity);
   assert.ok(down[i].blur<=down[i-1].blur);
   assert.ok(down[i].y<=down[i-1].y);
  }
 }
});
test('a contact line uses the service reveal depth and remains finite after resizing',()=>{
 const start=contactEntryFrame(870,120,870);
 assert.equal(start.blur,4);
 assert.equal(start.y,870*.16);
 for(const height of [0,1,480,870])for(const top of [-100,0,2000]){
  const frame=contactEntryFrame(top,1100,height);
  assert.ok(Object.values(frame).every(Number.isFinite));
  assert.ok(frame.opacity>=0&&frame.opacity<=1);
 }
});
