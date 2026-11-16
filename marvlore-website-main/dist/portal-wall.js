const STEP=Math.PI/10, COUNT=20, CIRCLE=COUNT*STEP;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=v=>((v%CIRCLE)+CIRCLE)%CIRCLE;
const signed=v=>{v=wrap(v);return v>Math.PI?v-CIRCLE:v;};
export function mountPortalWall(){
 const section=document.querySelector('#marvlore-go'),stage=section?.querySelector('.portal-wall');
 if(!stage||section.classList.contains('portal-assembly'))return ()=>{};
 const cols=[...stage.querySelectorAll('[data-wall-column]')],abort=new AbortController(),opts={signal:abort.signal};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let angle=STEP*2,velocity=0,targetTilt=0,tilts=Array(COUNT).fill(0),radius=900,visible=false,raf=0,last=0,drag=null,disposed=false;
 function resize(){
  const width=stage.clientWidth,scale=.8,w=clamp(width*.187,152,242)*scale,h=(clamp(width*.138,112,178)+50)*scale,gap=clamp(width*.0075,7,12)*scale,rowgap=clamp(width*.0078,7,12)*scale;
  stage.style.setProperty('--wall-card-w',w+'px');stage.style.setProperty('--wall-card-h',h+'px');stage.style.setProperty('--wall-row-gap',rowgap+'px');
  radius=1.88*(w+gap)/Math.sin(STEP*2);paint();
 }
 function paint(){
  cols.forEach((el,i)=>{
   const rel=signed(i*STEP-angle),x=radius*Math.sin(rel),z=radius*(1-Math.cos(rel));
   el.style.transform='translate3d('+x.toFixed(2)+'px,0,'+z.toFixed(2)+'px) rotateY('+(-rel*180/Math.PI).toFixed(2)+'deg) rotateX('+tilts[i].toFixed(2)+'deg)';
   el.style.visibility=Math.abs(rel)>Math.PI/2?'hidden':'visible';el.style.zIndex=String(Math.round(z));
  });
 }
 function tick(now){
  raf=0;if(!visible||document.hidden||disposed||reduced.matches){last=0;return;}
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(section.dataset.assembled==='false'){angle=STEP*2;velocity=0;tilts.fill(0);}
  if(!drag&&section.dataset.assembled!=='false'){angle=wrap(angle+(.072+velocity)*dt);velocity*=Math.pow(.93,dt*60);if(Math.abs(velocity)<.005)velocity=0;}
  const blend=1-Math.pow(.87,dt*60);tilts[0]+=(targetTilt-tilts[0])*blend;
  for(let i=1;i<COUNT;i++)tilts[i]+=(tilts[i-1]-tilts[i])*(1-Math.pow(1-(.13-i*.0055),dt*60));
  paint();raf=requestAnimationFrame(tick);
 }
 function resume(){if(!raf&&visible&&!document.hidden&&!disposed&&!reduced.matches)raf=requestAnimationFrame(tick);else if(reduced.matches)paint();}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;resume();},{threshold:0});observer.observe(section);
 const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(stage);
 stage.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('a,button'))return;drag={id:e.pointerId,x:e.clientX,time:performance.now()};velocity=0;stage.classList.add('is-dragging');stage.setPointerCapture(e.pointerId);},opts);
 stage.addEventListener('pointermove',e=>{
  const bounds=stage.getBoundingClientRect();targetTilt=-(e.clientY-bounds.top-bounds.height/2)/Math.max(bounds.height/2,1)*8;
  if(!drag||drag.id!==e.pointerId)return;
  const now=performance.now(),dx=e.clientX-drag.x,dt=Math.max(16,now-drag.time);drag.x=e.clientX;drag.time=now;
  angle=wrap(angle-dx/radius);velocity=clamp(-dx/dt*1000/radius,-2,2);paint();
 },opts);
 function end(e){if(!drag||drag.id!==e.pointerId)return;drag=null;stage.classList.remove('is-dragging');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);resume();}
 stage.addEventListener('pointerup',end,opts);stage.addEventListener('pointercancel',end,opts);
 stage.addEventListener('pointerleave',()=>{targetTilt=0;},opts);
 stage.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();angle=wrap(angle+(e.key==='ArrowLeft'?-STEP:STEP));paint();},opts);
 document.addEventListener('visibilitychange',()=>{last=0;resume();},opts);
 reduced.addEventListener('change',()=>{last=0;resume();},opts);
 resize();
 return ()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();sizeObserver.disconnect();abort.abort();};
}
