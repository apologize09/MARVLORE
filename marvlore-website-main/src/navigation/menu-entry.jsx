import React from 'react';
import {createRoot} from 'react-dom/client';
import {gsap} from 'gsap';
import StaggeredMenu from './StaggeredMenu.jsx';

export const menuItems=[
 {label:'Home',caption:'首页',ariaLabel:'前往首页',link:'#home'},
 {label:'Services',caption:'创意服务',ariaLabel:'查看创意服务',link:'#services'},
 {label:'About',caption:'关于迈络',ariaLabel:'了解迈络',link:'#about'},
 {label:'Work',caption:'精选作品',ariaLabel:'浏览精选作品',link:'#work'},
 {label:'Marvlore Go',caption:'创意作品墙',ariaLabel:'查看迈络创意作品墙',link:'#marvlore-go'},
 {label:'Awards',caption:'荣誉认可',ariaLabel:'查看荣誉认可',link:'#awards'},
 {label:'Contact',caption:'欢迎联络',ariaLabel:'联络迈络',link:'#contact'}
];
const contacts=[{label:'邮箱联系 ↗',link:'mailto:contact@marvlore.com'},{label:'198 3286 6221 ↗',link:'tel:+8619832866221'}];
let scrollTween;
function navigate(link){
 const target=document.getElementById(link.slice(1));if(!target)return;
 if(link==='#work')document.querySelector('[data-work-category="all"]')?.click();
 requestAnimationFrame(()=>{
  scrollTween?.kill();
  history.replaceState(null,'',link);
  const y=Math.max(0,Math.min(window.scrollY+target.getBoundingClientRect().top,document.documentElement.scrollHeight-innerHeight));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){window.scrollTo({top:y,behavior:'instant'});return;}
  const state={y:window.scrollY};
  scrollTween=gsap.to(state,{y,duration:.95,ease:'power3.inOut',onUpdate:()=>window.scrollTo({top:state.y,behavior:'instant'})});
 });
}
export function mountSiteNavigation(){
 if(document.querySelector('#site-navigation'))return;
 const host=document.createElement('div');host.id='site-navigation';document.body.append(host);
 const stop=()=>scrollTween?.kill();window.addEventListener('wheel',stop,{passive:true});window.addEventListener('pointerdown',stop,{passive:true});
 window.addEventListener('keydown',event=>{if(['PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' '].includes(event.key))stop();});
 createRoot(host).render(<StaggeredMenu isFixed position="right" className="marvlore-menu" items={menuItems} socialItems={contacts} displaySocials displayItemNumbering menuButtonColor="#f4f4ef" openMenuButtonColor="#c4ff48" changeMenuColorOnOpen colors={['#587aff','#c4ff48']} accentColor="#c4ff48" onNavigate={navigate} />);
}
