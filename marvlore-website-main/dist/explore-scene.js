import { aboutCards } from './about-cards.js?v=6d5625a465';
import { createExploreRenderer } from './explore-renderer.js?v=58243d8469';
import {wallCards} from './wall-cards.js?v=d7a9e93892';
import {createExplorePlayback} from './explore-playback.js?v=252b33b3ef';
import {FLIGHT_PREROLL,exploreBackgroundVisibility} from './explore-entry.js?v=c3577134d8';
import {directWallProgress,WALL_SCROLL_START,WALL_SCROLL_LINK} from './explore-direct-wall.js?v=c13dba07ab';

// Each floating sheet has its own replaceable image. Set image to a project URL;
// the existing artwork is cropped into an independent viewport until replaced.
export const exploreCards = aboutCards.map((card, i) => ({
  ...card,
  id: `explore-${card.id}-${i}`,
  image: '',
  phase: i * 2.399963229728653,
  lane: i % 3,
  size: [196, 150, 176, 132, 208, 164, 188, 142][i % 8],
  roll: [-24, 17, -12, 29, -33, 13, 21, -18][i % 8],
}));

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function artwork(card) {
  if (card.image) return `<img src="${escape(card.image)}" alt="" loading="lazy" decoding="async" style="object-fit:${escape(card.fit)};object-position:${escape(card.position)}">`;
  const p = card.preview;
  const zoom = card.row === 'bottom' && (card.index === 0 || card.index === 4) ? 1.35 : 1.055;
  return `<svg viewBox="0 0 350 350" aria-hidden="true"><image href="./assets/${p.image}" width="${p.width}" height="${p.height}" transform="translate(175 175) scale(${zoom}) rotate(${-p.rotation}) translate(${-p.cx} ${-p.cy})"/></svg>`;
}


export function renderExploreCards() {
  return exploreCards.map((card,i) => '<figure class="explore-sheet" style="--fallback-angle:'+i*36+'deg" data-card-shape role="img" aria-label="'+escape(card.alt)+'"><div class="explore-sheet__surface">'+artwork(card)+'</div></figure>').join('');
}

