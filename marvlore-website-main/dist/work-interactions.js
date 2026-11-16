// Interaction references: React Bits SpotlightCard and TiltedCard.
// Original implementation using the site's existing spring; no new runtime dependencies.
import {Spring,reducedMotion,clamp} from './motion.js';

export function mountWorkInteractions(root=document.querySelector('.work-grid')){
 if(!root)return;
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const resets=[];
 root.querySelectorAll('.work-card').forEach(card=>{
  let hovering=false;
  const css=(name,value)=>card.style.setProperty(name,value);
  const x=new Spring(0,v=>css('--work-x',v.toFixed(4)),{response:.32});
  const y=new Spring(0,v=>css('--work-y',v.toFixed(4)),{response:.32});
  const lift=new Spring(0,v=>css('--card-lift',`${v.toFixed(3)}px`),{response:.3});
  const scale=new Spring(1,v=>css('--card-scale',v.toFixed(4)),{response:.24});
  const reset=()=>{
   hovering=false;card.classList.remove('work-hovered');
   if(x.target!==0)x.to(0);if(y.target!==0)y.to(0);
   if(lift.target!==0)lift.to(0);if(scale.target!==1)scale.to(1);
  };
  const update=event=>{
   if(event.pointerType!=='mouse'||!fine.matches||reducedMotion.matches)return;
   if(!hovering){hovering=true;card.classList.add('work-hovered');lift.to(-5);}
   const box=card.getBoundingClientRect();
   const px=clamp((event.clientX-box.left)/box.width,0,1);
   const py=clamp((event.clientY-box.top)/box.height,0,1);
   css('--spot-x',`${(px*100).toFixed(2)}%`);css('--spot-y',`${(py*100).toFixed(2)}%`);
   x.to(px*2-1);y.to(py*2-1);
  };
  card.addEventListener('pointerenter',update);
  card.addEventListener('pointermove',update);
  card.addEventListener('pointerleave',reset);
  card.addEventListener('pointercancel',reset);
  card.addEventListener('pointerdown',event=>{if(event.button===0&&!reducedMotion.matches)scale.to(.99);});
  card.addEventListener('pointerup',()=>scale.to(1));
  card.addEventListener('blur',reset);
  card.addEventListener('keydown',event=>{if(event.key==='Enter'&&!reducedMotion.matches)scale.to(.99);});
  card.addEventListener('keyup',()=>scale.to(1));
  // Open the gallery from an untilted image, so its shared image transition stays aligned.
  card.addEventListener('click',()=>{reset();x.jump(0);y.jump(0);lift.jump(0);scale.jump(1);});
  resets.push(reset);
 });
 const resetAll=()=>resets.forEach(reset=>reset());
 window.addEventListener('blur',resetAll);
 window.addEventListener('scroll',resetAll,{passive:true});
 fine.addEventListener('change',resetAll);reducedMotion.addEventListener('change',resetAll);
}
