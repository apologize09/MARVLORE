import {contactEntryFrame} from './contact-motion.js';

export function mountContactInteractions(root=document.querySelector('#contact')){
 if(!root)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const controller=new AbortController(),options={signal:controller.signal};
 const entries=[...root.querySelectorAll('[data-contact-enter]')].map(element=>({element,targets:[...element.querySelectorAll('[data-contact-motion]')]}));
 const button=root.querySelector('[data-copy-email]');
 const label=button?.querySelector('[data-copy-label]'),hint=button?.querySelector('[data-copy-hint]');
 const status=root.querySelector('[data-copy-status]');
 let copyTimer=0,scrollRaf=0,busy=false,live=true;
 function update(){
  scrollRaf=0;
  const sectionTop=root.getBoundingClientRect().top;
  entries.forEach(({element,targets})=>{
   const staticFrame=reduced.matches||element.contains(document.activeElement);
   const frame=staticFrame?{opacity:1,blur:0,y:0}:contactEntryFrame(sectionTop,element.getBoundingClientRect().top-sectionTop,innerHeight);
   targets.forEach(target=>{
    target.style.opacity=String(frame.opacity);
    target.style.filter=frame.blur?`blur(${frame.blur.toFixed(2)}px)`:'none';
    target.style.transform=`translate3d(0,${frame.y.toFixed(2)}px,0)`;
    target.style.pointerEvents=frame.opacity<.02?'none':'';
   });
  });
 }
 const schedule=()=>{if(!scrollRaf)scrollRaf=requestAnimationFrame(update);};
 window.addEventListener('scroll',schedule,{...options,passive:true});
 window.addEventListener('resize',schedule,options);
 root.addEventListener('focusin',schedule,options);root.addEventListener('focusout',schedule,options);
 document.fonts.ready.then(()=>{if(live)schedule();});
 update();
 function resetCopy(){
  if(!button)return;
  button.classList.remove('is-copied');button.setAttribute('aria-label','复制邮箱以联系迈络');
  label.textContent='Copy Email';hint.textContent='复制邮箱';status.textContent='';
 }
 button?.addEventListener('click',async()=>{
  if(busy)return;
  busy=true;button.setAttribute('aria-busy','true');clearTimeout(copyTimer);
  try{
   await navigator.clipboard.writeText('contact@marvlore.com');
   if(!live)return;
   button.classList.add('is-copied');button.setAttribute('aria-label','邮箱已复制：contact@marvlore.com');
   label.textContent='Copied';hint.textContent='邮箱已复制';status.textContent='邮箱已复制：contact@marvlore.com';
  }catch{
   if(!live)return;
   label.textContent='Copy Email';hint.textContent='请手动复制';status.textContent='请手动复制邮箱：contact@marvlore.com';
  }finally{
   busy=false;button.removeAttribute('aria-busy');
  }
  if(live)copyTimer=setTimeout(resetCopy,3500);
 },options);
 reduced.addEventListener('change',schedule,options);
 return {destroy(){live=false;controller.abort();cancelAnimationFrame(scrollRaf);clearTimeout(copyTimer);resetCopy();}};
}
