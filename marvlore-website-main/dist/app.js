import { Hero,Services,About,Work,Explore,Portal,Awards,Contact } from './components.js?v=eafae8d7ff';
import { bootWorkBundle,getProjects,getWorkReelItems,getAwards,getWorkPage,getBundleLocale,getHeroProjects } from './cms/work-runtime.js?v=711a0f69d6';
import { getCmsConfig } from './cms/config.js?v=1e182ce0a2';
import { applyDocumentLang } from './cms/locale.js?v=654d705d77';
import { applyWorkSeo } from './cms/seo.js?v=53dbe2d483';
import { createAwardsCarousel } from './motion.js?v=53e5c054f1';
import { assetUrl } from './media-cdn.js?v=4a6c7d09a5';
import { mountWorkRouteOwner,bindWorkPathLinks,navigateWork,parseWorkPath } from './work-route.js?v=4591b22067';
import { mountWorkListingPage,hideWorkListingShell } from './work-listing.js?v=2e331fa8e1';

/** Defer non-critical work until after first paint (or shortly after). */
function afterPaint(fn){
 if(typeof requestAnimationFrame==='function'){
  requestAnimationFrame(()=>requestAnimationFrame(()=>void fn()));
 }else{
  setTimeout(()=>void fn(),0);
 }
}

function whenIdle(fn,timeout=1500){
 if(typeof requestIdleCallback==='function'){
  requestIdleCallback(()=>void fn(),{timeout});
 }else{
  setTimeout(()=>void fn(),1);
 }
}

