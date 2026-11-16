import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {motion,useReducedMotion} from 'motion/react';
import {referenceCards,referenceEntryDelay} from './reference-data.js';
import {coverImageScale} from '../../dist/cover-framing.js';
import BrandCopy from './BrandCopy.jsx';
import {shouldShowEntry} from './entry-visibility.js';
import './reference.css';
export {mountWorkTextReveal,mountSectionTextReveal} from '../work/text-reveal.js';
const EASE=[.22,1,.36,1];
const SPRING={type:'spring',stiffness:180,damping:18,mass:.9};
const RING_START={opacity:0,x:-8,y:18,scale:.42,rotate:-8,filter:'blur(14px)'};
const RING_END={opacity:1,x:0,y:0,scale:1,rotate:0,filter:'blur(0px)'};
const cardStart=card=>({opacity:.04,x:(50-card.left)*7.8,y:(50-card.top)*7.8+18+card.order*5,scale:.18+card.order*.024,rotate:-96-card.order*18});
const CARD_END={opacity:1,x:0,y:0,scale:1,rotate:0};

function ReferenceCollage(){
 const root=useRef(null),reduced=useReducedMotion();
 const [ready,setReady]=useState(false),[spread,setSpread]=useState(false),[focused,setFocused]=useState(null);
 const [entry,setEntry]=useState({active:false,run:0}),[complete,setComplete]=useState(false);
 const started=(entry.active&&ready)||Boolean(reduced);
 useEffect(()=>{
  let live=true;
  Promise.all(referenceCards.map(card=>{const image=new Image();image.src=card.src;return image.decode().catch(()=>{});})).then(()=>{if(live)setReady(true);});
  return ()=>{live=false;};
 },[]);
 useEffect(()=>{
  let frame=0;
  function update(){
   frame=0;const rect=root.current.getBoundingClientRect();
   document.documentElement.classList.toggle('reference-collage-active',rect.top<innerHeight*.55&&rect.bottom>innerHeight*.45);
   setEntry(previous=>{
    const active=shouldShowEntry(rect,innerHeight,previous.active);
    return active===previous.active?previous:{active,run:previous.run+(active?1:0)};
   });
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
  return ()=>{cancelAnimationFrame(frame);removeEventListener('scroll',schedule);removeEventListener('resize',schedule);document.documentElement.classList.remove('reference-collage-active');};
 },[]);
 useEffect(()=>{setComplete(false);setSpread(false);setFocused(null);},[entry.run,entry.active]);
 return <div ref={root} className="reference-section" data-entry-run={entry.run} data-entry-state={reduced?'static':!started?'waiting':complete?'complete':'entering'}>
  <div className="reference-viewport">
   <div className="reference-square" onPointerEnter={()=>setSpread(true)} onPointerLeave={()=>{setSpread(false);setFocused(null);}}>
    <motion.div key={`entry-${entry.run}`} className="reference-ring" initial={reduced?false:RING_START}
     animate={started?RING_END:RING_START} onAnimationComplete={()=>{if(started)setComplete(true);}}
     transition={reduced?{duration:0}:{opacity:{duration:.65,delay:started?referenceEntryDelay:0,ease:'easeOut'},x:{duration:1.1,delay:started?referenceEntryDelay:0,ease:[.16,1,.3,1]},y:{duration:1.1,delay:started?referenceEntryDelay:0,ease:[.16,1,.3,1]},scale:{duration:5.8,delay:started?referenceEntryDelay:0,ease:[.16,1,.3,1]},rotate:{duration:4.4,delay:started?referenceEntryDelay:0,ease:[.16,1,.3,1]},filter:{duration:1.2,delay:started?referenceEntryDelay:0,ease:'easeOut'}}}>
     {referenceCards.map((card,index)=>{
      const active=complete&&focused===index,delay=started?referenceEntryDelay+.08+card.order*.11:0;
      const tiltX=card.top<50?11:-11,tiltY=card.left<50?-14:14;
      const scattered=spread&&complete&&!reduced;
      return <motion.div className="reference-card-anchor" key={card.id} data-reference-card={card.id}
       style={{left:`${card.left}%`,top:`${card.top}%`,width:`${card.size}%`,transformOrigin:`${(50-card.left)/card.size*100}% ${(50-card.top)/card.size*100}%`,zIndex:active?40:20+referenceCards.length-card.order}}
       initial={reduced?false:cardStart(card)} animate={started?CARD_END:cardStart(card)}
       transition={reduced?{duration:0}:{opacity:{duration:.78,delay,ease:EASE},x:{duration:1.95,delay,ease:EASE},y:{duration:1.95,delay,ease:EASE},scale:{duration:4.35,delay,ease:EASE},rotate:{duration:2.2,delay,ease:EASE}}}>
       <motion.div className="reference-card-shell" initial={reduced?false:{rotate:0}}
        onPointerEnter={()=>setFocused(index)} onPointerLeave={()=>setFocused(value=>value===index?null:value)}
        animate={{x:scattered?card.scatter.x:0,y:scattered?card.scatter.y:0,rotate:started?card.angle+(scattered?card.scatter.rotate:0):0,
         scale:scattered?(active?1.12:1.03):(active?1.08:1),rotateX:active&&!reduced?tiltX*(scattered?1:.7):0,rotateY:active&&!reduced?tiltY*(scattered?1:.7):0}}
        transition={reduced?{duration:0}:{rotate:scattered?SPRING:{duration:started?.65:.45,delay:started&&!complete?referenceEntryDelay:0,ease:EASE},x:{...SPRING,delay:scattered?index*.02:0},y:{...SPRING,delay:scattered?index*.02:0},scale:{...SPRING,delay:scattered?index*.02:0},rotateX:{type:'spring',stiffness:210,damping:20,mass:.85},rotateY:{type:'spring',stiffness:210,damping:20,mass:.85}}}
        style={{transformPerspective:1200,transformStyle:'preserve-3d'}}>
        <img src={card.src} alt={card.alt} width="1440" height="810" style={{objectPosition:card.focus,scale:coverImageScale(card.src)}} decoding="async" draggable={false}/>
       </motion.div>
      </motion.div>;
     })}
    </motion.div>
    <BrandCopy started={started}/>
   </div>
  </div>
  <div className="reference-tail" aria-hidden="true"/>
 </div>;
}

export function mountReferenceCollage(){const host=document.querySelector('#reference-collage');if(host)createRoot(host).render(<ReferenceCollage/>);}
