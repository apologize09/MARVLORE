// 每张卡片单独填充：将 image 改为项目图片路径即可。
// image 为空时，用独立 SVG 视口显示原平面图里的对应卡片作为预览。
// 换图不需要修改 preview；图片直接填满独立卡片，可配置 fit / position。
const top = [
 ['character','品牌角色',263,503,-30],
 ['portrait','人物创意',590,343,-14],
 ['material','材质与光影',947,250,0],
 ['product','产品视觉',1304,343,14],
 ['packaging','包装设计',1630,503,30],
];
const bottom = [
 ['blue-product','蓝色产品视觉',263,188,30],
 ['brand-system','品牌视觉系统',590,370,14],
 ['visual-graphic','视觉图形',947,465,0],
 ['lophthy','LOPHTY 品牌视觉',1304,370,-14],
 ['blueberry','产品概念视觉',1630,188,-30],
];
export const aboutCards = [top,bottom].flatMap((row,rowIndex)=>row.map(([id,alt,cx,cy,rotation],index)=>({
 id,alt,row:rowIndex?'bottom':'top',index,image:'',fit:'cover',position:'50% 50%',
 preview:{image:`about-arc-${rowIndex?'bottom':'top'}.webp`,width:1600,height:rowIndex?584:643,cx,cy,rotation},
})));

const escapeAttr = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export function renderAboutCards(row){
 return aboutCards.filter(card=>card.row===row).map(card=>{
  const {preview:p,index}=card;
  const previewZoom=row==='bottom'&&(index===0||index===4)?1.35:1.055;
  const content=card.image
   ? `<img src="${escapeAttr(card.image)}" alt="${escapeAttr(card.alt)}" loading="lazy" decoding="async" style="object-fit:${escapeAttr(card.fit)};object-position:${escapeAttr(card.position)}">`
   : `<svg viewBox="0 0 350 350" role="img" aria-label="${escapeAttr(card.alt)}"><image href="./assets/${p.image}" width="${p.width}" height="${p.height}" transform="translate(175 175) scale(${previewZoom}) rotate(${-p.rotation}) translate(${-p.cx} ${-p.cy})"/></svg>`;
  return `<figure class="about-card" data-about-card="${card.id}" data-card-shape style="--card-x:${12+index*19}%;--card-level:${[1,.27,0,.27,1][index]};--card-rotation:${p.rotation}deg;--card-layer:${[3,2,1,2,3][index]}">${content}</figure>`;
 }).join('');
}
