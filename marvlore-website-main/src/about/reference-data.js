// 这一屏的独立素材、位置和交互参数。后续逐张替换 artworks 即可。
export const referenceSource='https://www.lu78.art/';
// Let the central copy lead before the two card arcs begin assembling.
export const referenceEntryDelay=.4;
const expand=n=>50+(n-50)*1.12;
const columns=[-.75,18.25,39.25,60.25,79.25].map(expand);
// 上弧选浅色、白底场景，下弧选大面积蓝色画面；只改变图片与裁切。
const artworks=[
 {src:'./assets/reference-collage/project-04.webp',alt:'绿色星形角色 · 白色品牌创意场景',focus:'53% 50%'},
 {src:'./assets/about-white/lophthy-visual.webp',alt:'LOPHTY · 白底人物视觉',focus:'0% 50%'},
 {src:'./assets/about-white/daily-mark.webp',alt:'DAILY · 白底品牌标识',focus:'50% 50%'},
 {src:'./assets/about-white/summo-character.webp',alt:'SUMMO · 白底角色设计',focus:'50% 50%'},
 {src:'./assets/orbit/vapes-dog.webp',alt:'Vapes Bars · 白色宠物品牌场景',focus:'100% 50%'},
 {src:'./assets/home-projects/lophthy-01.webp',alt:'LOPHTY · 蓝色品牌视觉提案',focus:'40% 50%'},
 {src:'./assets/work-visual/lophthy-graphic-blue.webp',alt:'LOPHTY · 蓝色视觉图形',focus:'50% 50%'},
 {src:'./assets/reference-collage/project-02.webp',alt:'安慕希整颗蓝莓酸奶 · 蓝色创意场景',focus:'0% 50%'},
 {src:'./assets/work-covers/film-blue-152.webp',alt:'POP Palm · 蓝色产品动画视觉',focus:'50% 50%'},
 {src:'./assets/work-covers/culture-lophty-152.webp',alt:'LOPHTY · 蓝色品牌空间视觉',focus:'80% 50%'},
];
const entryOrder=[2,1,0,5,6,7,8,9,3,4];
const topY=[11.5,2,-3.5,2,11.5],bottomY=[67,77,82.5,77,67];
const angles=[-28,-12,0,12,28,28,12,0,-12,-28];
const scatter=[[-20,-10,-34],[-15,-18,-18],[0,-32,0],[15,-18,18],[20,-10,34],[-20,14,34],[-14,18,18],[0,30,0],[14,18,-18],[20,14,-34]];
export const referenceCards=artworks.map((artwork,index)=>({
 id:`reference-${index+1}`,...artwork,
 left:columns[index%5],top:expand((index<5?topY:bottomY)[index%5]),
 size:23.5,angle:angles[index],order:entryOrder.indexOf(index),
 scatter:{x:scatter[index][0],y:scatter[index][1],rotate:scatter[index][2]},
}));

// 中央文案可独立编辑，不与卡片图片合并。
export const aboutCopy={
 name:'Marvlore',chineseName:'（迈络）',
 partner:'Your Full-Service Partner for Brand Visuals & Creative Content',
 partnerChinese:'您的品牌视觉与内容创意全案伙伴',
 stats:[
  {number:'8',lines:['Industries Served','八大行业服务经验','FMCG, Beauty, 3C, Electronics...','快消，美妆，3C 等']},
  {number:'60',lines:['Brand Cases','Pop-worthy visuals for 60+ brands','赋能 60+ 品牌打造出圈视觉']},
 ],
};

/** CMS may replace copy + collage src/alt/focus only; geometry stays from referenceCards. */
export function resolveAboutCopy(){
 try{
  const cms=typeof window!=='undefined'?window.__MARVLORE_ABOUT__:null;
  if(cms?.copy){
   return {
    name:cms.copy.name||aboutCopy.name,
    chineseName:cms.copy.chineseName||aboutCopy.chineseName,
    partner:cms.copy.partner||aboutCopy.partner,
    partnerChinese:cms.copy.partnerChinese||aboutCopy.partnerChinese,
    stats:Array.isArray(cms.copy.stats)&&cms.copy.stats.length?cms.copy.stats:aboutCopy.stats,
   };
  }
 }catch{}
 return aboutCopy;
}

export function resolveReferenceCards(){
 let collage=[];
 try{
  const cms=typeof window!=='undefined'?window.__MARVLORE_ABOUT__:null;
  if(Array.isArray(cms?.collage))collage=cms.collage;
 }catch{}
 if(!collage.length)return referenceCards;
 const bySlot=new Map(collage.map(item=>[Number(item.slotIndex),item]));
 return referenceCards.map((card,index)=>{
  const hit=bySlot.get(index);
  if(!hit)return card;
  return {
   ...card,
   src:hit.src||card.src,
   alt:hit.alt||card.alt,
   focus:hit.focus||card.focus,
  };
 });
}