export function mountExploreScene() {
  const field=document.querySelector('#explore .explore-field');
  if(!field)return ()=>{};
  const scene=field.parentElement,canvas=document.createElement('canvas');
  canvas.className='explore-canvas';canvas.setAttribute('aria-hidden','true');field.append(canvas);
  const controller=new AbortController(),options={signal:controller.signal};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const lines=[...scene.querySelectorAll('.explore-reveal-line')];
  const arrow=scene.querySelector('.explore-arrow-reveal');
  const introEnd=1.52;
  let renderer,visible=false,disposed=false,raf=0,introTime=0;
  let cardsStarted=false;
  const section=scene.closest('#explore');
  const portal=document.querySelector('#marvlore-go');
  scene.append(portal);portal.classList.add('portal-assembly');portal.dataset.assembled='false';
  portal.querySelector('[aria-label]')?.setAttribute('aria-label','弧形作品墙，向下滚动或左右拖动浏览');
  const copy=scene.querySelector('.explore-copy');
  const playback=createExplorePlayback({initialFlightTime:FLIGHT_PREROLL});
  let drag=null,lastFrame=0,entryVisibility=0,preparedVersion=-1;
  function reveal(el,progress,distance){
    const t=Math.max(0,Math.min(1,progress)),ease=1-(1-t)**3;
    el.style.opacity=String(t*t*(3-2*t));
    el.style.transform='translate3d(0,'+(distance*(1-ease))+'px,0)';
    el.style.filter='blur('+(8*(1-ease))+'px)';
  }
  function showIntro(){
    lines.forEach((line,i)=>reveal(line,(introTime-i*.22)/1.05,54));
    reveal(arrow,(introTime-.72)/.8,28);
    scene.dataset.exploreStage=cardsStarted?'images':introTime>=introEnd?'images':'text';
  }
  // Text is scrubbed by document scroll, never advanced by elapsed time.
  function updateScroll(){
    const top=section.getBoundingClientRect().top;
    const start=innerHeight*.45,end=scene.clientHeight*.5;
    const progress=Math.max(0,Math.min(1,(start-top)/(start+end)));
    introTime=progress*introEnd;showIntro();
    const distance=-top/scene.clientHeight;
    const entry=Math.max(0,Math.min(1,(distance+.30)/.55));
    entryVisibility=entry*entry*(3-2*entry);
    const backgroundVisibility=exploreBackgroundVisibility(distance);
    cardsStarted=backgroundVisibility>0;
    field.classList.toggle('is-started',cardsStarted);
    playback.setProgress(directWallProgress(distance),reduced.matches,{releaseFlight:distance<WALL_SCROLL_START-.18});
    if(drag&&playback.requested<1)endDrag({pointerId:drag.id});
    const bounds=scene.getBoundingClientRect();
    if(bounds.bottom<=0||bounds.top>=innerHeight)playback.synchronize();
    field.style.opacity=String(backgroundVisibility);portal.style.opacity='1';
    portal.style.setProperty('--wall-reveal','0');
    updateVisuals();
    portal.dataset.scrollWall='true';
    resume();
  }
  function updateVisuals(){
    section.style.setProperty('--assembly-progress',playback.morph);
    const label=Math.max(0,Math.min(1,(playback.morph-.82)/.18));
    portal.style.setProperty('--copy-reveal',label*label*(3-2*label));
    portal.style.pointerEvents=playback.morph>=1?'auto':'none';portal.dataset.assembled=playback.morph>=1?'true':'false';
    copy.style.opacity=String(entryVisibility*(1-Math.min(1,playback.morph*4)));copy.style.pointerEvents=playback.morph>.2?'none':'auto';
  }
  function draw(now){
    raf=0;
    if(disposed||!renderer||!visible||!cardsStarted||document.hidden||reduced.matches){lastFrame=0;return;}
    const dt=lastFrame?Math.min((now-lastFrame)/1000,.1):0;lastFrame=now;
    playback.step(dt,{reduced:reduced.matches,dragging:Boolean(drag)});
    updateVisuals();
    renderFrame(dt,false);
    raf=requestAnimationFrame(draw);
  }
  function resume(){
    if(reduced.matches&&cardsStarted){updateVisuals();renderFrame(0,true);return;}
    if(!raf&&!disposed&&visible&&cardsStarted&&!document.hidden)raf=requestAnimationFrame(draw);
  }
  function renderFrame(dt,still){
    if(!renderer)return;
    if(playback.captureTime!==null&&preparedVersion!==playback.captureVersion){
      renderer.freeze(playback.captureTime);preparedVersion=playback.captureVersion;
    }
    renderer.frame(dt,still,playback.morph,playback.flightTime,playback.rotation,playback.captureTime!==null);
  }
  function resize(){
    renderer?.resize(scene.clientWidth,scene.clientHeight);preparedVersion=-1;
    updateScroll();
    if(renderer&&cardsStarted)renderFrame(0,reduced.matches);
  }
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;lastFrame=0;updateScroll();
  },{threshold:0});observer.observe(scene);
  scene.addEventListener('pointermove',event=>{if(!renderer)return;const rect=scene.getBoundingClientRect();renderer.pointer.x=event.clientX-rect.left-rect.width/2;renderer.pointer.y=rect.height/2-(event.clientY-rect.top);renderer.pointer.active=true;if(reduced.matches)renderFrame(0,true);},options);
  const clearPointer=()=>{if(renderer){renderer.pointer.active=false;if(reduced.matches)renderFrame(0,true);}};
  scene.addEventListener('pointerleave',clearPointer,options);
  window.addEventListener('blur',clearPointer,options);
  window.addEventListener('scroll',updateScroll,{...options,passive:true});
  window.addEventListener('resize',resize,options);
  document.querySelectorAll('a[href="#marvlore-go"]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();history.replaceState(history.state,'','#marvlore-go');
    window.scrollTo({top:section.getBoundingClientRect().top+window.scrollY+scene.clientHeight*WALL_SCROLL_LINK,behavior:reduced.matches?'instant':'smooth'});
  },options));
  const wall=portal.querySelector('.portal-wall');
  wall.addEventListener('pointerdown',e=>{if(playback.morph<1||e.button!==0||e.target.closest('a,button'))return;drag={id:e.pointerId,x:e.clientX};wall.setPointerCapture(e.pointerId);wall.classList.add('is-dragging');},options);
  wall.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;playback.rotate((e.clientX-drag.x)/scene.clientWidth);drag.x=e.clientX;updateScroll();},options);
  const endDrag=e=>{if(drag?.id!==e.pointerId)return;drag=null;wall.classList.remove('is-dragging');if(wall.hasPointerCapture(e.pointerId))wall.releasePointerCapture(e.pointerId);};
  wall.addEventListener('pointerup',endDrag,options);wall.addEventListener('pointercancel',endDrag,options);
  wall.addEventListener('keydown',e=>{if(playback.morph<1||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();playback.rotate((e.key==='ArrowRight'?1:-1)*Math.PI/10);updateScroll();},options);
  updateScroll();
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(scene);
  document.addEventListener('visibilitychange',()=>{lastFrame=0;resume();},options);
  reduced.addEventListener('change',()=>{lastFrame=0;updateScroll();resume();},options);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(raf);raf=0;field.classList.remove('is-webgl-ready');},options);
  createExploreRenderer(canvas,wallCards).then(result=>{
    if(disposed){result.destroy();return;}
    renderer=result;resize();field.classList.add('is-webgl-ready');resume();
  }).catch(error=>{canvas.remove();field.classList.add('is-fallback');console.warn('Explore uses its static fallback:',error);});
  return ()=>{disposed=true;cancelAnimationFrame(raf);controller.abort();observer.disconnect();sizeObserver.disconnect();renderer?.destroy();canvas.remove();field.classList.remove('is-webgl-ready');};
}
