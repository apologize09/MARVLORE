// Full films load only after a project is opened, independently of its teaser.
// Default stream is 720p (videoSrc); optional HD uses videoSrcHd.
export function createGalleryVideo(dialog){
 const art=dialog.querySelector('.gallery-art');
 const video=document.createElement('video');
 video.className='gallery-video';video.playsInline=true;video.loop=true;
 video.preload='none';video.hidden=true;
 const play=document.createElement('button');
 play.type='button';play.className='gallery-video-play';play.textContent='播放影片 ▶';play.hidden=true;
 art.insertBefore(video,art.querySelector('.gallery-shade'));art.append(play);
 const controls=document.createElement('span');controls.className='gallery-video-controls';controls.hidden=true;
 const playback=document.createElement('button'),audio=document.createElement('button'),quality=document.createElement('button');
 playback.type=audio.type=quality.type='button';
 playback.className=audio.className=quality.className='gallery-media-button';
 controls.append(playback,audio,quality);
 dialog.querySelector('.gallery-nav').insertBefore(controls,dialog.querySelector('.gallery-close'));
 let current=null,request=0,resumeOnVisible=false,hd=false,itemRef=null;
 function activeSrc(){
  if(!itemRef)return '';
  return hd&&itemRef.videoSrcHd?itemRef.videoSrcHd:itemRef.videoSrc;
 }
 function updateControls(){
  playback.textContent=video.paused?'播放':'暂停';playback.setAttribute('aria-label',video.paused?'播放影片':'暂停影片');
  audio.textContent=video.muted?'声音关':'声音开';audio.setAttribute('aria-label',video.muted?'开启影片声音':'静音影片');
  audio.setAttribute('aria-pressed',String(video.muted));
  const hasHd=Boolean(itemRef?.videoSrcHd);
  quality.hidden=!hasHd;
  quality.textContent=hd?'高清 1080':'标清 720';
  quality.setAttribute('aria-label',hd?'切换到标清 720p':'切换到高清 1080p');
  quality.setAttribute('aria-pressed',String(hd));
 }
 async function start(){
  if(!current||!dialog.open)return;
  const ticket=++request;play.hidden=true;
  try{await video.play();}
  catch{
   if(ticket!==request||!current)return;
   video.muted=true;
   try{await video.play();}catch{if(ticket===request)play.hidden=false;}
  }
 }
 function pause(){request++;resumeOnVisible=false;video.pause();play.hidden=true;}
 function applySource(){
  const src=activeSrc();
  if(!src)return;
  const time=video.currentTime||0;
  const wasPlaying=!video.paused;
  video.preload='none';
  video.src=src;
  const resume=()=>{
   if(time>0.2){try{video.currentTime=time;}catch{}}
   if(wasPlaying)start();
   video.removeEventListener('loadedmetadata',resume);
  };
  video.addEventListener('loadedmetadata',resume);
  video.preload='metadata';
  updateControls();
 }
 function clear(){
  pause();current=null;itemRef=null;hd=false;video.hidden=true;video.removeAttribute('src');video.load();
  controls.hidden=true;delete dialog.dataset.video;
 }
 function select(item){
  if(!item?.videoSrc){clear();return;}
  if(current===item.id)return;
  pause();current=item.id;itemRef=item;hd=false;video.hidden=false;controls.hidden=false;dialog.dataset.video='true';
  video.setAttribute('aria-label',item.title+' 完整影片');video.poster=item.src;
  video.muted=false;video.preload='none';applySource();start();
 }
 play.addEventListener('click',start);
 playback.addEventListener('click',()=>{if(video.paused)start();else video.pause();});
 audio.addEventListener('click',()=>{video.muted=!video.muted;});
 quality.addEventListener('click',()=>{
  if(!itemRef?.videoSrcHd)return;
  hd=!hd;applySource();
 });
 ['play','pause','volumechange'].forEach(event=>video.addEventListener(event,updateControls));
 video.addEventListener('play',()=>{play.hidden=true;});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){resumeOnVisible=!video.paused;video.pause();}
  else if(resumeOnVisible&&dialog.open){resumeOnVisible=false;start();}
 });
 return {select,start,pause,clear};
}
