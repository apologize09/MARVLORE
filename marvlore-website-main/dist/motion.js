// 解析弹簧：每次重新设定目标都保留当前的位置和速度。
export function stepSpring(value, velocity, target, dt, response=.35, damping=1) {
 const omega=2*Math.PI/response, x=value-target, decay=Math.exp(-damping*omega*dt);
 if(damping===1){const c=velocity+omega*x;return [target+(x+c*dt)*decay,(velocity-omega*c*dt)*decay];}
 const wd=omega*Math.sqrt(1-damping*damping), a=(velocity+damping*omega*x)/wd;
 const c=Math.cos(wd*dt),s=Math.sin(wd*dt),next=x*c+a*s;
 return [target+next*decay,decay*(-damping*omega*next-x*wd*s+a*wd*c)];
}
export const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
export class Spring {
 constructor(value,render,{response=.35,damping=1,precision=.001,onRest=()=>{}}={}){
  Object.assign(this,{value,target:value,velocity:0,render,response,damping,precision,onRest,frame:0,last:0});
 }
 to(target,{velocity,damping=this.damping}={}){
  this.target=target;this.damping=damping;if(velocity!==undefined)this.velocity=velocity;
  if(reducedMotion.matches){this.jump(target);this.onRest(target);return;}
  if(!this.frame){this.last=0;this.frame=requestAnimationFrame(t=>this.tick(t));}
 }
 tick(time){
  const dt=this.last?Math.min((time-this.last)/1000,.064):1/60;this.last=time;
  [this.value,this.velocity]=stepSpring(this.value,this.velocity,this.target,dt,this.response,this.damping);
  this.render(this.value);
  if(Math.abs(this.value-this.target)<this.precision&&Math.abs(this.velocity)<this.precision*12){
   this.frame=0;this.value=this.target;this.velocity=0;this.render(this.value);this.onRest(this.value);
  }else this.frame=requestAnimationFrame(t=>this.tick(t));
 }
 stop(){cancelAnimationFrame(this.frame);this.frame=0;this.last=0;}
 jump(value){this.stop();this.value=value;this.target=value;this.velocity=0;this.render(value);}
}
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const rubberband=(n,size,k=.55)=>(n*size*k)/(size+k*Math.abs(n));
export function releaseVelocity(samples,now=performance.now()){
 const recent=samples.filter(s=>now-s.time<100);
 if(recent.length<2||now-recent.at(-1).time>70)return 0;
 const first=recent[0],last=recent.at(-1);return (last.value-first.value)/Math.max(.001,(last.time-first.time)/1000);
}
export function projectSnap(value,start,velocity){
 const projected=value+clamp((velocity/1000)*.998/(1-.998),-2,2);
 const travel=Math.max(1,Math.ceil(Math.abs(value-start)));
 return clamp(Math.round(projected),Math.round(start)-travel,Math.round(start)+travel);
}

