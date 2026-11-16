import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import './text-reveal.css';

gsap.registerPlugin(ScrollTrigger,SplitText);

// 与介绍区使用同样的淡入/去模糊语言，按实际排版行的位置推进。
// 每一行进入视口 84% 时开始，抵达 62% 时清晰，让去模糊过程有更多停留。
export function mountSectionTextReveal({rootSelector='#work',textSelector='.work-heading [data-work-reveal]'}={}){
 const root=document.querySelector(rootSelector);
 if(!root)return {refresh(){}};
 const splits=[];
 const widths=new WeakMap();
 const media=gsap.matchMedia();
 let live=true;
 function refresh(){
  splits.forEach(split=>{
   const element=split.elements[0],width=element.clientWidth;
   if(element.getClientRects().length&&Math.abs(width-(widths.get(element)??-1))>.5)split.split();
  });
  ScrollTrigger.refresh();
 }
 document.fonts.ready.then(()=>{
  if(!live)return;
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   // Cards already have a whole-card entrance. Keep their text readable after filtering.
   root.querySelectorAll(textSelector).forEach(element=>{
    let tweens=[];
    const split=SplitText.create(element,{
     type:'lines',linesClass:'work-reveal-line',autoSplit:true,
     onRevert(){tweens.forEach(tween=>{tween.scrollTrigger?.kill();tween.revert();});tweens=[];},
     onSplit(self){
      widths.set(element,element.clientWidth);
      tweens=self.lines.map(line=>gsap.fromTo(line,{opacity:.1,filter:'blur(4px)'},{
       opacity:1,filter:'blur(0px)',ease:'none',
       scrollTrigger:{trigger:line,start:'top 84%',end:'top 62%',scrub:true,invalidateOnRefresh:true}
      }));
     }
    });
    splits.push(split);
   });
   ScrollTrigger.refresh();
   return ()=>{splits.splice(0).forEach(split=>split.revert());};
  });
 });
 return {refresh,destroy(){live=false;media.revert();}};
}

export const mountWorkTextReveal=()=>mountSectionTextReveal();
