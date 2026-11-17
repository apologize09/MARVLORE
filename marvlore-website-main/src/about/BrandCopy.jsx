import {useEffect,useMemo,useRef,useState} from 'react';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import ScrollReveal from './ScrollReveal.jsx';
import {resolveAboutCopy} from './reference-data.js';
import {copyRevealRange} from './copy-reveal-range.js';

export default function BrandCopy({started}){
 const aboutCopy=useMemo(()=>resolveAboutCopy(),[]);
 const copy=useRef(null);
 const [riseDistance,setRiseDistance]=useState(()=>Math.max(120,Math.min(240,innerHeight*.22)));
 const count=3+aboutCopy.stats.reduce((total,stat)=>total+1+stat.lines.length,0);
 const schedule=useMemo(()=>Array.from({length:count},(_,index)=>{
  const range=()=>copyRevealRange(index,count,copy.current.getBoundingClientRect().top+scrollY,innerHeight,copy.current.offsetHeight);
  return {start:()=>range().start,end:()=>range().end};
 }),[count]);
 useEffect(()=>{
  let live=true;document.fonts?.ready.then(()=>{if(live)ScrollTrigger.refresh();});
  const resize=()=>setRiseDistance(Math.max(120,Math.min(240,innerHeight*.22)));
  addEventListener('resize',resize);
  return ()=>{live=false;removeEventListener('resize',resize);};
 },[]);
 function line(index,tag,children,props={}){
  return <ScrollReveal as={tag} {...props} data-copy-line={index}
   revealTriggerRef={copy} wordAnimationStart={schedule[index].start} wordAnimationEnd={schedule[index].end}
   highlightColor={null} mode="scrub" splitBy="lines" effect="fade" stagger={.05} duration={.8} smoothing={.45}
   baseOpacity={0} baseRotation={0} baseOffset={riseDistance} enableBlur blurStrength={4}>{children}</ScrollReveal>;
 }
 return <div ref={copy} className="reference-copy" style={{opacity:started?1:0}}>
  <div className="reference-intro">
   {line(0,'h2',<>{aboutCopy.name}<span className="reference-chinese-name">{aboutCopy.chineseName}</span></>,{id:'about-title'})}
   <p className="reference-partner">{line(1,'span',aboutCopy.partner)}{line(2,'span',aboutCopy.partnerChinese)}</p>
  </div>
  {aboutCopy.stats.map((stat,index)=>{
   const first=3+aboutCopy.stats.slice(0,index).reduce((total,item)=>total+1+item.lines.length,0);
   return <div key={stat.number} className="reference-stat">
    {line(first,'strong',<>{stat.number}<span className="reference-plus">+</span></>)}
    <p>{stat.lines.map((text,i)=><span key={i}>{line(first+i+1,'span',text)}</span>)}</p>
   </div>;
  })}
 </div>;
}