export function createProjectSheet(dialog){
 const scrim=document.querySelector('.project-scrim');
 let source=null,rect=null,from=null,closing=false,drag=null;
 const render=()=>{
  if(!rect)return;
  const p=progress.value,y=offset.value;
  const sx=from?from.width/rect.width:.96,sy=from?from.height/rect.height:.96;
  const dx=from?(from.left+from.width/2)-(rect.left+rect.width/2):0;
  const dy=from?(from.top+from.height/2)-(rect.top+rect.height/2):16;
  dialog.style.transform=`translate(${dx*(1-p)}px,${dy*(1-p)+y}px) scale(${sx+(1-sx)*p},${sy+(1-sy)*p})`;
  dialog.style.opacity=String(clamp(p*4,0,1));
  scrim.style.opacity=String(clamp(p*(1-Math.max(0,y)/rect.height),0,1));
 };
 const progress=new Spring(0,render,{precision:.0005,onRest:value=>{
  if(closing&&value===0){dialog.close();scrim.hidden=true;dialog.style.removeProperty('transform');dialog.style.removeProperty('opacity');source?.focus({preventScroll:true});}
 }});
 const offset=new Spring(0,render,{response:.3});
 const measure=()=>{
  const transform=dialog.style.transform;dialog.style.transform='none';rect=dialog.getBoundingClientRect();dialog.style.transform=transform;
 };
 const open=trigger=>{
  if(dialog.open){closing=false;progress.to(1);return;}
  source=trigger??document.activeElement;from=trigger?.getBoundingClientRect()??null;closing=false;
  scrim.hidden=false;dialog.style.opacity='0';dialog.showModal();dialog.scrollTop=0;measure();offset.jump(0);progress.jump(reducedMotion.matches?1:0);progress.to(1);
 };
 const close=()=>{if(!dialog.open)return;closing=true;offset.to(0);progress.to(0);};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.querySelector('.dialog-close').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close();});
 const handle=dialog.querySelector('.dialog-grab');
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.target.closest('button'))return;
  closing=false;progress.stop();offset.stop();
  drag={id:e.pointerId,start:e.clientY,value:offset.value,samples:[{time:performance.now(),value:offset.value}],moved:false};
  handle.setPointerCapture(e.pointerId);
 });
 handle.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dy=e.clientY-drag.start;if(Math.abs(dy)>7)drag.moved=true;
  if(!drag.moved)return;
  const next=drag.value+dy;offset.jump(next<0?rubberband(next,rect.height):next);
  drag.samples.push({time:performance.now(),value:offset.value});drag.samples=drag.samples.slice(-12);
 });
 const endDrag=e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const velocity=e.type==='pointercancel'?0:releaseVelocity(drag.samples);
  const projected=offset.value+velocity*.16;
  const dismiss=e.type!=='pointercancel'&&drag.moved&&offset.value>35&&projected>rect.height*.25;
  drag=null;
  if(dismiss){
   offset.to(0,{velocity,damping:.9});
   closing=true;progress.to(0);
  }else{offset.to(0,{velocity,damping:velocity===0?1:.9});progress.to(1);}
 };
 handle.addEventListener('pointerup',endDrag);handle.addEventListener('pointercancel',endDrag);
 window.addEventListener('resize',()=>{if(dialog.open){measure();render();}});
 reducedMotion.addEventListener('change',()=>{if(dialog.open){offset.jump(0);progress.to(closing?0:1);}});
 return {open,close};
}

