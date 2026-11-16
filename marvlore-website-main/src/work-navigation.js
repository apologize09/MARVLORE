import {animate,motionValue} from 'motion';

// Motion: https://github.com/motiondivision/motion (MIT).
// Keep category navigation local to the work section and interruptible.
export function createWorkNavigation(root){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const toolbar=root.querySelector('.work-categories');
 const pill=document.createElement('span');pill.className='work-category-pill';pill.setAttribute('aria-hidden','true');
 toolbar.prepend(pill);toolbar.classList.add('has-motion-pill');
 let selection=null,scroll=null,frame=0,run=0,reveals=[],paging=null;
 const position=motionValue(window.scrollY);
 function select(jump=false){
  const button=toolbar.querySelector('[aria-pressed="true"]');if(!button)return;
  selection?.stop();
  const values={x:button.offsetLeft,y:button.offsetTop,width:button.offsetWidth,height:button.offsetHeight};
  if(jump||reduced.matches){pill.style.transform=`translate(${values.x}px,${values.y}px)`;pill.style.width=values.width+'px';pill.style.height=values.height+'px';}
  else selection=animate(pill,values,{type:'spring',bounce:0,duration:.38});
 }
 function reveal(){
  reveals.forEach(a=>a.stop());reveals=[];
  const panel=root.querySelector(root.dataset.workMode==='overview'?'#work-overview':'.elastic-reel-stage');
  if(!panel||reduced.matches)return;
  reveals.push(animate(panel,{opacity:[.35,1],y:[12,0]},{duration:.48,ease:[.22,1,.36,1]}));
 }
 function page(direction){
  paging?.stop();
  if(reduced.matches)return;
  paging=animate(root.querySelector('.elastic-reel-track'),{x:[direction*40,0],opacity:[.6,1]},{duration:.42,ease:[.22,1,.36,1]});
 }
 function cancel(){
  run++;cancelAnimationFrame(frame);scroll?.stop();scroll=null;
  root.style.minHeight='';delete root.dataset.workNavigating;
 }
 function navigate(commit,focus){
  scroll?.stop();cancelAnimationFrame(frame);
  const token=++run;
  // Retain the overview's height until scrolling finishes, so hiding the
  // lower card row cannot clamp the browser's scroll position mid-flight.
  root.style.minHeight=root.getBoundingClientRect().height+'px';
  root.dataset.workNavigating='true';commit();focus?.focus({preventScroll:true});
  frame=requestAnimationFrame(()=>{
   if(token!==run)return;
   const destination=Math.max(0,window.scrollY+root.getBoundingClientRect().top);
   const finish=()=>{if(token!==run)return;root.style.minHeight='';delete root.dataset.workNavigating;scroll=null;};
   if(reduced.matches||Math.abs(window.scrollY-destination)<2){window.scrollTo({top:destination,behavior:'instant'});finish();return;}
   position.set(window.scrollY);
   scroll=animate(position,destination,{type:'spring',bounce:0,duration:.9,onUpdate:top=>window.scrollTo({top,behavior:'instant'}),onComplete:finish});
  });
 }
 const interrupt=()=>{if(scroll||root.dataset.workNavigating)cancel();};
 window.addEventListener('wheel',interrupt,{passive:true});
 window.addEventListener('touchstart',interrupt,{passive:true});
 window.addEventListener('pointerdown',interrupt,{passive:true});
 window.addEventListener('keydown',event=>{if(['Escape','PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' '].includes(event.key))interrupt();});
 reduced.addEventListener('change',()=>{cancel();reveals.forEach(a=>a.stop());select(true);});
 const observer=new ResizeObserver(()=>select(true));observer.observe(toolbar);select(true);
 return {select,reveal,page,navigate,cancel};
}
