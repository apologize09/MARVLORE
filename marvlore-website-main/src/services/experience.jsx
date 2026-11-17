import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {servicesTitleFrame,servicesListFrame,SERVICES_LIST_START} from './title-motion.js';
import {serviceItems as staticServiceItems} from './items.js';
import './experience.css';

const clamp=value=>Math.max(0,Math.min(1,value));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

function resolveServiceItems(){
 // Shared with app.js boot bundle via window — avoid importing the CMS runtime module
 // (esbuild would duplicate module state and miss CMS hydration).
 try{
  const fromCms=typeof window!=='undefined'?window.__MARVLORE_SERVICE_ITEMS__:null;
  if(Array.isArray(fromCms)&&fromCms.length)return fromCms;
 }catch{}
 return staticServiceItems;
}

function ServiceDirectory({canAutoplay=false,items=staticServiceItems}){
 const [hovered,setHovered]=useState(null),[focused,setFocused]=useState(null);
 const [autoIndex,setAutoIndex]=useState(null),[pageVisible,setPageVisible]=useState(()=>!document.hidden);
 const [leaving,setLeaving]=useState([]),previousActive=useRef(null);
 const previewImages=useRef([]);
 useEffect(()=>{
  const update=()=>setPageVisible(!document.hidden);
  document.addEventListener('visibilitychange',update);
  return ()=>document.removeEventListener('visibilitychange',update);
 },[]);
 useEffect(()=>{
  if(!canAutoplay){setAutoIndex(null);return;}
  if(!pageVisible||hovered!==null||focused!==null)return;
  let cancelled=false;
  const timer=setTimeout(async()=>{
   const next=autoIndex===null?0:(autoIndex+1)%items.length;
   // Decode the incoming cover before cross-fading; manual input cancels the handoff.
   await previewImages.current[next]?.decode().catch(()=>{});
   if(!cancelled)setAutoIndex(next);
  },autoIndex===null?280:2600);
  return ()=>{cancelled=true;clearTimeout(timer);};
 },[canAutoplay,pageVisible,hovered,focused,autoIndex,items.length]);
 const active=hovered??focused??(canAutoplay&&pageVisible?autoIndex:null);
 useLayoutEffect(()=>{
  const previous=previousActive.current;previousActive.current=active;
  setLeaving(indices=>{
   const next=indices.filter(index=>index!==active);
   if(previous!==null&&previous!==active&&!next.includes(previous))next.push(previous);
   return next.length===indices.length&&next.every((index,i)=>index===indices[i])?indices:next;
  });
 },[active]);
 const previewMode=hovered!==null?'pointer':focused!==null?'focus':canAutoplay&&pageVisible?'auto':'idle';
 return <div className="services-directory-inner" data-preview-mode={previewMode}>
  <header className="services-directory-heading" data-service-enter="0">
   <h2>What We Do</h2><p lang="zh-CN">我们的服务</p>
  </header>
  <ul className="services-list" onPointerLeave={()=>setHovered(null)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(null);}}>
   {items.map((item,index)=><li key={item.id} data-service-enter={index+1}>
    <button type="button" className={`service-item${active===index?' is-active':''}${leaving.includes(index)?' is-leaving':''}`} onPointerEnter={()=>{setHovered(index);setAutoIndex(index);}} onFocus={()=>{setFocused(index);setAutoIndex(index);}} aria-label={`${item.en} · ${item.cn}`} aria-describedby={`service-description-${item.id}`} style={{'--service-type-scale':item.typeScale??1}}>
     <span className="service-preview" aria-hidden="true" onTransitionEnd={event=>{
      if(event.target===event.currentTarget&&active!==index&&(event.propertyName==='opacity'||event.propertyName==='transform')){
       setLeaving(indices=>indices.includes(index)?indices.filter(item=>item!==index):indices);
      }
     }}>
      <span className="service-preview-image" data-card-shape><img ref={image=>{previewImages.current[index]=image;}} src={item.image} alt="" width="160" height="104" loading={canAutoplay?'eager':'lazy'} decoding="async"/></span>
      <span className="service-preview-copy" lang="zh-CN">{item.description}</span>
     </span>
     <span className="service-emphasis" aria-hidden="true"><i/><span>{item.en}</span></span>
     <span className="service-main" aria-hidden="true"><span>{item.en}</span><small lang="zh-CN">{item.cn}</small></span>
     <span className="service-large" aria-hidden="true"><span>{item.en}</span></span>
    </button>
    <span className="sr-only" id={`service-description-${item.id}`}>{item.description}</span>
   </li>)}
  </ul>
 </div>;
}

