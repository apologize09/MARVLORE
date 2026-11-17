import {mountAwardEffects} from './award-effects.js?v=entrance-123';
import {mountContactInteractions} from './contact-interactions.js?v=contact-service-motion-169';
import {mountSiteNavigation} from './navigation/menu.js?v=menu-heading-153';
import {mountWorkDetails} from './work-detail.js?v=cms-adapter-190';
import {mountWorkInteractions} from './work-interactions.js';
import {mountWorkEntrance} from './work-entrance.js';
import {mountWorkReel} from './work-reel.js?v=cms-adapter-190';
import { Hero,Services,About,Work,Explore,Portal,Awards,Contact } from './components.js?v=cms-adapter-190';
import { bootWorkBundle,getProjects,getWorkReelItems,getAwards,getWorkPage,getBundleLocale,getHeroProjects } from './cms/work-runtime.js';
import { mountWorkFilters } from './cms/work-filter-mount.js';
import { getCmsConfig } from './cms/config.js';
import { applyDocumentLang,mountLocaleSwitch } from './cms/locale.js';
import { applyWorkSeo } from './cms/seo.js';
import { mountWorkCacheSync } from './cms/work-cache-sync.js';
import { cacheClear } from './cms/work-cache.js';
import { Spring,reducedMotion,createAwardsCarousel } from './motion.js';
import { mountHeroOrbit } from './hero/orbit.js?v=hero-soft-entry-187';
import { observeCardCorners } from './card-shape.js';
import { createProjectGallery } from './project-gallery.js?v=title-case-pop-140';
import { mountServices } from './services/experience.js?v=service-matched-motion-181';
import { mountExploreScene } from './explore-scene.js?v=explore-entry-172';
import { mountPortalWall } from './portal-wall.js';
import { mountReferenceCollage,mountWorkTextReveal,mountSectionTextReveal } from './about/reference.js?v=about-white-170';
import { assetUrl } from './media-cdn.js';

async function start(){
 const cms=getCmsConfig();
 applyDocumentLang(cms.locale);
 await bootWorkBundle();
 const projects=getProjects();
 const workReelItems=getWorkReelItems();
 const awards=getAwards();
 if(cms.enabled){
  applyWorkSeo(getWorkPage()?.seo,{
   locale:getBundleLocale(),
   fallbackTitle:getWorkPage()?.title||document.title,
   fallbackDescription:getWorkPage()?.intro||undefined,
  });
 }

 document.querySelector('#app').innerHTML=[Hero,Services,About,Work,Explore,Portal,Awards,Contact].map(component=>component()).join('');
 document.documentElement.classList.add('js');
 const brandProjects=getHeroProjects();
 const workProjects=projects.map(project=>({id:`work-${project.id}`,src:project.image?assetUrl(project.image):null,title:project.title}));
 const gallery=createProjectGallery({groups:[brandProjects,workProjects,workReelItems],sourceFor:id=>{
  if(id.startsWith('reel-'))return document.querySelector(`.elastic-reel-item[data-reel-index="${workReelItems.findIndex(item=>item.id===id)}"]`);
  if(id.startsWith('work-'))return document.querySelector(`.work-card[data-project="${CSS.escape(id.slice(5))}"] .work-image`);
  return document.querySelector(`.circular-carousel__card[data-project-id="${CSS.escape(id)}"]`);
 }});
 window.addEventListener('marvlore:open-project',event=>gallery.open(event.detail));
 const workDetails=mountWorkDetails();
 window.addEventListener('marvlore:open-work',event=>workDetails.open(event.detail));
 mountHeroOrbit();
 mountServices();
 mountReferenceCollage();
 mountExploreScene();
 mountPortalWall();
 const workTextReveal=mountWorkTextReveal();
 mountSectionTextReveal({rootSelector:'#awards',textSelector:'[data-award-reveal]'});
 observeCardCorners();

 const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
 }),{threshold:.08});
 document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
 mountWorkInteractions();
 mountWorkEntrance();
 mountWorkReel();
 mountWorkFilters();
 if(cms.enabled){
  mountLocaleSwitch({
   onChange:()=>{
    cacheClear();
    location.reload();
   },
  });
  mountWorkCacheSync({
   onInvalidate:()=>{
    console.info('[cms] work cache invalidated; reload to refresh');
   },
  });
 }
 mountSiteNavigation();
 window.addEventListener('marvlore:work-mode',()=>workTextReveal.refresh());

 function openProject(id,trigger,historyMode='push'){
  if(trigger?.closest('#work')){workDetails.open({id,source:trigger,historyMode});return;}
  const index=projects.findIndex(project=>project.id===id);if(index<0)return;
  gallery.open({items:workProjects,index,source:trigger?.querySelector('.work-image'),historyMode});
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest('[data-project]');
  if(link){event.preventDefault();openProject(link.dataset.project,link);}
 });
 function syncRoute(){if(location.hash.startsWith('#project-'))openProject(location.hash.slice(9),null,'replace');}
 window.addEventListener('hashchange',syncRoute);window.addEventListener('popstate',syncRoute);syncRoute();
 if(location.hash&&!location.hash.startsWith('#project-')&&!location.hash.startsWith('#view/')&&!location.hash.startsWith('#case/')){
  const anchor=decodeURIComponent(location.hash.slice(1));
  const positionAnchor=()=>requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView({behavior:'instant'}));
  if(document.readyState==='complete')positionAnchor();else window.addEventListener('load',positionAnchor,{once:true});
 }

 createAwardsCarousel(document.querySelector('.awards-carousel'),awards);
 mountAwardEffects();
 mountContactInteractions();
}

start().catch(err=>{
 console.error('[app] boot failed',err);
});
