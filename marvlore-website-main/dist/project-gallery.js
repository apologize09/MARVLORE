import {titleCase} from './typography.js?v=bff0b2cf2f';
import {Spring,reducedMotion,releaseVelocity,projectSnap,clamp} from './motion.js?v=53e5c054f1';
import {cardCornerRadius} from './card-shape.js?v=dc5814bef2';
import {modulo,mix,screenQuad,blendQuad,quadMatrix,quadArea} from './gallery-geometry.js?v=5fcd7ed916';
import {createGalleryVideo} from './gallery-video.js?v=7ceddd8f4a';
import {createGallerySlideshow} from './gallery-slideshow.js?v=3359fe5d40';

// Measure the projected corners, including the carousel camera and back face.
function readSource(element){
 if(!element?.isConnected)return null;
 const bounds=element.getBoundingClientRect();
 if(bounds.width<1||bounds.height<1)return null;
 if(bounds.right<=0||bounds.left>=innerWidth||bounds.bottom<=0||bounds.top>=innerHeight)return null;
 const card=element.closest('.circular-carousel__card');
 if(card&&card.style.opacity!==''&&Number(card.style.opacity)===0)return null;
 const probes=[[0,0],[100,0],[100,100],[0,100]].map(([x,y])=>{
  const probe=document.createElement('span');
  probe.style.cssText=`all:initial;position:absolute;left:${x}%;top:${y}%;width:0;height:0;pointer-events:none;`;
  element.append(probe);return probe;
 });
 const quad=probes.map(probe=>{const box=probe.getBoundingClientRect();return {x:box.x,y:box.y};});
 probes.forEach(probe=>probe.remove());
 const style=getComputedStyle(element);
 return {element,quad,width:parseFloat(style.width)||element.offsetWidth,height:parseFloat(style.height)||element.offsetHeight,radius:parseFloat(style.borderTopLeftRadius)||0};
}

function visibleSource(element){
 if(!element)return null;
 const faces=element.matches('.circular-carousel__frame')?[element]:[...element.querySelectorAll('.circular-carousel__frame')];
 if(!faces.length)return readSource(element);
 return faces.map(readSource).filter(Boolean).find(face=>quadArea(face.quad)>1)||null;
}

