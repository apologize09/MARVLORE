import {titleCase} from './typography.js?v=bff0b2cf2f';
import {createWorkNavigation} from './work-navigation.js?v=314b940e5b';
import {stepSpring,reducedMotion,clamp} from './motion.js?v=53e5c054f1';
import {cardCornerRadius} from './card-shape.js?v=dc5814bef2';
import {getWorkReelItems,getWorkReelOptions} from './cms/work-runtime.js?v=a3472201c9';

// Independent photo-reel implementation. Pointer-distance magnification follows
// the open-source Dock pattern: https://github.com/ibelick/motion-primitives
// No React Bits Pro source or private registry dependency is included.
export function mountWorkReel(){
 const items=getWorkReelItems();
 const options=getWorkReelOptions();
 const root=document.querySelector('#work'),stage=root?.querySelector('.elastic-reel-stage');
 if(!stage)return;
 const overview=root.querySelector('#work-overview'),reel=root.querySelector('.elastic-reel');
 const track=stage.querySelector('.elastic-reel-track'),buttons=[...track.children];
 const categories=[...root.querySelectorAll('[data-work-category]')];
 const navigation=createWorkNavigation(root);
 const title=root.querySelector('.work-reel-name h3'),subtitle=root.querySelector('.work-reel-name p');
 const counter=root.querySelector('.work-reel-index'),detail=root.querySelector('.work-reel-detail');
 const collapse=root.querySelector('.work-reel-collapse');
 const previous=root.querySelector('.work-reel-prev'),next=root.querySelector('.work-reel-next'),range=root.querySelector('.work-reel-range');
 const videos=[...track.querySelectorAll('video')];let mediaVisible=false,detailVisible=false;
 function syncVideos(){
  videos.forEach(video=>{
   if(mediaVisible&&!detailVisible&&!video.closest('button').hidden&&!document.hidden&&!reducedMotion.matches)video.play().catch(()=>{});
   else video.pause();
  });
 }
 const mediaObserver=new IntersectionObserver(([entry])=>{mediaVisible=entry.isIntersecting;syncVideos();},{threshold:.1});
 mediaObserver.observe(stage);
 const onGallery=event=>{detailVisible=event.detail.open;syncVideos();};
 window.addEventListener('marvlore:gallery-state',onGallery);
 document.addEventListener('visibilitychange',syncVideos);
 const maxVisible=Math.max(1,Math.floor(options.maxVisible??8));
 let pool=items.map((_,index)=>index),limit=Math.min(pool.length,maxVisible);
 let start=0,visible=[];
 function updateWindow(){
  limit=Math.min(pool.length,maxVisible);
  visible=Array.from({length:limit},(_,slot)=>pool[(start+slot)%pool.length]);
  buttons.forEach((button,index)=>{button.hidden=!visible.includes(index);});
  previous.disabled=next.disabled=pool.length<2;
  range.textContent='共 '+pool.length+' 个作品，当前从第 '+(start+1)+' 个开始显示 '+limit+' 个，可使用左右箭头浏览。';
  syncVideos();
 }
 function ensureVisible(index){if(!visible.includes(index)){start=pool.indexOf(index);updateWindow();}}
 updateWindow();
 const states=buttons.map(()=>({x:0,w:0,h:0,dim:1,vx:0,vw:0,vh:0,vdim:0,target:{x:0,w:0,h:0,dim:1}}));
 let width=0,height=0,bar=0,gap=options.gap,opened=-1,hovered=-1,focused=-1;
 let frame=0,last=0,ready=false,drag=null,suppressClick=false;
 const stop=()=>{cancelAnimationFrame(frame);frame=0;last=0;};
 function draw(){
  states.forEach((s,i)=>{
   const button=buttons[i],w=Math.max(1,s.w),h=Math.max(1,s.h);
   button.style.width=w+'px';button.style.height=h+'px';
   button.style.borderRadius=cardCornerRadius(w,h)+'px';
   button.style.transform='translate3d('+s.x+'px,'+((height-h)/2)+'px,0)';
   button.style.opacity=s.dim;
   button.querySelector('img').style.filter=reducedMotion.matches?'none':'blur('+Math.min(.5,Math.abs(s.vw)*.0012)+'px)';
  });
 }
 function tick(time){
  const dt=last?Math.min((time-last)/1000,.04):1/60;last=time;let moving=false;
  for(const s of states){
   for(const key of ['x','w','h','dim']){
    const velocity='v'+key;
    [s[key],s[velocity]]=stepSpring(s[key],s[velocity],s.target[key],dt,options.response,options.damping);
    if(Math.abs(s[key]-s.target[key])>.04||Math.abs(s[velocity])>.12)moving=true;
    else{s[key]=s.target[key];s[velocity]=0;}
   }
  }
  draw();if(moving)frame=requestAnimationFrame(tick);else{frame=0;last=0;}
 }
 function animate(jump=false){
  if(jump||reducedMotion.matches){stop();states.forEach(s=>{for(const key of ['x','w','h','dim']){s[key]=s.target[key];s['v'+key]=0;}});draw();return;}
  if(!frame){last=0;frame=requestAnimationFrame(tick);}
 }
 function caption(index){
  const p=items[index];
  title.textContent=titleCase(p?.title??'精选作品');
  subtitle.textContent=p?.subtitle??'移过展开 · 点击放大';
  counter.textContent=index<0?String(start+1).padStart(2,'0')+' — '+String(pool.length).padStart(2,'0'):String(pool.indexOf(index)+1).padStart(2,'0')+' / '+String(pool.length).padStart(2,'0');
  detail.hidden=opened<0;collapse.hidden=opened<0;
  if(opened>=0){detail.href='#case/'+items[opened].id;detail.setAttribute('aria-label','查看完整项目：'+items[opened].title);}
  buttons.forEach((button,i)=>{
   const image=button.querySelector('img'),item=items[i];
   const source=i===opened?item.src:item.thumbnailSrc||item.src;
   if(image.getAttribute('src')!==source)image.src=source;
   image.style.objectPosition=i===opened?'50% 50%':item.focusX+'% 50%';
   button.setAttribute('aria-expanded',String(i===opened));
   button.setAttribute('aria-label',(i===opened?'查看完整项目：':'展开 ')+items[i].title);
   button.classList.toggle('is-open',i===opened);
  });
  root.dataset.reelOpen=String(opened>=0);
 }
 function layout(weights=null,jump=false){
  if(!width)return;
  const restHeight=height*.86,openHeight=height*.96,count=visible.length;
  let widths,heights;
  if(opened>=0){
   const closed=Math.min(bar*.58,width*.038,64);
   const available=width-(count-1)*closed-gap*(count-1);
   const openWidth=Math.min(available,openHeight*items[opened].aspect);
   widths=visible.map(i=>i===opened?openWidth:closed);
   heights=visible.map(i=>i===opened?openWidth/items[i].aspect:restHeight*.86);
  }else{
   const focusSlot=visible.indexOf(focused);
   const influence=visible.map((index,slot)=>weights?.[index]??(index===focused?1:focusSlot>=0?Math.max(0,1-Math.abs(slot-focusSlot)/2.1):0));
   widths=influence.map(weight=>bar*(1+(options.magnify-1)*weight));
   heights=influence.map(weight=>restHeight*(1+.16*weight));
   const total=widths.reduce((a,b)=>a+b,0)+gap*(count-1);
   if(total>width){const scale=(width-gap*(count-1))/(total-gap*(count-1));widths=widths.map(w=>w*scale);}
  }
  const total=widths.reduce((a,b)=>a+b,0)+gap*(count-1);
  let x=(width-total)/2;
  visible.forEach((index,slot)=>{
   states[index].target={x,w:widths[slot],h:heights[slot],dim:opened<0?1:index===opened?1:.36};
   x+=widths[slot]+gap;
  });
  animate(jump);
 }
 function measure(){
  width=stage.clientWidth;height=stage.clientHeight;if(!width||!height)return;gap=Math.min(options.gap,width*.01);
  bar=Math.min(options.barWidth,width*.105,(width-gap*(limit-1))/limit);
  layout(null,!ready);ready=true;
 }
 function setCategory(id){
  categories.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.workCategory===id)));
  navigation.select();
 }
 function open(index){
  opened=clamp(index,0,items.length-1);ensureVisible(opened);hovered=-1;focused=-1;
  setCategory(items[opened].category);caption(opened);layout();
 }
 function close(){opened=-1;hovered=-1;focused=-1;caption(-1);layout();}
 function nearest(x){let best=visible[0],distance=Infinity;visible.forEach(i=>{const s=states[i],d=Math.abs(x-s.x-s.w/2);if(d<distance){best=i;distance=d;}});return best;}
 function point(event){
  if(opened>=0)return;
  const x=event.clientX-stage.getBoundingClientRect().left;
  const index=nearest(x),influence=Math.min(options.influence,width*.2);
  const weights=states.map((s,i)=>{if(!visible.includes(i))return 0;const d=Math.abs(x-s.x-s.w/2)/influence;return d>=1?0:(1-d*d)**2;});
  focused=-1;hovered=index;caption(index);layout(weights);
 }
 function showProject(){
  if(opened<0)return;
  window.dispatchEvent(new CustomEvent('marvlore:open-work',{detail:{id:items[opened].id,source:buttons[opened]}}));
 }
 stage.addEventListener('pointermove',event=>{
  if(drag&&event.pointerId===drag.id){
   const dx=event.clientX-drag.x;
   if(Math.abs(dx)>6){drag.moved=true;stage.setPointerCapture(event.pointerId);}
   if(drag.moved&&opened<0)point(event);
  }else point(event);
 });
 stage.addEventListener('pointerleave',()=>{if(opened<0&&!drag){hovered=-1;caption(focused);layout();}});
 stage.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,moved:false};});
 function release(event){
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,moved=drag.moved;drag=null;
  if(moved){suppressClick=true;setTimeout(()=>{suppressClick=false;},0);if(Math.abs(dx)>40)shift(dx<0?1:-1);}
 }
 stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',()=>{drag=null;});
 buttons.forEach((button,index)=>{
  button.addEventListener('click',event=>{if(suppressClick){event.preventDefault();return;}if(opened===index)showProject();else open(index);});
  button.addEventListener('focus',()=>{focused=index;if(opened<0){hovered=-1;caption(index);layout();}});
  button.addEventListener('blur',()=>{focused=-1;if(opened<0&&hovered<0){caption(-1);layout();}});
 });
 stage.addEventListener('keydown',event=>{
  const current=opened>=0?opened:focused>=0?focused:pool[0];
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const index=event.key==='Home'?pool[0]:event.key==='End'?pool[pool.length-1]:pool[(pool.indexOf(current)+(event.key==='ArrowRight'?1:-1)+pool.length)%pool.length];
  ensureVisible(index);buttons[index].focus({preventScroll:true});if(opened>=0)open(index);
 });
 function shift(direction){
  if(pool.length<2)return;
  if(opened>=0)open(pool[(pool.indexOf(opened)+direction+pool.length)%pool.length]);
  else{
   start=(start+direction+pool.length)%pool.length;hovered=-1;focused=-1;
   updateWindow();caption(-1);layout(null,true);
  }
  navigation.page(direction);
 }
 previous.addEventListener('click',()=>shift(-1));next.addEventListener('click',()=>shift(1));
 function refreshMode(viewportTop){
  window.dispatchEvent(new Event('marvlore:work-mode'));
  requestAnimationFrame(()=>{
   const delta=root.getBoundingClientRect().top-viewportTop;
   if(Math.abs(delta)>.5)window.scrollBy({top:delta,behavior:'instant'});
  });
 }
 function showOverview(){
  const viewportTop=root.getBoundingClientRect().top;
  stop();opened=-1;hovered=-1;focused=-1;drag=null;ready=false;
  pool=items.map((_,index)=>index);start=0;updateWindow();
  overview.hidden=false;reel.hidden=true;root.classList.remove('work-reel');root.dataset.workMode='overview';
  setCategory('all');caption(-1);
  refreshMode(viewportTop);navigation.reveal();
 }
 function showCategory(id){
  const index=items.findIndex(p=>p.category===id);if(index<0)return;
  const viewportTop=root.getBoundingClientRect().top;
  overview.hidden=true;reel.hidden=false;root.classList.add('work-reel');root.dataset.workMode='category';
  opened=-1;hovered=-1;focused=-1;drag=null;
  pool=items.map((item,index)=>item.category===id?index:-1).filter(index=>index>=0);
  start=0;updateWindow();
  setCategory(id);caption(-1);measure();
  refreshMode(viewportTop);navigation.reveal();
 }
 categories.forEach(button=>button.addEventListener('click',()=>{
  const id=button.dataset.workCategory;if(id==='all')showOverview();else showCategory(id);
 }));
 root.querySelector('.work-categories').addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const current=categories.indexOf(document.activeElement);if(current<0)return;
  event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?categories.length-1:(current+(event.key==='ArrowRight'?1:-1)+categories.length)%categories.length;
  categories[index].focus({preventScroll:true});categories[index].click();
 });
 document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{
  showCategory(button.dataset.category);
  root.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'});
 }));
 root.querySelectorAll('[data-work-group]').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();
  const id=link.dataset.workGroup;
  navigation.navigate(()=>showCategory(id),categories.find(button=>button.dataset.workCategory===id));
 }));
 document.querySelectorAll('a[href="#work"]:not(.work-reel-detail):not([data-work-group])').forEach(link=>link.addEventListener('click',showOverview));
 detail.addEventListener('click',event=>{event.preventDefault();showProject();});
 collapse.addEventListener('click',close);
 function applyFilterDetail(detail){
  if(!detail)return;
  const state=detail.state||{};
  const active=Boolean(state.q||state.category||state.subcategory||(state.tags&&state.tags.length)||state.year||state.projectType||(state.sort&&state.sort!=='manual')||(state.page&&state.page>1));
  if(detail.empty){
   const viewportTop=root.getBoundingClientRect().top;
   stop();opened=-1;hovered=-1;focused=-1;drag=null;
   pool=[];start=0;updateWindow();caption(-1);
   overview.hidden=true;reel.hidden=true;root.classList.remove('work-reel');root.dataset.workMode='empty';
   refreshMode(viewportTop);return;
  }
  if(!active){showOverview();return;}
  if(detail.ids==null){
   if(state.subcategory)showCategory(state.subcategory);
   else if(!state.q&&!(state.tags&&state.tags.length))showOverview();
   return;
  }
  const idSet=new Set(detail.ids);
  let next=items.map((item,index)=>idSet.has(item.id)?index:-1).filter(index=>index>=0);
  if(!next.length&&state.subcategory){showCategory(state.subcategory);return;}
  if(!next.length){
   applyFilterDetail({...detail,empty:true});
   return;
  }
  const viewportTop=root.getBoundingClientRect().top;
  overview.hidden=true;reel.hidden=false;root.classList.add('work-reel');root.dataset.workMode='filter';
  opened=-1;hovered=-1;focused=-1;drag=null;
  pool=next;start=0;updateWindow();
  if(state.subcategory)setCategory(state.subcategory);else setCategory('all');
  caption(-1);measure();refreshMode(viewportTop);navigation.reveal();
 }
 const onWorkFilter=event=>applyFilterDetail(event.detail);
 window.addEventListener('marvlore:work-filter',onWorkFilter);
 const observer=new ResizeObserver(measure);observer.observe(stage);measure();caption(-1);
 reducedMotion.addEventListener('change',()=>{layout(null,true);syncVideos();});
 return {open,close,shift,showOverview,showCategory,destroy(){stop();observer.disconnect();mediaObserver.disconnect();videos.forEach(video=>video.pause());window.removeEventListener('marvlore:gallery-state',onGallery);window.removeEventListener('marvlore:work-filter',onWorkFilter);document.removeEventListener('visibilitychange',syncVideos);}};
}