export function mountServices(){
 const section=document.querySelector('#services');
 if(!section)return;
 const items=resolveServiceItems();
 const stage=section.querySelector('.services-stage'),title=section.querySelector('#services-title'),directory=section.querySelector('#services-directory');
 const directoryRoot=createRoot(directory);
 let autoplayReady=false;
 const setAutoplayReady=ready=>{
  if(ready===autoplayReady)return;
  autoplayReady=ready;
  directoryRoot.render(<ServiceDirectory canAutoplay={ready} items={items}/>);
 };
 flushSync(()=>{
  createRoot(title).render(<div className="services-title-inner"><h2 className="services-heading services-exit-line"><span className="scroll-reveal-text">What We Can</span></h2><h2 className="services-heading services-exit-line"><span className="scroll-reveal-text">Do For You</span></h2><h2 className="services-subheading services-exit-line"><span className="scroll-reveal-text">我们能为你做什么</span></h2></div>);
  directoryRoot.render(<ServiceDirectory items={items}/>);
 });
 const lines=[...title.querySelectorAll('.services-exit-line')],entries=[...directory.querySelectorAll('[data-service-enter]')];
 let metrics=[],scrollRaf=0;
 function measureTitle(){
  const transform=title.style.transform;title.style.transform='none';
  const stageTop=stage.getBoundingClientRect().top;
  metrics=lines.map(line=>{const rect=line.getBoundingClientRect();return {top:rect.top-stageTop,height:rect.height};});
  title.style.transform=transform;
 }
 function update(){
  const rect=section.getBoundingClientRect(),distance=Math.max(1,section.offsetHeight-innerHeight);
  const progress=clamp(-rect.top/distance),inView=rect.bottom>0&&rect.top<innerHeight;
  if(reduced.matches){
   setAutoplayReady(false);
   section.classList.add('services-reduced');directory.inert=false;title.style.transform='';
   lines.forEach(line=>{line.style.opacity='1';line.style.filter='none';line.firstElementChild.style.transform='none';});
   entries.forEach(entry=>{entry.style.opacity='1';entry.style.filter='none';entry.style.transform='none';});
   return;
  }
  section.classList.remove('services-reduced');
  const motion=servicesTitleFrame(progress,stage.clientHeight,metrics);
  title.style.transform=`translateY(${motion.y}px)`;
  lines.forEach((line,index)=>{
   line.style.opacity=String(motion.lines[index].opacity);line.style.filter=`blur(${motion.lines[index].blur.toFixed(2)}px)`;
   line.firstElementChild.style.transform=`translateY(${motion.lines[index].enterY+motion.lines[index].leaveY}px)`;
  });
  let allEntriesReady=true;
  entries.forEach((entry,index)=>{
   const frame=servicesListFrame(progress,index,stage.clientHeight);
   if(frame.opacity<1)allEntriesReady=false;
   entry.style.opacity=String(frame.opacity);entry.style.filter=`blur(${frame.blur.toFixed(2)}px)`;entry.style.transform=`translate3d(0,${frame.y.toFixed(2)}px,0)`;
  });
  directory.inert=!inView||progress<SERVICES_LIST_START+.04;
  directory.classList.toggle('is-visible',!directory.inert);
  setAutoplayReady(allEntriesReady&&rect.top<=0&&rect.bottom>=innerHeight);
  if(directory.inert&&directory.contains(document.activeElement))document.activeElement.blur();
 }
 const schedule=()=>{if(!scrollRaf)scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;update();});};
 measureTitle();update();
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',()=>{measureTitle();schedule();});
 reduced.addEventListener('change',()=>{measureTitle();schedule();});
 document.fonts.ready.then(()=>{measureTitle();schedule();});
}