export function createProjectGallery({groups,sourceFor}){
 const dialog=document.createElement('dialog');dialog.id='project-gallery';
 dialog.setAttribute('aria-labelledby','gallery-title');
 dialog.innerHTML=`<div class="gallery-dimmer"></div><div class="gallery-art" aria-hidden="true"><div class="gallery-image-stack"><img class="gallery-background gallery-background-a" alt="" draggable="false"><img class="gallery-background gallery-background-b" alt="" draggable="false"></div><div class="gallery-shade"></div></div><div class="gallery-interface"><nav class="gallery-nav" aria-label="项目浏览导航"><button class="gallery-back" type="button" aria-label="返回卡片"><span aria-hidden="true">↖</span> BACK</button><span class="gallery-brand">MARVLORE</span><button class="gallery-close" type="button" aria-label="关闭项目浏览">×</button></nav><h2 id="gallery-title"><span class="gallery-name-a" aria-hidden="true"></span><span class="gallery-name-b" aria-hidden="true"></span></h2><div class="gallery-rail" role="listbox" aria-label="选择项目，左右拖动或按方向键切换" tabindex="0"><div class="gallery-thumbnails"></div></div><div class="gallery-pagination" aria-hidden="true"><span class="gallery-current"></span><span class="gallery-total"></span><i><b></b></i></div></div><span class="gallery-status sr-only" role="status" aria-live="polite"></span>`;
 document.body.append(dialog);
 const art=dialog.querySelector('.gallery-art'),interfaceLayer=dialog.querySelector('.gallery-interface');
 const videoPlayer=createGalleryVideo(dialog);
 const slideshow=createGallerySlideshow(dialog,dialog.querySelector('.gallery-image-stack'),()=>renderRail(position.value),reducedMotion);
 const dimmer=dialog.querySelector('.gallery-dimmer'),backgrounds=[...dialog.querySelectorAll('.gallery-background')];
 const heading=dialog.querySelector('#gallery-title'),names=[...heading.children],rail=dialog.querySelector('.gallery-rail');
 const thumbnails=dialog.querySelector('.gallery-thumbnails'),status=dialog.querySelector('.gallery-status');
 let items=[],buttons=[],selected=-1,geometry=null,source=null,sourceVisibility='',returnFocus=null;
 let titleFlight=null;
 let opened=false,closing=false,routeReady=false,ownedHistory=false,returnHash='#home',drag=null,suppressUntil=0,step=1,cardWidth=200;
 const setImage=(image,item)=>{
  const src=slideshow.src(item);
  if(image.dataset.imageSrc===src)return;
  image.dataset.projectId=item.id;image.dataset.imageSrc=src||'';
  if(src)image.src=src;else image.removeAttribute('src');
 };
 const restoreSource=()=>{if(source){source.style.visibility=sourceVisibility;source=null;}};
 const hideSource=element=>{restoreSource();if(element){source=element;sourceVisibility=element.style.visibility;element.style.visibility='hidden';}};
 const announceState=()=>window.dispatchEvent(new CustomEvent('marvlore:gallery-state',{detail:{open:opened}}));
 const routeFor=item=>`#view/${encodeURIComponent(item.id)}`;
 const updateRoute=()=>{if(opened&&!closing&&routeReady)history.replaceState(history.state,'',routeFor(items[selected]));};
 const wrapTitle=raw=>{const title=titleCase(raw);return /[\u3400-\u9fff]/.test(title)?title.replace(/\s+(?=[\u3400-\u9fff])/,'\n'):title.replace(' ','\n');};
 const measure=()=>{dialog.style.width=`${innerWidth}px`;dialog.style.height=`${innerHeight}px`;cardWidth=Math.max(180,Math.min(320,innerWidth*.155));step=cardWidth+6;renderRail(position.value);measureTitleFlight();renderExpansion(expansion.value);};
 function measureTitleFlight(){
  if(!titleFlight)return;
  const {origin,old}=titleFlight,content=origin.querySelector('.hero-split-title')||origin;
  const from=content.getBoundingClientRect(),style=getComputedStyle(origin);
  if(from.width>0){
   titleFlight.from={x:from.left,y:from.top};titleFlight.fontSize=parseFloat(style.fontSize);
   Object.assign(old.style,{width:`${from.width}px`,fontFamily:style.fontFamily,fontSize:style.fontSize,fontWeight:style.fontWeight,fontStyle:style.fontStyle,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,wordSpacing:style.wordSpacing,color:style.color});
  }
  const transform=heading.style.transform;heading.style.transform='none';
  const to=heading.getBoundingClientRect();
  titleFlight.to={x:to.left,y:to.top};titleFlight.targetFontSize=parseFloat(getComputedStyle(heading).fontSize);
  heading.style.transform=transform;
 }
 function beginTitleFlight(origin){
  if(!origin?.isConnected||!origin.closest('#home'))return;
  const content=origin.querySelector('.hero-split-title')||origin;
  if(!origin.textContent.trim()||content.getBoundingClientRect().width<1)return;
  const layer=document.createElement('div'),old=document.createElement('div');
  layer.className='gallery-title-flight';old.className='gallery-title-origin';old.setAttribute('aria-hidden','true');
  old.append(...[...origin.childNodes].map(node=>node.cloneNode(true)));
  layer.append(old,heading);dialog.append(layer);
  titleFlight={origin,visibility:origin.style.visibility,layer,old};
  measureTitleFlight();origin.style.visibility='hidden';dialog.dataset.heroTitleTransition='true';
 }
 function endTitleFlight(){
  if(!titleFlight)return;
  const {origin,visibility,layer}=titleFlight;
  origin.style.visibility=visibility;interfaceLayer.insertBefore(heading,rail);layer.remove();
  heading.style.removeProperty('transform');heading.style.removeProperty('opacity');heading.style.removeProperty('filter');
  delete dialog.dataset.heroTitleTransition;titleFlight=null;
 }
 function renderTitleFlight(p){
  if(!titleFlight)return;
  const {old,from,to,fontSize,targetFontSize}=titleFlight;
  const ratio=targetFontSize/fontSize;
  const t=clamp((p-.15)/.6,0,1),fade=t*t*(3-2*t);
  old.style.transform=`translate3d(${mix(from.x,to.x,p)}px,${mix(from.y,to.y,p)}px,0) scale(${mix(1,ratio,p)})`;
  old.style.opacity=1-fade;old.style.filter=`blur(${fade*3}px)`;
  heading.style.transform=`translate3d(${(from.x-to.x)*(1-p)}px,${(from.y-to.y)*(1-p)}px,0) scale(${mix(1/ratio,1,p)})`;
  heading.style.opacity=fade;heading.style.filter=`blur(${(1-fade)*3}px)`;
 }
 function renderRail(value){
  if(!items.length)return;
  const n=items.length,floor=Math.floor(value),fraction=value-floor;
  const a=items[modulo(floor,n)],b=items[modulo(floor+1,n)];
  setImage(backgrounds[0],a);setImage(backgrounds[1],b);
  backgrounds[0].style.opacity=1-fraction;backgrounds[1].style.opacity=fraction;
  [a,b].forEach((item,index)=>{
   if(names[index].dataset.projectId===item.id)return;
   names[index].dataset.projectId=item.id;
   names[index].replaceChildren(...wrapTitle(item.title).split('\n').map(text=>{
    const line=document.createElement('span');line.className='gallery-name-line';
    if(/[\u3400-\u9fff]/.test(text))line.classList.add('is-cjk');
    line.textContent=text;return line;
   }));
  });
  names[0].style.opacity=1-fraction;names[1].style.opacity=fraction;
  names[0].style.transform=`translateY(${-fraction*16}px)`;names[1].style.transform=`translateY(${(1-fraction)*16}px)`;
  const center=modulo(value,n)+n;
  buttons.forEach((button,index)=>{
   const distance=index-center,weight=Math.max(0,1-Math.abs(distance));
   const regularHeight=cardWidth*9/16,activeHeight=Math.min(cardWidth*1.34,innerHeight*.36);
   const height=mix(regularHeight,activeHeight,weight*weight*(3-2*weight));
   button.style.width=`${cardWidth}px`;button.style.height=`${height}px`;
   button.style.borderRadius=`${cardCornerRadius(cardWidth,height)}px`;
   button.style.transform=`translate3d(${innerWidth/2-cardWidth/2+distance*step}px,0,0)`;
   button.style.zIndex=Math.round(weight*10);
   button.setAttribute('aria-selected',String(Math.abs(distance)<.5));
   button.tabIndex=Math.abs(distance)<.5?0:-1;
  });
  const index=modulo(Math.round(value),n);
  if(index!==selected){
   selected=index;heading.setAttribute('aria-label',titleCase(items[index].title));
   if(opened&&!closing){videoPlayer.select(items[index]);slideshow.select(items[index]);}
   status.textContent=`${items[index].title}，${index+1} / ${n}`;
   dialog.querySelector('.gallery-current').textContent=String(index+1).padStart(2,'0');
   rail.setAttribute('aria-activedescendant',`gallery-item-${index+n}`);updateRoute();
  }
  dialog.querySelector('.gallery-pagination b').style.transform=`translateX(${selected*100}%)`;
 }
 function renderExpansion(value){
  if(!opened)return;
  const p=clamp(value,0,1),full=screenQuad(innerWidth,innerHeight);
  const width=mix(geometry?.width??innerWidth,innerWidth,p),height=mix(geometry?.height??innerHeight,innerHeight,p);
  const quad=blendQuad(geometry?.quad??full,full,p);
  art.style.width=`${width}px`;art.style.height=`${height}px`;
  art.style.transform=`matrix3d(${quadMatrix(quad,width,height).join(',')})`;
  art.style.borderRadius=`${(geometry?.radius??0)*(1-p)}px`;
  art.style.opacity=geometry?'1':String(p);
  dimmer.style.opacity=p;
  const ui=clamp((p-.72)/.28,0,1);interfaceLayer.style.opacity=ui;
  interfaceLayer.style.transform=`translateY(${(1-ui)*14}px)`;
  dialog.style.setProperty('--gallery-video-reveal',ui);
  dialog.style.setProperty('--gallery-shade',.28*p);
  renderTitleFlight(p);
 }
 const expansion=new Spring(0,renderExpansion,{response:.58,precision:.0002,onRest:value=>{
  if(value===0&&closing){
   opened=false;closing=false;position.stop();restoreSource();endTitleFlight();videoPlayer.clear();slideshow.clear();dialog.close();
   document.documentElement.classList.remove('project-gallery-open');announceState();
   if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  }
 }});
 const position=new Spring(0,renderRail,{response:.42,precision:.0003});
 const buildItems=next=>{
  items=next;selected=-1;thumbnails.replaceChildren();buttons=[];
  for(let i=0;i<items.length*3;i++){
   const item=items[i%items.length],button=document.createElement('button');
   button.type='button';button.className='gallery-thumbnail';button.id=`gallery-item-${i}`;
   button.setAttribute('role','option');button.setAttribute('aria-label',item.title);button.dataset.projectId=item.id;button.dataset.index=i;
   const image=document.createElement('img');image.alt='';image.draggable=false;if(item.src)image.src=item.src;
   button.append(image);thumbnails.append(button);buttons.push(button);
  }
  dialog.querySelector('.gallery-total').textContent=String(items.length).padStart(2,'0');
  dialog.querySelector('.gallery-pagination b').style.width=`${100/items.length}%`;
  items.forEach(item=>{if(item.src){const image=new Image();image.src=item.src;}});
 };
 const open=({items:next,index=0,source:trigger,titleSource,historyMode='push'})=>{
  if(!next?.length)return;
  if(opened){if(items!==next)buildItems(next);closing=false;position.to(index);videoPlayer.start();slideshow.resume();expansion.to(1);return;}
  geometry=visibleSource(trigger);returnFocus=trigger?.closest('.circular-carousel')||trigger?.closest('a,button')||document.activeElement;
  returnHash=location.hash.startsWith('#view/')?(history.state?.returnHash||'#home'):location.hash.startsWith('#project-')?'#work':location.hash||'#home';
  ownedHistory=historyMode==='push'||Boolean(history.state?.marvloreGallery);opened=true;closing=false;routeReady=false;
  buildItems(next);document.documentElement.classList.add('project-gallery-open');announceState();
  hideSource(geometry?.element);dialog.showModal();position.jump(index);measure();
  videoPlayer.start();
  if(trigger?.closest('#hero-orbit'))beginTitleFlight(titleSource);
  expansion.jump(reducedMotion.matches?1:0);expansion.to(1);
  if(historyMode!=='none')history[historyMode==='replace'?'replaceState':'pushState']({marvloreGallery:true,returnHash},'',routeFor(items[index]));
  routeReady=true;
  dialog.querySelector('.gallery-back').focus({preventScroll:true});
 };
 const close=({historyMode='back'}={})=>{
  if(!opened)return;
  if(historyMode==='back'){
   if(ownedHistory&&history.state?.marvloreGallery){history.back();return;}
   history.replaceState(null,'',returnHash);
  }
  if(expansion.value>.999){const destination=visibleSource(sourceFor(items[selected].id));geometry=destination;hideSource(destination?.element);}
  if(titleFlight){
   if(expansion.value>.999&&titleFlight.origin.textContent.trim())titleFlight.old.replaceChildren(...[...titleFlight.origin.childNodes].map(node=>node.cloneNode(true)));
   measureTitleFlight();
  }
  closing=true;videoPlayer.pause();slideshow.pause();drag=null;position.to(Math.round(position.value));expansion.to(0);
 };
 const syncRoute=()=>{
  if(location.hash.startsWith('#view/')){
   let id;try{id=decodeURIComponent(location.hash.slice(6));}catch{return;}
   const group=groups.find(group=>group.some(item=>item.id===id));if(!group)return;
   const index=group.findIndex(item=>item.id===id);
   if(opened){routeReady=false;if(items!==group)buildItems(group);position.jump(index);routeReady=true;closing=false;slideshow.resume();expansion.to(1);}
   else open({items:group,index,historyMode:'none'});
  }else if(opened)close({historyMode:'none'});
 };
 window.addEventListener('popstate',syncRoute);window.addEventListener('hashchange',syncRoute);queueMicrotask(syncRoute);
 dialog.querySelector('.gallery-back').addEventListener('click',()=>close());
 dialog.querySelector('.gallery-close').addEventListener('click',()=>close());
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('dragstart',event=>event.preventDefault());
 dialog.addEventListener('wheel',event=>{event.preventDefault();if(Math.abs(event.deltaX)>Math.abs(event.deltaY)){position.jump(position.value+event.deltaX/step);clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>position.to(Math.round(position.value)),120);}}, {passive:false});
 let wheelTimer=0;
 dialog.addEventListener('pointerdown',event=>{
  if(event.button!==0||event.target.closest('.gallery-nav,video,.gallery-video-play'))return;
  clearTimeout(wheelTimer);position.stop();
  drag={id:event.pointerId,x:event.clientX,start:position.value,moved:false,samples:[{time:performance.now(),value:position.value}]};
 });
 dialog.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.x;
  if(!drag.moved&&Math.abs(dx)<5)return;
  if(!drag.moved){drag.moved=true;dialog.setPointerCapture(event.pointerId);dialog.classList.add('is-dragging');}
  position.jump(drag.start-dx/step);
  drag.samples.push({time:performance.now(),value:position.value});drag.samples=drag.samples.slice(-12);
 });
 const release=event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const current=drag;drag=null;dialog.classList.remove('is-dragging');
  if(!current.moved)return;
  suppressUntil=performance.now()+250;
  const velocity=event.type==='pointercancel'?0:releaseVelocity(current.samples);
  const target=event.type==='pointercancel'?Math.round(position.value):projectSnap(position.value,current.start,velocity);
  position.to(target,{velocity,damping:velocity===0?1:.9});
 };
 dialog.addEventListener('pointerup',release);dialog.addEventListener('pointercancel',release);
 dialog.addEventListener('click',event=>{
  if(performance.now()<suppressUntil){event.preventDefault();return;}
  const button=event.target.closest('.gallery-thumbnail');if(!button)return;
  const index=Number(button.dataset.index)%items.length;
  const current=modulo(position.value,items.length),delta=index-current;
  const shortest=delta-items.length*Math.round(delta/items.length);
  position.to(position.value+shortest);
 });
 dialog.addEventListener('keydown',event=>{
  if(event.target.closest('video'))return;
  if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();position.to(Math.round(position.target)+(event.key==='ArrowRight'?1:-1));}
  else if(event.key==='Home'||event.key==='End'){event.preventDefault();position.to(Math.floor(position.value/items.length)*items.length+(event.key==='End'?items.length-1:0));}
 });
 window.addEventListener('resize',()=>{if(opened)measure();});
 reducedMotion.addEventListener('change',()=>{if(opened){position.to(position.target);expansion.to(closing?0:1);}});
 return {open,close};
}
