import {Spring,reducedMotion} from './motion.js';
import {aboutGeometry,aboutMotionFrame,clamp01} from './about-motion-model.js';

export function mountAbout(){
 const section=document.querySelector('#about');if(!section)return;
 const track=section.querySelector('.about-scroll-track'),stage=section.querySelector('.about-stage');
 const tail=section.querySelector('.about-tail');
 const rows=[...section.querySelectorAll('.about-art')];
 const groups=[...section.querySelectorAll('[data-about-group]')];
 const cards=rows.flatMap(row=>[...row.querySelectorAll('.about-card')]);
 let geometry=null,active=false,resizeFrame=0,scrollFrame=0,introStarted=false;
 const progress=new Spring(0,paint,{response:.34,precision:.0001});
 const intro=new Spring(0,()=>paint(progress.value),{response:2,precision:.0005});
 const spread=new Spring(0,()=>paint(progress.value),{response:.38,precision:.0005});
 const focus=cards.map(()=>new Spring(0,()=>paint(progress.value),{response:.3,precision:.0005}));
 const tilts=cards.map(()=>[0,1].map(()=>new Spring(0,()=>paint(progress.value),{response:.3,precision:.001})));

 function paint(value){
  if(!active||!geometry)return;
  const frame=aboutMotionFrame(value,geometry,intro.value);
  section.dataset.aboutPhase=frame.expansion>.999?'expanded':frame.expansion>0?'expanding':`group-${frame.groups.findIndex(g=>g.opacity>.5)+1}`;
  rows.forEach((row,i)=>{row.style.transform=`translate3d(0,${frame.rows[i].y}px,0)`;});
  groups.forEach((group,i)=>{
   const pose=frame.groups[i];
   group.style.transform=`translate3d(0,${pose.y}px,0) translateY(-50%)`;
   group.style.opacity=String(pose.opacity);
   group.style.filter=`blur(${pose.blur}px)`;
   group.setAttribute('aria-hidden',String(pose.opacity<.03));
  });
  cards.forEach((card,i)=>{
   const pose=frame.cards[i],lift=focus[i].value,s=spread.value*pose.entry;
   const x=pose.x+pose.scatterX*s,y=pose.y+pose.scatterY*s;
   card.style.transform=`translate3d(${x}px,${y}px,0) rotate(${pose.rotation+(pose.index-2)*s}deg) perspective(1200px) rotateX(${tilts[i][1].value}deg) rotateY(${tilts[i][0].value}deg) scale(${pose.scale*(1+.08*lift)})`;
   card.style.opacity=String(pose.opacity);
   card.style.zIndex=String(lift>.01?40:20-pose.order);
  });
 }
 function target(){
  const rect=track.getBoundingClientRect(),lead=geometry.height*.28;
  return clamp01((lead-rect.top)/(geometry.runway+lead));
 }
 function measure(){
  resizeFrame=0;if(!active)return;
  geometry=aboutGeometry({width:stage.clientWidth,height:stage.clientHeight,
   size:cards[0].offsetWidth,drop:Math.min(210,Math.max(100,innerWidth*.11)),
   groupHeights:groups.map(group=>group.offsetHeight)});
  track.style.height=`${geometry.height+geometry.runway}px`;
  tail.style.height=`${geometry.tail}px`;
  const next=target();
  if(next>.25){introStarted=true;intro.jump(1);}
  updateIntro();progress.jump(next);
 }
 function updateIntro(){
  const top=track.getBoundingClientRect().top;
  if(top>innerHeight){introStarted=false;intro.jump(0);}
  else if(top<=geometry.height*.28&&!introStarted){introStarted=true;intro.to(1);}
 }
 function schedule(){
  if(!active||scrollFrame)return;
  scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateIntro();progress.to(target());});
 }
 function resize(){if(active&&!resizeFrame)resizeFrame=requestAnimationFrame(measure);}
 function reset(){
  active=false;introStarted=false;progress.stop();intro.jump(0);spread.jump(0);focus.forEach(s=>s.jump(0));tilts.flat().forEach(s=>s.jump(0));
  cancelAnimationFrame(resizeFrame);cancelAnimationFrame(scrollFrame);resizeFrame=scrollFrame=0;
  section.classList.remove('about-animated');delete section.dataset.aboutPhase;
  track.style.removeProperty('height');tail.style.removeProperty('height');
  [...rows,...cards,...groups].forEach(el=>{el.style.removeProperty('transform');el.style.removeProperty('opacity');el.style.removeProperty('filter');el.style.removeProperty('z-index');});
  groups.forEach(group=>group.removeAttribute('aria-hidden'));
 }
 function configure(){
  reset();if(reducedMotion.matches)return;
  active=true;section.classList.add('about-animated');measure();
 }
 cards.forEach((card,i)=>{
  card.addEventListener('pointerenter',()=>{if(!active)return;spread.to(1);focus.forEach((s,j)=>s.to(j===i?1:0));});
  card.addEventListener('pointermove',event=>{
   if(!active)return;const rect=card.getBoundingClientRect();
   tilts[i][0].to(Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1))*8);
   tilts[i][1].to(Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1))*-8);
  });
  card.addEventListener('pointerleave',()=>{if(!active)return;spread.to(0);focus[i].to(0);tilts[i].forEach(s=>s.to(0));});
 });
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);
 reducedMotion.addEventListener('change',configure);
 document.fonts?.ready.then(resize);
 configure();
}
