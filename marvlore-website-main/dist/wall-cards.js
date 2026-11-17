import {heroImages} from './hero/images.js?v=e3a01fefe9';
import {aboutCards} from './about-cards.js?v=6d5625a465';
import {coverImageScale} from './cover-framing.js?v=4d498fdbae';
// 每张卡片可单独替换，例如：
// 'wall-01': {image: './assets/your-project.webp'}
const blueCover=(image,alt)=>({image:'./assets/'+image,alt,keepOriginal:true});
export const wallOverrides={
 'wall-03':blueCover('work-covers/film-blue-152.webp','蓝色产品动画海报'),
 'wall-08':blueCover('home-projects/lophthy-01.webp','LOPHTY 蓝色品牌视觉提案'),
 'wall-12':blueCover('work-covers/culture-lophty-152.webp','LOPHTY 蓝色品牌空间'),
 'wall-16':blueCover('work-visual/lophthy-graphic-blue.webp','LOPHTY 蓝色视觉图形'),
 'wall-25':blueCover('work-visual/summo.webp','SUMMO 蓝色产品与品牌视觉'),
 'wall-31':blueCover('reference-collage/project-02.webp','安慕希蓝色创意场景'),
 'wall-38':blueCover('work-covers/culture-lophty-152.webp','LOPHTY 蓝色品牌空间'),
 'wall-49':blueCover('home-projects/lophthy-01.webp','LOPHTY 蓝色品牌视觉提案'),
};
// Keep these blue-led artworks in their original palette as colour accents.
// Individual wallOverrides can still set keepOriginal for any specific card.
const originalBlueArtwork=new Set(['lophthy-pop','lophthy-apparel','work-2','about-blue-product','about-brand-system','about-visual-graphic','about-lophthy','about-blueberry']);
const defaultArtwork=[
 ...heroImages.map(card=>({id:card.id,alt:card.alt,image:card.src})),
 ...['work-film.webp','work-visual.webp','work-web.webp','work-culture.webp'].map((src,i)=>({id:'work-'+i,alt:['影视作品','视觉设计','网站设计','迈络文化'][i],image:'./assets/'+src})),
 ...aboutCards.map(card=>({...card,id:'about-'+card.id})),
];
export const wallCards=Array.from({length:60},(_,index)=>{
 const id='wall-'+String(index+1).padStart(2,'0');
 const artwork=defaultArtwork[index%defaultArtwork.length];
 return {...artwork,id,keepOriginal:originalBlueArtwork.has(artwork.id),...wallOverrides[id]};
});
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
function artwork(card){
 if(card.image)return '<img src="'+esc(card.image)+'" alt="" loading="lazy" decoding="async" draggable="false" style="scale:'+coverImageScale(card.image)+'">';
 const p=card.preview,zoom=card.row==='bottom'&&(card.index===0||card.index===4)?1.35:1.055;
 return '<svg viewBox="0 0 350 350" aria-hidden="true"><image href="./assets/'+esc(p.image)+'" width="'+p.width+'" height="'+p.height+'" transform="translate(175 175) scale('+zoom+') rotate('+(-p.rotation)+') translate('+(-p.cx)+' '+(-p.cy)+')"/></svg>';
}
export function renderWallCards(){
 return Array.from({length:20},(_,col)=>'<div class="portal-column" data-wall-column="'+col+'">'+Array.from({length:3},(_,row)=>{
  const card=wallCards[col*3+row];
  return '<figure class="portal-card" data-wall-card="'+esc(card.id)+'" data-wall-color="'+(card.keepOriginal?'original':'masked')+'" style="--wall-row:'+row+'">'+artwork(card)+'</figure>';
 }).join('')+'</div>').join('');
}
