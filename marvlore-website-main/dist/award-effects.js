// Sheen treatment inspired by React Bits Glare Hover:
// https://github.com/DavidHDev/react-bits/tree/main/src/content/Animations/GlareHover
// Masked to the inner medal only. Outer geometry remains under card-shape.js.
const SHEEN={duration:1650,idleDelay:6800};
// Centre-out stagger, adapted from Motion's public stagger-origin pattern:
// https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/utils/stagger.ts
const ENTRY={duration:900,stagger:85,lift:66};
// Useful source bounds exclude black export padding; retain native proportions.
const ARTWORK=[{width:470,cropWidth:470},{width:475,cropWidth:471},{width:480,cropWidth:468}];
const SOURCE_HEIGHT=760,CROP_TOP=1,CROP_HEIGHT=747;
export function mountAwardEffects(){
 const root=document.querySelector('#awards'),carousel=root?.querySelector('.awards-carousel');
 if(!carousel)return;
 const viewport=carousel.querySelector('.awards-viewport');
 const figures=[...carousel.querySelectorAll('.awards-track figure')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const running=new Map();let visible=false,timer=0;
 const entrance=new Set();let entered=false,entering=false,entryReady=false;
 carousel.classList.remove('reveal');carousel.classList.add('award-enter-ready');
 carousel.dataset.entryState='ready';
 const surfaces=new Map();
 function fit(figure){
  const art=ARTWORK[Number(figure.dataset.award)];if(!art)return;
  const width=figure.offsetWidth,height=figure.offsetHeight;
  const scale=Math.max((width+1)/art.cropWidth,(height+1)/CROP_HEIGHT);
  const surface=surfaces.get(figure);
  surface.style.width=art.width*scale+'px';surface.style.height=SOURCE_HEIGHT*scale+'px';
  surface.style.left=(width-art.cropWidth*scale)/2+'px';
  surface.style.top=((height-CROP_HEIGHT*scale)/2-CROP_TOP*scale)+'px';
 }
 figures.forEach(figure=>{
  const surface=document.createElement('span');surface.className='award-artwork';
  figure.querySelector('img').loading='eager';
  surface.append(figure.querySelector('img'));figure.append(surface);surfaces.set(figure,surface);
  const overlay=document.createElement('span');overlay.className='award-sheen';overlay.setAttribute('aria-hidden','true');
  const band=document.createElement('span');band.className='award-sheen-band';overlay.append(band);surface.append(overlay);
  figure.addEventListener('pointerenter',()=>sweep(figure));fit(figure);
 });
 const sizeObserver=new ResizeObserver(entries=>entries.forEach(entry=>fit(entry.target)));
 figures.forEach(figure=>sizeObserver.observe(figure));
 function sweep(figure){
  if(!figure||!visible||entering||document.hidden||reduced.matches||viewport.classList.contains('dragging'))return;
  running.get(figure)?.cancel();
  const animation=figure.querySelector('.award-sheen-band').animate([
   {transform:'translateX(-160%) skewX(-22deg)',opacity:0,offset:0},
   {opacity:1,offset:.16},{opacity:1,offset:.72},
   {transform:'translateX(420%) skewX(-22deg)',opacity:0,offset:1}
  ],{duration:SHEEN.duration,easing:'cubic-bezier(.25,.46,.45,.94)'});
  running.set(figure,animation);animation.onfinish=()=>{if(running.get(figure)===animation)running.delete(figure);};
 }
 function schedule(){
  clearTimeout(timer);
  if(!visible||entering||document.hidden||reduced.matches)return;
  timer=setTimeout(()=>{sweep(carousel.querySelector('figure.is-current'));schedule();},SHEEN.idleDelay);
 }
 function selected(){sweep(carousel.querySelector('figure.is-current'));schedule();}
 function finishEntrance(){
  entrance.forEach(animation=>animation.cancel());entrance.clear();
  entered=true;entering=false;carousel.classList.add('award-entered');
  carousel.dataset.entryState='complete';selected();
 }
 function enter(){
  if(entered||!entryReady||document.hidden)return;
  if(reduced.matches){finishEntrance();return;}
  entered=true;entering=true;carousel.classList.add('award-entered');
  carousel.dataset.entryState='running';
  const bounds=viewport.getBoundingClientRect();
  const middle=bounds.left+bounds.width/2;
  const width=figures[0].offsetWidth||1;
  const animations=figures.map(figure=>{
   const rect=figure.getBoundingClientRect(),dx=rect.left+rect.width/2-middle;
   const distance=Math.abs(dx)/width,side=Math.sign(dx);
   const opacity=getComputedStyle(figure).opacity;
   return figure.animate([
    {translate:(-side*24)+'px '+ENTRY.lift+'px',scale:'.94',rotate:(-side*2)+'deg',opacity:0},
    {translate:'0px 0px',scale:'1',rotate:'0deg',opacity}
   ],{duration:ENTRY.duration,delay:Math.min(3,distance)*ENTRY.stagger,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
  });
  carousel.querySelectorAll('.carousel-button,.award-pagination,.award-gesture-hint').forEach(control=>{
   animations.push(control.animate([{opacity:0,translate:'0px 10px'},{opacity:1,translate:'0px 0px'}],
    {duration:420,delay:420,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
  });
  animations.forEach(animation=>entrance.add(animation));
  Promise.all(animations.map(animation=>animation.finished.catch(()=>{}))).then(()=>{if(entering)finishEntrance();});
 }
 const fontsReady=document.fonts?.ready
  ?Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,900))])
  :Promise.resolve();
 Promise.all([fontsReady,...figures.map(figure=>figure.querySelector('img')?.decode?.().catch(()=>{})||Promise.resolve())])
  .then(()=>{entryReady=true;if(visible)enter();});
 // Failsafe: never leave award-enter-ready (opacity:0) stuck if IO/fonts race.
 setTimeout(()=>{if(!entered)finishEntrance();},2800);
 const observer=new IntersectionObserver(([entry])=>{
  visible=entry.isIntersecting&&entry.intersectionRatio>=.22;if(visible){if(!entered)enter();else selected();}
  else{if(entering)finishEntrance();clearTimeout(timer);running.forEach(a=>a.cancel());running.clear();}
 },{threshold:[0,.22,.3]});observer.observe(viewport);
 // Interaction can interrupt the reveal without overriding the carousel spring.
 carousel.addEventListener('pointerdown',()=>{if(!entered||entering)finishEntrance();},{capture:true});
 carousel.addEventListener('keydown',()=>{if(!entered||entering)finishEntrance();},{capture:true});
 carousel.addEventListener('marvlore:award-settle',selected);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(entering)finishEntrance();clearTimeout(timer);running.forEach(a=>a.cancel());running.clear();}else if(visible&&!entered)enter();else schedule();});
 reduced.addEventListener('change',()=>{if(reduced.matches&&entering)finishEntrance();running.forEach(a=>a.cancel());running.clear();schedule();});
 return {destroy(){observer.disconnect();sizeObserver.disconnect();clearTimeout(timer);running.forEach(a=>a.cancel());entrance.forEach(a=>a.cancel());}};
}
