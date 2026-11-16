import test from 'node:test';
import assert from 'node:assert/strict';
import {gaussianKernel,gaussianSigmas,gaussianLevelMix} from '../dist/explore-gaussian.js';

test('paired Gaussian taps reconstruct one smooth symmetric impulse without repeated peaks',()=>{
 const {weights,offsets}=gaussianKernel();
 const impulse=Array(9).fill(0);impulse[4]=weights[0];
 offsets.forEach((offset,i)=>{
  const a=Math.floor(offset),fraction=offset-a,w=weights[i+1];
  for(const sign of [-1,1]){impulse[4+sign*a]+=w*(1-fraction);impulse[4+sign*(a+1)]+=w*fraction;}
 });
 assert.ok(Math.abs(impulse.reduce((a,b)=>a+b,0)-1)<1e-12);
 impulse.forEach((v,i)=>assert.ok(Math.abs(v-impulse[8-i])<1e-12));
 for(let i=0;i<4;i++)assert.ok(impulse[i]<impulse[i+1]);
 const total=Array.from({length:9},(_,i)=>Math.exp(-((i-4)**2)/8)).reduce((a,b)=>a+b,0);
 impulse.forEach((v,i)=>assert.ok(Math.abs(v-Math.exp(-((i-4)**2)/8)/total)<1e-12));
});

test('blur levels cover the full depth range and blend continuously in variance',()=>{
 const sigmas=gaussianSigmas();
 assert.ok(sigmas.at(-1)>.28*.4);
 sigmas.forEach((sigma,i)=>{
  if(i)assert.ok(sigma>sigmas[i-1]);
  const below=gaussianLevelMix(sigma-1e-9),above=gaussianLevelMix(sigma+1e-9);
  const values=[0,...sigmas];
  const variance=choice=>values[choice.low]**2*(1-choice.mix)+values[choice.high]**2*choice.mix;
  assert.ok(Math.abs(variance(below)-sigma*sigma)<1e-8);
  assert.ok(Math.abs(variance(above)-sigma*sigma)<1e-8);
 });
 assert.equal(gaussianLevelMix(0).mix,0);
 assert.equal(gaussianLevelMix(1).low,5);
});
