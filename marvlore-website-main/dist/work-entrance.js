// Scroll-triggered, staggered reveal inspired by React Bits AnimatedContent.
// Original implementation; native animations keep entrance independent of hover transforms.
import {reducedMotion} from './motion.js?v=53e5c054f1';

export function mountWorkEntrance(root=document.querySelector('#work')){
 if(!root||reducedMotion.matches||typeof IntersectionObserver==='undefined')return;
 const cards=[...root.querySelectorAll('.work-card')];
 const animations=new Map();
 const show=card=>{
  card.classList.remove('work-enter-pending');
  animations.get(card)?.cancel();animations.delete(card);
  observer.unobserve(card);
 };
 const observer=new IntersectionObserver(entries=>{
  entries.filter(entry=>entry.isIntersecting).forEach(({target:card})=>{
   observer.unobserve(card);
   const index=cards.indexOf(card),previous=cards[index-1];
   const sameRow=previous&&Math.abs(previous.offsetTop-card.offsetTop)<8;
   try{
    const animation=card.animate([
     {opacity:0,translate:'0 56px',scale:'.98'},
     {opacity:1,translate:'0 0',scale:'1'}
    ],{duration:700,delay:sameRow?100:0,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
    animations.set(card,animation);
    animation.onfinish=()=>show(card);
    card.classList.remove('work-enter-pending');
   }catch{show(card);}
  });
 },{threshold:.16,rootMargin:'0px 0px -8% 0px'});
 cards.forEach(card=>{
  card.classList.add('work-enter-pending');observer.observe(card);
  // Keyboard and project activation must never wait for an entrance animation.
  card.addEventListener('focus',()=>show(card));
  card.addEventListener('click',()=>show(card),{capture:true});
 });
 const showAll=()=>cards.forEach(show);
 // Finish entrance before the existing filter animation measures its source geometry.
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-category],[data-work-category],[data-reset-filter]'))showAll();
 },{capture:true});
 reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)showAll();});
 return {finish:showAll,destroy(){showAll();observer.disconnect();}};
}
