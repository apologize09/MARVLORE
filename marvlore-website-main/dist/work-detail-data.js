import {projects} from './data.js?v=178a4e2f6c';
import {heroImages} from './hero/images.js?v=e3a01fefe9';
import {workReelItems} from './work-reel-data.js?v=b852b2dc58';
import {visualProjects} from './visual-projects.js?v=af6a11505e';
import {filmProjects} from './film-projects.js?v=ea4af0b2ae';

// Work-page case studies. All content is independent from the home carousel.
// Add images / videos to media; only supplied material is rendered on the page.
const asset=(src,alt,width,height)=>({type:'image',src,alt,width,height});
const orbit=index=>{const p=heroImages[index];return asset(p.src,p.alt,p.width,p.height);};
const additions={
 film:[],
 visual:[],
 web:[orbit(6)],
 culture:[]
};
const coverFor=p=>p.image?asset('./assets/'+p.image,p.label,['visual','film'].includes(p.id)?1920:p.id==='web'?835:834,['visual','film'].includes(p.id)?1080:347):null;
const directionCases=projects.map((p,index)=>({
 id:p.id,category:p.id,title:p.title,subtitle:p.cn,eyebrow:p.eyebrow,
 summary:p.description,intro:p.detail,tags:p.tags,
 cover:coverFor(p),media:additions[p.id],
 index:index+1,total:projects.length,nextId:projects[(index+1)%projects.length].id
}));
const reelCases=workReelItems.map((p,index)=>{
 const base=directionCases.find(item=>p.id==='reel-'+item.id);
 const words=p.title.split(' · ');
 return {...(base??{
  category:p.category,title:words[0],subtitle:words[1]??p.subtitle,
  eyebrow:'Selected Visuals',summary:projects.find(item=>item.id===p.category)?.description??p.subtitle,intro:'围绕品牌表达，探索图形、材质与视觉系统的更多可能。',
  tags:[p.subtitle],cover:asset(p.src,p.alt,p.width??Math.round(p.aspect*2250),p.height??2250),media:[]
 }),id:p.id,index:index+1,total:workReelItems.length,nextId:workReelItems[(index+1)%workReelItems.length].id};
});
// Visual projects stay independent, including their next-project navigation.
const filmCases=filmProjects.map((p,index)=>({
 id:p.id,category:p.category,title:p.title.split(' · ')[0],subtitle:'品牌影片',
 eyebrow:'Film & Animation',summary:'影视动画',intro:p.title,tags:['影视动画'],
 cover:{type:'video',src:p.videoSrc,srcHd:p.videoSrcHd,poster:p.src,alt:p.alt,width:p.width,height:p.height},media:[],
 index:index+1,total:filmProjects.length,nextId:filmProjects[(index+1)%filmProjects.length].id,
}));
const visualCases=visualProjects.map((p,index)=>({
 id:p.id,category:p.category,title:p.title.split(' · ')[0],subtitle:p.subtitle,
 eyebrow:'Brand Visuals',summary:p.subtitle,intro:p.title,tags:['视觉设计',p.subtitle],
 cover:asset(p.src,p.alt,p.width,p.height),media:[],index:index+1,total:visualProjects.length,
 nextId:visualProjects[(index+1)%visualProjects.length].id,
}));
// Override individual cases here without changing card or carousel content.
// Example: film:{title:'项目名称',summary:'简介',media:[{type:'image',src:'./assets/project.jpg',alt:'项目视觉',width:2400,height:1600}]}
export const workDetailOverrides={};
export const workDetailCases=[...directionCases,...reelCases.filter(item=>!['visual','film'].includes(item.category)),...filmCases,...visualCases].map(item=>({...item,...workDetailOverrides[item.id]}));
export const getWorkDetail=id=>workDetailCases.find(item=>item.id===id);
