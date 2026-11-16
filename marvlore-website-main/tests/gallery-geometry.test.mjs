import test from 'node:test';
import assert from 'node:assert/strict';
import {quadMatrix,screenQuad,blendQuad,quadArea,modulo} from '../dist/gallery-geometry.js';

const project=(matrix,x,y)=>{
 const denominator=matrix[3]*x+matrix[7]*y+matrix[15];
 return {x:(matrix[0]*x+matrix[4]*y+matrix[12])/denominator,y:(matrix[1]*x+matrix[5]*y+matrix[13])/denominator};
};
const near=(actual,expected)=>assert.ok(Math.hypot(actual.x-expected.x,actual.y-expected.y)<1e-7);

test('image corners match both left and right perspective cards exactly',()=>{
 const poses=[screenQuad(1280,720),[{x:120,y:250},{x:330,y:300},{x:330,y:540},{x:120,y:490}],[{x:850,y:290},{x:1070,y:240},{x:1060,y:490},{x:850,y:535}]];
 for(const points of poses){
  const matrix=quadMatrix(points,396,222.75);
  screenQuad(396,222.75).forEach((corner,index)=>near(project(matrix,corner.x,corner.y),points[index]));
  assert.ok(matrix.every(Number.isFinite));
 }
});

test('every intermediate expansion stays aligned to its interpolated corners',()=>{
 const source=[{x:150,y:250},{x:350,y:285},{x:345,y:520},{x:155,y:475}],target=screenQuad(1920,1080);
 for(let progress=0;progress<=1.001;progress+=.025){
  const quad=blendQuad(source,target,progress),width=396+(1920-396)*progress,height=222.75+(1080-222.75)*progress;
  const matrix=quadMatrix(quad,width,height);
  screenQuad(width,height).forEach((corner,index)=>near(project(matrix,corner.x,corner.y),quad[index]));
  assert.ok(quadArea(quad)>0);
 }
});

test('opening and closing have identical geometry at the same presentation value',()=>{
 const source=[{x:850,y:290},{x:1070,y:240},{x:1060,y:490},{x:850,y:535}],target=screenQuad(1280,720);
 for(const progress of [0,.17,.5,.81,1]){
  const opening=blendQuad(source,target,progress),closing=blendQuad(target,source,1-progress);
  opening.forEach((point,index)=>near(point,closing[index]));
 }
});

test('infinite project indices wrap in both directions',()=>{
 for(let index=-40;index<=40;index++){
  assert.ok(modulo(index,8)>=0&&modulo(index,8)<8);
  assert.equal(modulo(index,8),modulo(index+8,8));
 }
});
