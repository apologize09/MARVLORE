// Project image sequences stay independent of the project rail and video player.
export function createGallerySlideshow(dialog,stack,redraw,reducedMotion){
 const controls=document.createElement('span');controls.className='gallery-slideshow-controls';controls.hidden=true;
 const count=document.createElement('span'),toggle=document.createElement('button'),next=document.createElement('button');
 count.className='gallery-slide-count';count.setAttribute('aria-live','off');
 toggle.type=next.type='button';toggle.className=next.className='gallery-media-button';
 next.textContent='下一张 →';next.setAttribute('aria-label','下一张项目图片');controls.append(count,toggle,next);
 dialog.querySelector('.gallery-nav').insertBefore(controls,dialog.querySelector('.gallery-close'));
 let current=null,index=0,timer=0,animation=null,revision=0,paused=false,busy=false;
 const update=()=>{
  count.textContent=`${String(index+1).padStart(2,'0')} / ${String(current?.slides.length||0).padStart(2,'0')}`;
  toggle.textContent=paused?'播放轮播':'暂停轮播';toggle.setAttribute('aria-pressed',String(paused));
  dialog.dataset.slideIndex=String(index);
 };
 const stop=()=>{clearTimeout(timer);revision++;animation?.cancel();animation=null;stack.style.opacity='1';busy=false;};
 const schedule=()=>{clearTimeout(timer);if(current&&!paused&&!document.hidden&&dialog.open)timer=setTimeout(advance,4500);};
 const decode=src=>{const image=new Image();image.src=src;return image.decode();};
 async function fade(from,to,duration){
  if(reducedMotion.matches){stack.style.opacity=String(to);return;}
  animation=stack.animate([{opacity:from},{opacity:to}],{duration,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  await animation.finished;
  stack.style.opacity=String(to);animation.cancel();animation=null;
 }
 async function advance(){
  if(!current||busy||document.hidden)return;
  clearTimeout(timer);busy=true;const ticket=revision,nextIndex=(index+1)%current.slides.length;
  try{
   // Decode before fading so loading never leaves a blank frame on screen.
   await decode(current.slides[nextIndex]);if(ticket!==revision)return;
   await fade(1,0,550);if(ticket!==revision)return;
   index=nextIndex;redraw();update();
   await fade(0,1,750);if(ticket!==revision)return;
  }catch{if(ticket!==revision)return;stack.style.opacity='1';}
  busy=false;schedule();
 }
 function clear(){stop();current=null;index=0;controls.hidden=true;delete dialog.dataset.slideshow;delete dialog.dataset.slideIndex;}
 function select(item){
  if(current?.id===item?.id)return;
  clear();if(item?.videoSrc||item?.slides?.length<2||!item?.slides)return;
  current=item;paused=reducedMotion.matches;controls.hidden=false;dialog.dataset.slideshow='true';update();schedule();
 }
 toggle.addEventListener('click',()=>{paused=!paused;stop();update();schedule();});
 next.addEventListener('click',advance);
 document.addEventListener('visibilitychange',()=>{stop();if(!document.hidden)schedule();});
 reducedMotion.addEventListener('change',()=>{if(current){paused=reducedMotion.matches;stop();update();schedule();}});
 return {select,clear,pause:stop,resume:schedule,src:item=>current?.id===item.id?current.slides[index]:(item.slides?.[0]||item.src)};
}
