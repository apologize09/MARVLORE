import {serviceTagAssets,serviceTagCanvas} from './service-tag-assets.js';
// Each item is an independent original crop. Override box:{x,y,width,height}
// in source pixels to change its placement, or edit text/color/fontScale.
export const serviceTagRows=[
 [
  {id:'smile',type:'icon',asset:'./assets/service-tags/stickers/smile.png'},
  {id:'hourglass',type:'icon'},
  {id:'film',text:'Film&Animation',category:'film',color:'#ffffff'},
  {id:'film-cn',text:'影视动画',category:'film'},
  {id:'arrow',type:'icon'},
  {id:'animation',text:'3D Animation',category:'film',color:'#ffffff'},
  {id:'star-square',type:'icon',asset:'./assets/service-tags/stickers/star.png'},
 ],
 [
  {id:'badge',type:'icon'},
  {id:'web',text:'Web Development',category:'web',color:'#ffffff'},
  {id:'web-cn',text:'网站设计',category:'web'},
  {id:'steps',type:'icon'},
  {id:'soft-cross',type:'icon'},
  {id:'video',text:'视频 & 广告',category:'film'},
 ],
 [
  {id:'bowtie',type:'icon'},
  {id:'visual',text:'Visual Design',category:'visual'},
  {id:'visual-cn',text:'视觉设计',category:'visual'},
  {id:'star-hex',type:'icon'},
  {id:'marvlore',text:'Marvlore',category:'culture'},
  {id:'culture',text:'迈络文化',category:'culture',color:'#ffffff',fontScale:.94},
  {id:'clover',type:'icon',asset:'./assets/service-tags/stickers/ring.png'},
  {id:'cgi',text:'CGI',category:'film'},
 ],
];

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderServiceTags(rows=serviceTagRows){
 return rows.map(row=>`<div class="tag-row">${row.map(item=>{
  const original=serviceTagAssets[item.id],box={...original,...item.box};
  const style=`--tag-x:${box.x/serviceTagCanvas.width*100}%;--tag-y:${box.y/serviceTagCanvas.height*100}%;--tag-w:${box.width/serviceTagCanvas.width*100}%;--tag-h:${box.height/serviceTagCanvas.height*100}%`;
  if(item.type==='icon')return `<span class="service-sticker" data-tag-id="${escape(item.id)}" style="${style}" aria-hidden="true"><img src="${escape(item.asset||original.displayAsset||original.asset)}" alt="" draggable="false"></span>`;
  const cn=/[\u3400-\u9fff]/.test(item.text);
  return `<button type="button" class="tag service-label${cn?' is-cjk':''}${item.fill?' has-custom-fill':''}" data-tag-id="${escape(item.id)}" data-category="${escape(item.category)}" style="${style};--tag-ink:${escape(item.color||'#080808')};--tag-type-scale:${Number(item.fontScale)||(cn?.96:1)};--tag-custom-fill:${escape(item.fill||'transparent')};--tag-custom-border:${escape(item.border||'transparent')}"><img class="service-label-art" src="${escape(item.background||original.background)}" alt="" aria-hidden="true" draggable="false"><span class="service-label-text">${escape(item.text)}</span></button>`;
 }).join('')}</div>`).join('');
}
