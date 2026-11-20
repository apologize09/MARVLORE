import { useEffect,useRef,useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import CircularCarousel from './CircularCarousel.jsx';
import SplitText from './SplitText.jsx';
import { heroProjects as staticHeroProjects } from './images.js';
import { cardCornerRadius } from '../../dist/card-shape.js';
import './hero.css';
const haloSrc='./assets/orbit/hero-orbit-light.webp';

function resolveHeroProjects(){
 try{
  const fromCms=typeof window!=='undefined'?window.__MARVLORE_HERO_PROJECTS__:null;
  if(Array.isArray(fromCms)&&fromCms.length)return fromCms;
 }catch{}
 return staticHeroProjects;
}

function HeroCarousel({titleTarget,items}){
 const carouselItems=items;
 const [paused,setPaused]=useState(false),[reduced,setReduced]=useState(false);
 const [galleryOpen,setGalleryOpen]=useState(()=>document.documentElement.classList.contains('project-gallery-open'));
 const [ready,setReady]=useState(false),[replayKey,setReplayKey]=useState(0);
 const [introStarted,setIntroStarted]=useState(false);
 const [inView,setInView]=useState(false);
 const [pageVisible,setPageVisible]=useState(()=>!document.hidden);
 const started=ready&&inView&&pageVisible;
 useEffect(()=>{if(!started)setIntroStarted(false);},[started]);
 const stageRef=useRef(null);
 const titleCenterOffset=useRef(0);
 const [cardWidth,setCardWidth]=useState(360);
 useEffect(()=>{
  setGalleryOpen(document.documentElement.classList.contains('project-gallery-open'));
  const update=event=>setGalleryOpen(event.detail.open);
  window.addEventListener('marvlore:gallery-state',update);
  return ()=>window.removeEventListener('marvlore:gallery-state',update);
 },[]);
 useEffect(()=>{
  const query=matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReduced(query.matches);update();query.addEventListener('change',update);
  return ()=>query.removeEventListener('change',update);
 },[]);
 useEffect(()=>{
  let alive=true;
  // Unblock intro after first 2 posters or 280ms — do not wait for fonts / full deck.
  const media=carouselItems.slice(0,2).map(item=>item.src).concat(haloSrc).map(src=>{
   const image=new Image();image.src=src;return image.decode().catch(()=>{});
  });
  const timeout=new Promise(resolve=>setTimeout(resolve,280));
  Promise.race([Promise.all(media),timeout]).then(()=>{if(alive)setReady(true);});
  return ()=>{alive=false;};
 },[carouselItems]);
 useEffect(()=>{
  // Home is the default landing view — treat as in-view unless scrolled away.
  if(typeof window!=='undefined' && window.scrollY<80){setInView(true);}
  const target=document.querySelector('#home');
  if(!target||typeof IntersectionObserver==='undefined'){setInView(true);return;}
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(entry.intersectionRatio>=.35)setInView(true);
    else if(entry.intersectionRatio<.1)setInView(false);
   }
  },{threshold:[0,.1,.35]});
  observer.observe(target);return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const update=()=>{setPageVisible(!document.hidden);if(!document.hidden)setPaused(false);};
  document.addEventListener('visibilitychange',update);
  return ()=>document.removeEventListener('visibilitychange',update);
 },[]);
 useEffect(()=>{
  const stage=stageRef.current;if(!stage)return;
  const resize=()=>{
   setCardWidth(Math.round(Math.min(720,Math.max(260,stage.clientWidth*.40))));
   if(titleTarget){
    const previous=titleTarget.style.getPropertyValue('--hero-title-y');
    titleTarget.style.setProperty('--hero-title-y','0px');
    const home=document.querySelector('#home').getBoundingClientRect(),text=titleTarget.getBoundingClientRect();
    titleCenterOffset.current=home.height/2-(text.top-home.top+text.height/2);
    titleTarget.style.setProperty('--hero-title-y',previous||'0px');
   }
  };
  const observer=new ResizeObserver(resize);observer.observe(stage);resize();
  return ()=>observer.disconnect();
 },[]);
 return <div className="hero-carousel-island">
  {started&&introStarted&&titleTarget&&createPortal(<SplitText key={replayKey} text="Ideas Make Brands POP" tag="span" className="hero-split-title"
   effect="fade" splitType="words" delay={140} duration={.7} staggerFrom="start" trigger="load"
   from={{opacity:0,y:18,filter:'blur(6px)'}} to={{opacity:1,y:0,filter:'blur(0px)'}}
   hoverEffect="lift" loop={false} loopDelay={1.5} mask={false} threshold={.1} rootMargin="-100px" textAlign="center"
   onLetterAnimationComplete={()=>titleTarget.dispatchEvent(new CustomEvent('marvlore:title-ready',{bubbles:true}))}/>,titleTarget)}
  <div ref={stageRef} className="hero-carousel-stage">
   {started&&<img key={`halo-${replayKey}`} className="hero-halo" src={haloSrc} alt="" aria-hidden="true" decoding="async"/>}
   {started&&<CircularCarousel key={replayKey} items={carouselItems} preset="cylinder" intro="direct"
    onIntroStart={()=>setIntroStarted(true)}
    onIntroProgress={(morph,clock)=>{
     stageRef.current?.style.setProperty('--hero-halo-opacity',clock?.halo??morph);
     titleTarget?.style.setProperty('--hero-title-y',`${titleCenterOffset.current*(1-(clock?.titleLift??1))}px`);
     // Keep the original opening size, then blend into the smaller settled title.
     const titleLift=clock?.titleLift??1;
     const openingCompensation=1+(1/.65-1)*(1-titleLift);
     titleTarget?.style.setProperty('--hero-title-scale',(clock?.titleScale??1)*openingCompensation);
    }}
    cardWidth={cardWidth} aspectRatio={16/9} speed={14} captions paused={paused||galleryOpen}
    onItemClick={(item,index,source)=>window.dispatchEvent(new CustomEvent('marvlore:open-project',{detail:{items:carouselItems,index,source,titleSource:titleTarget}}))}
    gap={cardWidth*.25} curve={0} tilt={-14} perspective={cardWidth*3} depthFade={.22} innerShade={.9}
    pauseOnHover={false} parallax={0} stretch={0} focusOnClick={false} draggable={!paused&&!galleryOpen}
    cornerRadius={cardCornerRadius(cardWidth,cardWidth/(16/9))} className="marvlore-circular-carousel"/>}
  </div>
  <div className="hero-orbit-tools">
   <span className="orbit-hint">拖动浏览精选作品 <span aria-hidden="true">↔</span></span>
   <div className="orbit-actions">
    <button className="orbit-replay" type="button" aria-label="重播首屏入场" disabled={!started||reduced}
     onClick={()=>{setPaused(false);setIntroStarted(false);setReplayKey(value=>value+1);}}><span aria-hidden="true">↻</span> 重播入场</button>
    <button className="orbit-playback" type="button" aria-label={paused?'播放卡片旋转':'暂停卡片旋转'} aria-pressed={paused}
     disabled={!started||reduced} onClick={()=>setPaused(value=>!value)}>
     {paused||reduced?<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5 10 6 3 10.5z" fill="currentColor"/></svg>:<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1h2v10H3zm4 0h2v10H7z" fill="currentColor"/></svg>}
     <span>{reduced?'静态预览':paused?'继续旋转':'暂停旋转'}</span>
    </button>
   </div>
  </div>
 </div>;
}

export function mountHeroOrbit(){
 const title=document.querySelector('#hero-title');
 const target=document.querySelector('#hero-orbit');
 const items=resolveHeroProjects();
 if(target){
  if(title){title.replaceChildren();title.setAttribute('aria-label','Ideas Make Brands POP');}
  createRoot(target).render(<HeroCarousel titleTarget={title} items={items}/>);
 }
}
