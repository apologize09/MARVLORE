// 来自原品牌 VI 的独立图片，width/height 保留原始长宽比。
export const heroImages = [
  {
    "src": "./assets/orbit/vapx-surface.webp",
    "alt": "VapX 品牌视觉",
    "width": 4001,
    "height": 2251
  },
  {
    "src": "./assets/orbit/vapx-screen.webp",
    "alt": "VapX 数字展示",
    "width": 4001,
    "height": 2250
  },
  {
    "src": "./assets/orbit/vapes-bars.webp",
    "alt": "Vapes Bars 品牌视觉",
    "width": 4002,
    "height": 2251
  },
  {
    "src": "./assets/orbit/vapx-direction.webp",
    "alt": "VapX 视觉叙事",
    "width": 4002,
    "height": 2251
  },
  {
    "src": "./assets/orbit/vapes-space.webp",
    "alt": "Vapes Bars 空间视觉",
    "width": 4001,
    "height": 2250
  },
  {
    "src": "./assets/orbit/lophthy-apparel.webp",
    "alt": "LOPHTY 品牌应用",
    "width": 4001,
    "height": 2250
  },
  {
    "src": "./assets/orbit/lophthy-pop.webp",
    "alt": "LOPHTY 品牌主视觉",
    "width": 4001,
    "height": 2251
  },
  {
    "src": "./assets/orbit/vapes-dog.webp",
    "alt": "Vapes Bars 品牌周边",
    "width": 4002,
    "height": 2250
  }
].map(item=>({...item,id:item.src.split('/').pop().replace(/\.webp$/,'')}));

// Home-only media; other sections keep their own original artwork.
export const heroProjects=[
 {slug:'swft-icon',title:'SWFT ICON'},
 {slug:'pop-palm',title:'POP Palm'},
 {slug:'puff',title:'PUFF'},
 {slug:'flum-mi',title:'FLUM MI'},
 {slug:'flum-pebble-x',title:'Flum Pebble X'},
].map(item=>({
 id:'hero-video-'+item.slug,title:item.title,alt:item.title+' 品牌影片',
 src:'./assets/hero-video/'+item.slug+'-poster.webp',
 // Tiers: home-360p (card loop) → preview (teaser) → mp4 720p (default detail) → 1080p (HD)
 videoSrc:'./assets/hero-video/'+item.slug+'.mp4',
 videoSrcHd:'./assets/hero-video/'+item.slug+'-1080p.mp4',
 previewSrc:'./assets/hero-video/'+item.slug+'-preview.mp4',
 homePreviewSrc:'./assets/hero-video/'+item.slug+'-home-360p.mp4',
 width:1280,height:720,
})).concat([
 {id:'hero-image-lophthy',slug:'lophthy',title:'LOPHTY 品牌视觉'},
 {id:'hero-image-vapes-bars',slug:'vapes-bars',title:'Vapes Bars 品牌视觉'},
 {id:'hero-image-vapx',slug:'vapx',title:'VapX 品牌视觉'},
].map(item=>({...item,alt:item.title,src:'./assets/home-projects/'+item.slug+'-cover.webp',
 slides:Array.from({length:5},(_,index)=>'./assets/home-projects/'+item.slug+'-'+String(index+1).padStart(2,'0')+'.webp'),
 width:2400,height:1350})));
