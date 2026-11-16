import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const script=readFileSync(new URL('../dist/page-start.js',import.meta.url),'utf8');
function start(type,hash){
 const calls=[],events=new Map(),frames=[];
 const history={state:{marvloreGallery:true},scrollRestoration:'auto',replaceState(state,_,url){this.state=state;calls.push(url);}};
 const context={performance:{getEntriesByType:()=>type?[{type}]:[]},history,
  location:{pathname:'/',search:'?campaign=brand',hash},requestAnimationFrame:fn=>frames.push(fn),
  window:{scrollTo:options=>calls.push(options),addEventListener:(name,fn)=>events.set(name,fn)}};
 runInNewContext(script,context);
 return {calls,events,frames,history};
}
test('refreshing any section or gallery resets its route and scroll to home',()=>{
 for(const hash of ['#work','#about','#view/work-film','#project-film','']){
  const state=start('reload',hash);
  assert.equal(state.calls[0],'/?campaign=brand#home');
  assert.equal(state.history.state,null);
  assert.equal(state.history.scrollRestoration,'manual');
  state.events.get('pageshow')();state.frames.forEach(fn=>fn());
  assert.ok(state.calls.slice(1).every(call=>call.top===0&&call.behavior==='instant'));
  assert.equal(state.history.scrollRestoration,'auto');
 }
});
test('fresh deep links and browser back/forward keep their destination',()=>{
 for(const type of ['navigate','back_forward',undefined]){
  const state=start(type,'#work');assert.equal(state.calls.length,0);
  assert.equal(state.history.scrollRestoration,'auto');assert.equal(state.events.size,0);
 }
});