export function createAwardsCarousel(root,awards){
 const viewport=root.querySelector('.awards-viewport'),track=root.querySelector('.awards-track');
 const figures=[...track.children],dots=[...root.querySelectorAll('.award-dot')];
 const modulo=n=>((n%awards.length)+awards.length)%awards.length;
 let step=1,center=0,drag=null,lastIndex=-1;
 const render=value=>{
  const position=modulo(value)+awards.length;
  track.style.transform=`translateX(${center-position*step}px)`;
  figures.forEach((el,i)=>{
   const distance=Math.min(1.5,Math.abs(i-position));
   el.classList.toggle("is-current",Math.abs(i-position)<.5);
   el.style.transform=`scale(${1-.09*Math.min(1,distance)})`;
   el.style.opacity=String(1-.43*Math.min(1,distance));
  });
  const index=modulo(Math.round(value));
  if(index!==lastIndex){lastIndex=index;dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));}
 };
 const announce=value=>{const index=modulo(Math.round(value));document.querySelector('#award-status').textContent=`${index+1} / ${awards.length}：${awards[index].alt}`;root.dispatchEvent(new CustomEvent('marvlore:award-settle',{detail:{index}}));};
 const spring=new Spring(0,render,{response:.4,precision:.0005,onRest:announce});
 const measure=()=>{
  const width=figures[0].offsetWidth,gap=parseFloat(getComputedStyle(track).gap)||0;
  step=width+gap;center=(viewport.clientWidth-width)/2;render(spring.value);
 };
 new ResizeObserver(measure).observe(viewport);measure();announce(0);
 const move=direction=>spring.to(Math.round(spring.target)+direction,{damping:1});
 root.querySelector('.prev').addEventListener('click',()=>move(-1));root.querySelector('.next').addEventListener('click',()=>move(1));
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>{
  const current=Math.round(spring.value),delta=i-modulo(current);
  spring.to(current+(delta>1?delta-awards.length:delta< -1?delta+awards.length:delta),{damping:1});
 }));
 viewport.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}
 });
 viewport.addEventListener('dragstart',e=>e.preventDefault());
 viewport.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,base:spring.value,target:spring.target,velocity:spring.velocity,moved:false,samples:[]};spring.stop();
 });
 viewport.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved){
   if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){spring.to(drag.target,{velocity:drag.velocity});drag=null;return;}
   if(Math.abs(dx)<8)return;
   drag.moved=true;spring.stop();drag.base=spring.value;viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');
  }
  spring.jump(drag.base-dx/step);drag.samples.push({time:performance.now(),value:spring.value});drag.samples=drag.samples.slice(-12);
 });
 const end=e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const velocity=e.type==='pointercancel'?0:releaseVelocity(drag.samples);
  if(drag.moved)spring.to(projectSnap(spring.value,drag.base,velocity),{velocity,damping:velocity===0?1:.8});
  else spring.to(drag.target,{velocity:drag.velocity});
  drag=null;viewport.classList.remove('dragging');
 };
 viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
 window.addEventListener('pointerup',e=>{if(drag&&!drag.moved)end(e);});
 reducedMotion.addEventListener('change',()=>spring.to(Math.round(spring.target)));
 return {move};
}

export function createNavigation(nav){
 const indicator=nav.querySelector('.nav-indicator'),links=[...nav.querySelectorAll('a')];
 let current=null,queued=false;
 const x=new Spring(0,v=>indicator.style.setProperty('--indicator-x',`${v}px`),{precision:.01});
 const width=new Spring(1,v=>indicator.style.width=`${v}px`,{precision:.01});
 const update=()=>{
  queued=false;
  const threshold=innerHeight*.42;
  const section=[...document.querySelectorAll('.screen')].find(el=>{const r=el.getBoundingClientRect();return r.top<=threshold&&r.bottom>threshold;});
  const id=section?.id??'home';
  const key=id==='about'?'about':id==='contact'?'contact':['work','explore','marvlore-go','awards'].includes(id)?'work':'home';
  const link=links.find(el=>el.getAttribute('href')===`#${key}`);
  nav.classList.toggle('visible',scrollY>document.querySelector('#home').offsetHeight*.65);
  if(current===link)return;current=link;
  links.forEach(el=>{if(el===link)el.setAttribute('aria-current','location');else el.removeAttribute('aria-current');});
  indicator.hidden=key==='home';
  if(link){x.to(link.offsetLeft);width.to(link.offsetWidth);}
 };
 window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});
 window.addEventListener('resize',()=>{current=null;update();});update();
}

export function createCardFeedback(cards){
 cards.forEach(card=>{
  const scale=new Spring(1,v=>card.style.setProperty('--card-scale',v),{response:.28,precision:.0005});
  const lift=new Spring(0,v=>card.style.setProperty('--card-lift',`${v}px`),{response:.35,precision:.01});
  card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')lift.to(-3);});
  card.addEventListener('pointerleave',()=>{lift.to(0);scale.to(1);});
  card.addEventListener('pointerdown',e=>{if(e.button===0)scale.jump(.985);});
  const release=()=>scale.to(1);card.addEventListener('pointerup',release);card.addEventListener('pointercancel',release);
  card.addEventListener('keydown',e=>{if(e.key==='Enter')scale.jump(.985);});card.addEventListener('keyup',release);card.addEventListener('blur',release);
 });
}
