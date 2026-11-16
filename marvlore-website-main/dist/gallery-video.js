// Full films load only after a project is opened, independently of its teaser.
export function createGalleryVideo(dialog){
 const art=dialog.querySelector('.gallery-art');
 const video=document.createElement('video');
 video.className='gallery-video';video.playsInline=true;video.loop=true;
 video.preload='none';video.hidden=true;
 const play=document.createElement('button');
 play.type='button';play.className='gallery-video-play';play.textContent='播放影片 ▶';play.hidden=true;
 art.insertBefore(video,art.querySelector('.gallery-shade'));art.append(play);
 const controls=document.createElement('span');controls.className='gallery-video-controls';controls.hidden=true;
 const playback=document.createElement('button'),audio=document.createElement('button');
 playback.type=audio.type='button';playback.className=audio.className='gallery-media-button';
 controls.append(playback,audio);
 dialog.querySelector('.gallery-nav').insertBefore(controls,dialog.querySelector('.gallery-close'));
 function updateControls(){
  playback.textContent=video.paused?'播放':'暂停';playback.setAttribute('aria-label',video.paused?'播放影片':'暂停影片');
  audio.textContent=video.muted?'声音关':'声音开';audio.setAttribute('aria-label',video.muted?'开启影片声音':'静音影片');
  audio.setAttribute('aria-pressed',String(video.muted));
 }
 let current=null,request=0,resumeOnVisible=false;
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
 function clear(){
  pause();current=null;video.hidden=true;video.removeAttribute('src');video.load();
  controls.hidden=true;delete dialog.dataset.video;
 }
 function select(item){
  if(!item?.videoSrc){clear();return;}
  if(current===item.id)return;
  pause();current=item.id;video.hidden=false;controls.hidden=false;dialog.dataset.video='true';
  video.setAttribute('aria-label',item.title+' 完整影片');video.poster=item.src;
  video.muted=false;video.src=item.videoSrc;video.preload='metadata';updateControls();start();
 }
 play.addEventListener('click',start);
 playback.addEventListener('click',()=>{if(video.paused)start();else video.pause();});
 audio.addEventListener('click',()=>{video.muted=!video.muted;});
 ['play','pause','volumechange'].forEach(event=>video.addEventListener(event,updateControls));
 video.addEventListener('play',()=>{play.hidden=true;});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){resumeOnVisible=!video.paused;video.pause();}
  else if(resumeOnVisible&&dialog.open){resumeOnVisible=false;start();}
 });
 return {select,start,pause,clear};
}
