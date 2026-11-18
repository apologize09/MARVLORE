import {titleCase} from './typography.js?v=bff0b2cf2f';
import PhotoSwipeLightbox from './vendor/photoswipe/photoswipe-lightbox.esm.min.js?v=b82c385604';
import {Spring,reducedMotion,clamp} from './motion.js?v=53e5c054f1';
import {getWorkDetail} from './cms/work-runtime.js?v=0e7bc9d56a';

// Editorial case-study structure: title, context, large media, next project.
// Independently styled for MARVLORE; PhotoSwipe 5.4.4 (MIT) handles image zoom.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountWorkDetails(){
 const root=document.createElement('section');root.id='work-detail';root.hidden=true;
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','case-title');
 root.innerHTML='<div class="case-scroll"><div class="case-progress" aria-hidden="true"><i></i></div><nav class="case-nav" aria-label="项目内页导航"><button class="case-back" type="button"><span aria-hidden="true">←</span> 返回作品</button><span class="case-brand">MARVLORE<span>迈络</span></span><div class="case-nav-end"><span class="case-count"></span><button class="case-close" type="button" aria-label="关闭项目详情">×</button></div></nav><div class="case-content"></div></div>';
 document.body.append(root);
 const scroller=root.querySelector('.case-scroll'),content=root.querySelector('.case-content');
 const main=document.querySelector('#app'),nav=document.querySelector('.floating-nav');
 let current=null,opened=false,closing=false,source=null,sourceFocus=null,returnHash='#work',ownedHistory=false;
 let observer=null,scrollFrame=0,lightbox=null,animations=[];
 const pageTitle=document.title;
 const progress=new Spring(0,value=>{
  root.style.opacity=String(clamp(value,0,1));
  scroller.style.transform=reducedMotion.matches?'none':'translate3d(0,'+((1-value)*24)+'px,0)';
 },{response:.36,precision:.001,onRest:value=>{if(closing&&value===0)finishClose();}});
 function announce(open){window.dispatchEvent(new CustomEvent('marvlore:gallery-state',{detail:{open}}));}
 function mediaMarkup(item,index,{cover=false}={}){
  if(!item?.src)return '';
  if(item.type==='video'){
   // Sources are attached only after open via hydrateVideos(); keep markup src-free for deferred load.
   return '<figure class="case-media case-reveal"><video controls playsinline preload="none"'+(item.poster?' poster="'+esc(item.poster)+'"':'')+' data-card-shape data-video-src="'+esc(item.src)+'"'+(item.srcHd?' data-video-src-hd="'+esc(item.srcHd)+'"':'')+' aria-label="'+esc(item.alt??'项目视频')+'"></video>'+(item.alt?'<figcaption>'+esc(item.alt)+'</figcaption>':'')+'</figure>';
  }
  return '<figure class="case-media '+(cover?'case-cover':'case-reveal')+'"><a href="'+esc(item.src)+'" data-case-zoom data-pswp-width="'+item.width+'" data-pswp-height="'+item.height+'" data-card-shape aria-label="放大查看：'+esc(item.alt)+'"><img src="'+esc(item.src)+'" alt="'+esc(item.alt)+'" width="'+item.width+'" height="'+item.height+'" loading="'+(cover?'eager':'lazy')+'" decoding="async"><span class="case-zoom-mark" aria-hidden="true">＋</span></a><figcaption><span>'+String(index+1).padStart(2,'0')+' / '+esc(item.alt)+'</span><span>点击查看细节 ↗</span></figcaption></figure>';
 }
 function initZoom(){
  lightbox?.destroy();
  lightbox=new PhotoSwipeLightbox({gallery:root,children:'a[data-case-zoom]',
   pswpModule:()=>import('./vendor/photoswipe/photoswipe.esm.min.js'),
   bgOpacity:1,padding:{top:74,bottom:48,left:42,right:42},
   showAnimationDuration:reducedMotion.matches?0:320,hideAnimationDuration:reducedMotion.matches?0:260,
   zoomAnimationDuration:reducedMotion.matches?0:260,closeTitle:'关闭图片',zoomTitle:'放大图片',arrowPrevTitle:'上一张',arrowNextTitle:'下一张',
   errorMsg:'图片暂时无法加载',wheelToZoom:false,returnFocus:true,
   initialZoomLevel:'fit',secondaryZoomLevel:2,maxZoomLevel:3
  });
  lightbox.init();
 }
 function revealContent(){
  observer?.disconnect();animations.forEach(a=>a.cancel());animations=[];
  if(reducedMotion.matches)return;
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;observer.unobserve(entry.target);
   const animation=entry.target.animate([{opacity:0,transform:'translateY(26px)',filter:'blur(4px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
   animations.push(animation);
  }),{root:scroller,threshold:.07});
  content.querySelectorAll('.case-reveal').forEach(el=>observer.observe(el));
 }
 function unloadVideos(){
  content.querySelectorAll('video').forEach(video=>{
   video.pause();video.removeAttribute('src');
   video.querySelectorAll('source').forEach(node=>node.remove());
   video.load();
  });
 }
 function hydrateVideos(){
  content.querySelectorAll('video[data-video-src]').forEach(video=>{
   const src=video.dataset.videoSrc;if(!src)return;
   // Detail pages stream the 720p default only; HD remains available via gallery toggle.
   video.src=src;video.preload='metadata';
   video.play().catch(()=>{video.muted=true;video.play().catch(()=>{});});
  });
 }
 function render(item){
  unloadVideos();
  const next=getWorkDetail(item.nextId),media=item.media??[];
  root.querySelector('.case-count').textContent=String(item.index).padStart(2,'0')+' / '+String(item.total).padStart(2,'0');
  content.innerHTML='<article class="case-article"><header class="case-heading"><div class="case-kicker"><i></i>'+esc(item.eyebrow)+'</div><div class="case-title-row"><div><h1 id="case-title">'+esc(titleCase(item.title))+'</h1><p class="case-subtitle">'+esc(item.subtitle)+'</p></div><p class="case-summary">'+esc(item.summary)+'</p></div></header>'+mediaMarkup(item.cover,0,{cover:true})+'<section class="case-overview case-reveal" aria-labelledby="case-overview-title"><div class="case-section-label">01 / 项目介绍</div><div class="case-intro"><h2 id="case-overview-title">'+esc(titleCase(item.intro))+'</h2><div class="case-services"><span>服务领域</span><ul>'+item.tags.map(tag=>'<li>'+esc(tag)+'</li>').join('')+'</ul></div></div></section>'+(media.length?'<section class="case-visuals" aria-labelledby="case-visuals-title"><div class="case-section-header case-reveal"><h2 id="case-visuals-title">视觉展示<span>Selected Visuals</span></h2><span>'+String(media.length).padStart(2,'0')+' 张素材</span></div><div class="case-media-grid">'+media.map((asset,i)=>mediaMarkup(asset,i+1)).join('')+'</div></section>':'')+(next?'<footer class="case-footer case-reveal"><span class="case-section-label">继续探索</span><a href="#case/'+esc(next.id)+'" data-case-next="'+esc(next.id)+'" class="case-next"><div><span>下一个项目</span><h2>'+esc(titleCase(next.title))+'</h2><p>'+esc(next.subtitle)+'</p></div><span class="case-next-arrow" aria-hidden="true">↗</span></a><button class="case-return" type="button" data-case-return>← 返回全部作品</button></footer>':'')+'</article>';
  scroller.scrollTop=0;root.querySelector('.case-progress i').style.transform='scaleX(0)';
  document.title=item.title+' · MARVLORE 迈络';
  initZoom();revealContent();hydrateVideos();
 }
 function lock(){
  main.inert=true;if(nav)nav.inert=true;
  document.documentElement.classList.add('work-detail-open','project-gallery-open');announce(true);
 }
 function finishClose(){
  unloadVideos();
  opened=false;closing=false;root.hidden=true;
  main.inert=false;if(nav)nav.inert=false;
  document.documentElement.classList.remove('work-detail-open');
  if(!document.querySelector('#project-gallery[open]'))document.documentElement.classList.remove('project-gallery-open');
  announce(false);document.title=pageTitle;
  observer?.disconnect();animations.forEach(a=>a.cancel());animations=[];lightbox?.destroy();lightbox=null;
  sourceFocus?.isConnected&&sourceFocus.focus({preventScroll:true});current=null;
 }
 function open({id,source:trigger=null,historyMode='push'}={}){
  const item=getWorkDetail(id);if(!item)return;
  if(opened&&!closing&&current?.id===id)return;
  const wasOpen=opened;
  if(!wasOpen){
   source=trigger;sourceFocus=trigger?.closest('a,button')??document.activeElement;
   returnHash=location.hash.startsWith('#case/')?(history.state?.returnHash??'#work'):(location.hash||'#work');
   ownedHistory=historyMode==='push'||Boolean(history.state?.marvloreCase);
  }
  current=item;opened=true;closing=false;root.hidden=false;lock();render(item);
  if(!wasOpen)progress.jump(reducedMotion.matches?1:0);progress.to(1);
  if(historyMode!=='none')history[wasOpen||historyMode==='replace'?'replaceState':'pushState']({marvloreCase:true,returnHash},'','#case/'+encodeURIComponent(id));
  root.querySelector('.case-back').focus({preventScroll:true});
 }
 function close({historyMode='back'}={}){
  if(!opened)return;
  if(historyMode==='back'){
   if(ownedHistory&&history.state?.marvloreCase){history.back();return;}
   history.replaceState(null,'',returnHash);
  }
  closing=true;unloadVideos();lightbox?.pswp?.close();progress.to(0);
 }
 function syncRoute(){
  if(location.hash.startsWith('#case/')){
   let id;try{id=decodeURIComponent(location.hash.slice(6));}catch{return;}
   open({id,historyMode:'none'});
  }else if(opened)close({historyMode:'none'});
 }
 root.querySelector('.case-back').addEventListener('click',()=>close());
 root.querySelector('.case-close').addEventListener('click',()=>close());
 root.addEventListener('click',event=>{
  const next=event.target.closest('[data-case-next]');
  if(next){event.preventDefault();open({id:next.dataset.caseNext});}
  if(event.target.closest('[data-case-return]'))close();
 });
 root.addEventListener('keydown',event=>{
  if(lightbox?.pswp)return;
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.key!=='Tab')return;
  const focusable=[...root.querySelectorAll('a[href],button,video[controls],[tabindex="0"]')].filter(el=>el.getClientRects().length);
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 });
 scroller.addEventListener('scroll',()=>{
  if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{
   scrollFrame=0;const max=scroller.scrollHeight-scroller.clientHeight;
   root.querySelector('.case-progress i').style.transform='scaleX('+(max>0?clamp(scroller.scrollTop/max,0,1):0)+')';
  });
 },{passive:true});
 window.addEventListener('popstate',syncRoute);window.addEventListener('hashchange',syncRoute);queueMicrotask(syncRoute);
 reducedMotion.addEventListener('change',()=>{if(opened)progress.to(closing?0:1);});
 return {open,close};
}
