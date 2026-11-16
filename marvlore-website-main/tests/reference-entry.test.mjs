import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldShowEntry} from '../src/about/entry-visibility.js';
test('entry waits while the previous screen still occupies the viewport',()=>{
 assert.equal(shouldShowEntry({top:500,bottom:1800},900,false),false);
 assert.equal(shouldShowEntry({top:160,bottom:1400},900,false),false);
 assert.equal(shouldShowEntry({top:90,bottom:1330},900,false),true);
});
test('direct navigation starts entry and leaving allows a fresh entry',()=>{
 assert.equal(shouldShowEntry({top:0,bottom:1400},900,false),true);
 assert.equal(shouldShowEntry({top:-400,bottom:1000},900,true),true);
 assert.equal(shouldShowEntry({top:-1500,bottom:-100},900,true),false);
 assert.equal(shouldShowEntry({top:900,bottom:2300},900,true),false);
 assert.equal(shouldShowEntry({top:0,bottom:1400},900,false),true);
});