async function start(){
 const cms=getCmsConfig();
 applyDocumentLang(cms.locale);

 const initialRoute=parseWorkPath(location.pathname);
 const preferWork=initialRoute.type==='work-list'||initialRoute.type==='work-detail';
 // Start downloading the hero island immediately (overlaps paint + optional CMS).
 const heroImportP=preferWork?null:import('./hero/orbit.js?v=86005d2035');
 // CMS resolve in parallel — module already holds a static bundle for first paint.
 const cmsBoot=bootWorkBundle();

 // First meaningful paint: section shells only (no heavy React islands yet).
 document.querySelector('#app').innerHTML=[Hero,Services,About,Work,Explore,Portal,Awards,Contact].map(component=>component()).join('');
 let workChannel=document.getElementById('work-channel');
 if(!workChannel){
  workChannel=document.createElement('div');
  workChannel.id='work-channel';
  workChannel.hidden=true;
  document.body.append(workChannel);
 }
 document.documentElement.classList.add('js');
 document.documentElement.classList.remove('boot-pending');

 let projects=getProjects();
 let workReelItems=getWorkReelItems();
 let awards=getAwards();
 let workPage=getWorkPage();

 async function ensureCms(){
  await cmsBoot;
  projects=getProjects();
  workReelItems=getWorkReelItems();
  awards=getAwards();
  workPage=getWorkPage();
  if(cms.enabled){
   applyWorkSeo(workPage?.seo,{
    locale:getBundleLocale(),
    fallbackTitle:workPage?.title||document.title,
    fallbackDescription:workPage?.intro||undefined,
   });
  }
 }

 let gallery=null;
 let workDetails=null;
 let listingController=null;
 let channelMode=null;
 let workTextReveal=null;
 let workRouteOwner=null;
 let unbindWorkLinks=null;

 function tearDownListing(){
  listingController?.destroy?.();
  listingController=null;
 }

 function applyWorkChannel(route){
  const active=route?.type==='work-list'||route?.type==='work-detail';
  document.body.classList.toggle('work-channel-active',active);
  if(!active){
   tearDownListing();
   hideWorkListingShell(workChannel);
   channelMode=null;
   if(cms.enabled){
    applyWorkSeo(workPage?.seo,{
     locale:getBundleLocale(),
     fallbackTitle:workPage?.title||document.title,
     fallbackDescription:workPage?.intro||undefined,
    });
   }
   return;
  }
  if(!workDetails)return;
  if(route.type==='work-detail'){
   tearDownListing();
   hideWorkListingShell(workChannel);
   channelMode='detail';
   document.body.classList.remove('work-channel-active');
   workDetails.open({
    id:route.slug,
    slug:route.slug,
    historyMode:'none',
    pathMode:true,
    returnUrl:history.state?.returnUrl||'/work',
   });
   return;
  }
  if(channelMode!=='list'||!listingController){
   tearDownListing();
   channelMode='list';
   listingController=mountWorkListingPage(workChannel,{
    workPage,
    categories:projects,
    fallbackItems:workReelItems,
   });
  }
 }

 function openProject(id,trigger,historyMode='push'){
  if(trigger?.closest('#work')){
   workDetails?.open({id,source:trigger,historyMode});
   return;
  }
  const index=projects.findIndex(project=>project.id===id);
  if(index<0||!gallery)return;
  const workProjects=projects.map(project=>({id:`work-${project.id}`,src:project.image?assetUrl(project.image):null,title:project.title}));
  gallery.open({items:workProjects,index,source:trigger?.querySelector('.work-image'),historyMode});
 }

 function wireProjectClicks(){
  document.addEventListener('click',event=>{
   const link=event.target.closest('[data-project]');
   if(link){event.preventDefault();openProject(link.dataset.project,link);}
  });
  function syncRoute(){
   if(location.hash.startsWith('#project-'))openProject(location.hash.slice(9),null,'replace');
  }
  window.addEventListener('hashchange',syncRoute);
  window.addEventListener('popstate',syncRoute);
  syncRoute();
 }

 function wireHashScroll(){
  if(location.hash&&!location.hash.startsWith('#project-')&&!location.hash.startsWith('#view/')&&!location.hash.startsWith('#case/')){
   const anchor=decodeURIComponent(location.hash.slice(1));
   const positionAnchor=()=>requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView({behavior:'instant'}));
   if(document.readyState==='complete')positionAnchor();
   else window.addEventListener('load',positionAnchor,{once:true});
  }
 }

 workChannel.addEventListener('click',event=>{
  const back=event.target.closest('[data-work-listing-back]');
  if(!back)return;
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  navigateWork({type:'home'},{mode:'push'});
 });

 async function mountCoreInteractions(){
  const [
   {mountWorkDetails},
   {createProjectGallery},
   {mountWorkCacheSync},
  ]=await Promise.all([
   import('./work-detail.js?v=3babfa22fa'),
   import('./project-gallery.js?v=2847385654'),
   import('./cms/work-cache-sync.js?v=9068347e6b'),
  ]);

  const brandProjects=getHeroProjects();
  const workProjects=projects.map(project=>({id:`work-${project.id}`,src:project.image?assetUrl(project.image):null,title:project.title}));
  gallery=createProjectGallery({groups:[brandProjects,workProjects,workReelItems],sourceFor:id=>{
   if(id.startsWith('reel-'))return document.querySelector(`.elastic-reel-item[data-reel-index="${workReelItems.findIndex(item=>item.id===id)}"]`);
   if(id.startsWith('work-'))return document.querySelector(`.work-card[data-project="${CSS.escape(id.slice(5))}"] .work-image`);
   return document.querySelector(`.circular-carousel__card[data-project-id="${CSS.escape(id)}"]`);
  }});
  window.addEventListener('marvlore:open-project',event=>gallery.open(event.detail));
  workDetails=mountWorkDetails();
  window.addEventListener('marvlore:open-work',event=>workDetails.open(event.detail));

  if(cms.enabled){
   mountWorkCacheSync({
    onInvalidate:()=>{
     console.info('[cms] work cache invalidated; reloading');
     location.reload();
    },
   });
  }

  workRouteOwner=mountWorkRouteOwner(applyWorkChannel);
  unbindWorkLinks=bindWorkPathLinks(document);
  void workRouteOwner;void unbindWorkLinks;
  wireProjectClicks();
  wireHashScroll();
 }

 async function mountHero(){
  const {mountHeroOrbit}=await (heroImportP||import('./hero/orbit.js?v=86005d2035'));
  mountHeroOrbit();
 }

 async function mountDeferredIslands(){
  const [
   {mountServices},
   {mountReferenceCollage,mountWorkTextReveal,mountSectionTextReveal},
   {mountExploreScene},
   {mountPortalWall},
   {observeCardCorners},
   {mountWorkInteractions},
   {mountWorkEntrance},
   {mountWorkReel},
   {mountWorkFilters},
   {mountSiteNavigation},
   {mountAwardEffects},
   {mountContactInteractions},
  ]=await Promise.all([
   import('./services/experience.js?v=482268d7dd'),
   import('./about/reference.js?v=aa1da4205d'),
   import('./explore-scene.js?v=8011054c86'),
   import('./portal-wall.js?v=2a736d75bc'),
   import('./card-shape.js?v=dc5814bef2'),
   import('./work-interactions.js?v=203fae0eaf'),
   import('./work-entrance.js?v=70df8c2b46'),
   import('./work-reel.js?v=418adbd485'),
   import('./cms/work-filter-mount.js?v=f41724251b'),
   import('./navigation/menu.js?v=8f8a524dc7'),
   import('./award-effects.js?v=75358a56db'),
   import('./contact-interactions.js?v=d6e35aeffa'),
  ]);

  mountServices();
  mountReferenceCollage();
  mountExploreScene();
  mountPortalWall();
  workTextReveal=mountWorkTextReveal();
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
  mountSiteNavigation();
  window.addEventListener('marvlore:work-mode',()=>workTextReveal?.refresh());

  createAwardsCarousel(document.querySelector('.awards-carousel'),awards);
  mountAwardEffects();
  mountContactInteractions();
 }

 // Home: hero overlaps CMS; /work: wait for CMS then core route modules.
 if(preferWork){
  await ensureCms();
  await mountCoreInteractions();
  afterPaint(()=>{whenIdle(()=>mountHero().then(()=>mountDeferredIslands()).catch(err=>console.error('[app] deferred boot failed',err)));});
 }else{
  await Promise.all([mountHero(),ensureCms()]);
  afterPaint(()=>{
   whenIdle(()=>mountCoreInteractions().then(()=>mountDeferredIslands()).catch(err=>console.error('[app] deferred boot failed',err)));
  });
 }
}

start().catch(err=>{
 console.error('[app] boot failed',err);
 document.documentElement.classList.remove('boot-pending');
});
