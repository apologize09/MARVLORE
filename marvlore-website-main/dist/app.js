import { Hero,Services,About,Work,Explore,Portal,Awards,Contact } from './components.js?v=8edd6c6edd';
import { bootWorkBundle,getProjects,getWorkReelItems,getAwards,getWorkPage,getBundleLocale,getHeroProjects,getContact } from './cms/work-runtime.js?v=9ced1b3bd7';
import { getCmsConfig } from './cms/config.js?v=570e58cba8';
import { applyDocumentLang } from './cms/locale.js?v=654d705d77';
import { applyWorkSeo } from './cms/seo.js?v=53dbe2d483';
import { createAwardsCarousel } from './motion.js?v=53e5c054f1';
import { assetUrl } from './media-cdn.js?v=4a6c7d09a5';
import { mountWorkRouteOwner,bindWorkPathLinks,navigateWork,parseWorkPath } from './work-route.js?v=4591b22067';
import { mountWorkListingPage,hideWorkListingShell } from './work-listing.js?v=e03d0a9710';

const BOOT_POSTER='./assets/hero-video/swft-icon-poster.webp?v=b16550e768';

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

/** Phase D: flip deferred stylesheet media to all for a section (once). */
function activateSectionCss(section){
 document.querySelectorAll(`link[data-defer-section="${section}"]`).forEach(link=>{
  if(link.media!=='all')link.media='all';
 });
}

/**
 * Phase C: run loader once when #id intersects (or immediately if no IO / missing node).
 * Returns disposer — call again after CMS replaceWith.
 */
function observeOnce(id,loader,{rootMargin='240px 0px'}={}){
 const el=document.getElementById(id);
 if(!el || typeof IntersectionObserver==='undefined'){
  void loader();
  return ()=>{};
 }
 let done=false;
 let io=null;
 const run=()=>{
  if(done)return;
  done=true;
  io?.disconnect();
  void loader();
 };
 io=new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting))run();
 },{root:null,rootMargin,threshold:0.01});
 io.observe(el);
 return ()=>{done=true;io?.disconnect();};
}

/** Dismiss HTML welcome overlay after a short brand beat. */
function dismissWelcomeShell({minMs=1600,force=false}={}){
 const shell=document.getElementById('welcome-shell');
 if(!shell || shell.classList.contains('is-leaving') || shell.classList.contains('is-gone'))return;
 if(document.documentElement.classList.contains('welcome-skip') || force){
  shell.classList.add('is-gone');
  return;
 }
 if(!shell.dataset.shownAt)shell.dataset.shownAt=String(performance.now());
 const started=Number(shell.dataset.shownAt)||performance.now();
 const wait=Math.max(0,minMs-(performance.now()-started));
 const leave=()=>{
  shell.classList.add('is-leaving');
  const done=()=>{shell.classList.add('is-gone');shell.removeEventListener('animationend',done);};
  shell.addEventListener('animationend',done);
  setTimeout(done,1000);
 };
 if(wait)setTimeout(leave,wait);
 else leave();
}

/** Phase A/B: reuse HTML #home / #hero-orbit (keep poster). Append missing sections only. */
function paintAppShell(){
 const app=document.querySelector('#app');
 if(!app)return;

 let home=document.getElementById('home');
 if(home){
  home.classList.add('hero','screen');
  home.setAttribute('data-screen','01-hero');
  home.setAttribute('aria-labelledby','hero-title');
  if(!home.querySelector('.hero-inner')){
   home.innerHTML=`<div class="hero-inner"><h1 id="hero-title">Ideas Make Brands POP</h1><div class="hero-stage"><div id="hero-orbit" aria-label="迈络品牌作品立体轮播"></div></div></div>`;
  }
 }else{
  app.insertAdjacentHTML('afterbegin',Hero());
  home=document.getElementById('home');
 }

 const orbit=document.getElementById('hero-orbit');
 if(orbit && !orbit.querySelector('.hero-carousel-island') && !orbit.querySelector('.boot-hero-poster')){
  orbit.insertAdjacentHTML('beforeend',`<img class="boot-hero-poster" src="${BOOT_POSTER}" alt="" width="1280" height="720" decoding="async" fetchpriority="high">`);
 }

 const rest=[
  ['services',Services],
  ['about',About],
  ['work',Work],
  ['explore',Explore],
  ['marvlore-go',Portal],
  ['awards',Awards],
  ['contact',Contact],
 ];
 for(const [id,render] of rest){
  if(!document.getElementById(id)){
   app.insertAdjacentHTML('beforeend',render());
  }
 }
}

async function start(){
 const welcome=document.getElementById('welcome-shell');
 if(welcome && !welcome.dataset.shownAt)welcome.dataset.shownAt=String(performance.now());

 const cms=getCmsConfig();
 applyDocumentLang(cms.locale);

 const initialRoute=parseWorkPath(location.pathname);
 const preferWork=initialRoute.type==='work-list'||initialRoute.type==='work-detail';
 const heroImportP=preferWork?null:import('./hero/orbit.js?v=d1d662a076');
 const cmsBoot=bootWorkBundle();

 if(preferWork)activateSectionCss('work');

 paintAppShell();
 document.documentElement.classList.add('js');
 document.documentElement.classList.remove('boot-pending');

 let workChannel=document.getElementById('work-channel');
 if(!workChannel){
  workChannel=document.createElement('div');
  workChannel.id='work-channel';
  workChannel.hidden=true;
  document.body.append(workChannel);
 }

 dismissWelcomeShell({minMs:preferWork?0:1700,force:preferWork});

 let projects=getProjects();
 let workReelItems=getWorkReelItems();
 let awards=getAwards();
 let workPage=getWorkPage();

 const mounted={
  hero:false,
  core:false,
  nav:false,
  services:false,
  about:false,
  work:false,
  explore:false,
  portal:false,
  awards:false,
  contact:false,
  cardShape:false,
  reveal:false,
  projectClicks:false,
  hashScroll:false,
  cacheSync:false,
 };

 const sectionWatchers={};
 let listingController=null;
 let channelMode=null;
 let gallery=null;
 let workDetails=null;
 let workTextReveal=null;
 let revealObserver=null;

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
   activateSectionCss('work');
   activateSectionCss('gallery');
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
   activateSectionCss('work');
   listingController=mountWorkListingPage(workChannel,{
    workPage,
    categories:projects,
    fallbackItems:workReelItems,
   });
  }
 }

 function ensureRevealObserver(){
  if(!revealObserver){
   mounted.reveal=true;
   revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
   }),{threshold:.08});
  }
  document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
 }

 function rebindSectionWatch(id,loader){
  sectionWatchers[id]?.();
  sectionWatchers[id]=observeOnce(id,loader);
  if(revealObserver){
   const root=document.getElementById(id);
   root?.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
   if(root?.classList.contains('reveal'))revealObserver.observe(root);
  }
 }

 async function ensureCardShape(){
  if(mounted.cardShape)return;
  mounted.cardShape=true;
  const {observeCardCorners}=await import('./card-shape.js?v=dc5814bef2');
  observeCardCorners();
 }

 function applyCmsDomUpdate(){
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

  let rebound=false;

  if(!mounted.work){
   const workEl=document.getElementById('work');
   if(workEl){
    const wrap=document.createElement('div');
    wrap.innerHTML=Work();
    const next=wrap.firstElementChild;
    if(next){
     workEl.replaceWith(next);
     rebindSectionWatch('work',()=>mountWorkSection().catch(err=>console.error('[app] work mount failed',err)));
     rebound=true;
    }
   }
  }

  if(!mounted.awards){
   const awardsEl=document.getElementById('awards');
   if(awardsEl){
    const wrap=document.createElement('div');
    wrap.innerHTML=Awards();
    const next=wrap.firstElementChild;
    if(next){
     awardsEl.replaceWith(next);
     rebindSectionWatch('awards',()=>mountAwardsSection().catch(err=>console.error('[app] awards mount failed',err)));
     rebound=true;
    }
   }
  }

  if(!mounted.contact){
   const contactEl=document.getElementById('contact');
   if(contactEl && getContact()){
    const wrap=document.createElement('div');
    wrap.innerHTML=Contact();
    const next=wrap.firstElementChild;
    if(next){
     contactEl.replaceWith(next);
     rebindSectionWatch('contact',()=>mountContactSection().catch(err=>console.error('[app] contact mount failed',err)));
     rebound=true;
    }
   }
  }

  if(rebound && revealObserver)ensureRevealObserver();

  if(channelMode==='list' && listingController){
   tearDownListing();
   listingController=mountWorkListingPage(workChannel,{
    workPage,
    categories:projects,
    fallbackItems:workReelItems,
   });
  }

  document.documentElement.dispatchEvent(new CustomEvent('marvlore:cms-ready',{
   detail:{source:document.documentElement.dataset.cmsWorkSource||''},
  }));
 }

 async function mountCoreInteractions(){
  if(mounted.core)return;
  mounted.core=true;

  const [
   {mountWorkDetails},
   {createProjectGallery},
  ]=await Promise.all([
   import('./work-detail.js?v=0c3cfd17a6'),
   import('./project-gallery.js?v=2847385654'),
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

  const workRouteOwner=mountWorkRouteOwner(applyWorkChannel);
  const unbindWorkLinks=bindWorkPathLinks(document);
  void workRouteOwner;void unbindWorkLinks;

  workChannel.addEventListener('click',event=>{
   const back=event.target.closest('[data-work-listing-back]');
   if(!back)return;
   if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();
   navigateWork({type:'home'},{mode:'push'});
  });

  if(!mounted.projectClicks){
   mounted.projectClicks=true;
   document.addEventListener('click',event=>{
    const link=event.target.closest('[data-project]');
    if(!link)return;
    event.preventDefault();
    const id=link.dataset.project;
    if(link.closest('#work')){workDetails.open({id,source:link,historyMode:'push'});return;}
    const index=projects.findIndex(project=>project.id===id);if(index<0)return;
    activateSectionCss('gallery');
    const live=projects.map(project=>({id:`work-${project.id}`,src:project.image?assetUrl(project.image):null,title:project.title}));
    gallery.open({items:live,index,source:link.querySelector('.work-image'),historyMode:'push'});
   });
   function syncRoute(){
    if(!location.hash.startsWith('#project-'))return;
    const id=location.hash.slice(9);
    const index=projects.findIndex(project=>project.id===id);if(index<0)return;
    activateSectionCss('gallery');
    const live=projects.map(project=>({id:`work-${project.id}`,src:project.image?assetUrl(project.image):null,title:project.title}));
    gallery.open({items:live,index,source:null,historyMode:'replace'});
   }
   window.addEventListener('hashchange',syncRoute);
   window.addEventListener('popstate',syncRoute);
   syncRoute();
  }

  if(!mounted.hashScroll){
   mounted.hashScroll=true;
   if(location.hash&&!location.hash.startsWith('#project-')&&!location.hash.startsWith('#view/')&&!location.hash.startsWith('#case/')){
    const anchor=decodeURIComponent(location.hash.slice(1));
    const positionAnchor=()=>requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView({behavior:'instant'}));
    if(document.readyState==='complete')positionAnchor();
    else window.addEventListener('load',positionAnchor,{once:true});
   }
  }

  if(cms.enabled && !mounted.cacheSync){
   mounted.cacheSync=true;
   const {mountWorkCacheSync}=await import('./cms/work-cache-sync.js?v=8888eb175a');
   mountWorkCacheSync({
    onInvalidate:()=>{
     console.info('[cms] work cache invalidated; reloading');
     location.reload();
    },
   });
  }
 }

 async function mountHero(){
  if(mounted.hero)return;
  try{
   const {mountHeroOrbit}=await (heroImportP||import('./hero/orbit.js?v=d1d662a076'));
   mountHeroOrbit();
   mounted.hero=true;
   document.getElementById('home')?.classList.remove('boot-shell');
   dismissWelcomeShell({minMs:preferWork?0:900,force:preferWork});
  }catch(err){
   console.error('[app] hero mount failed; keeping static poster',err);
  }
 }

 async function mountNav(){
  if(mounted.nav)return;
  mounted.nav=true;
  activateSectionCss('nav');
  const {mountSiteNavigation}=await import('./navigation/menu.js?v=8f8a524dc7');
  mountSiteNavigation();
 }

 async function mountServicesSection(){
  if(mounted.services)return;
  mounted.services=true;
  activateSectionCss('services');
  const {mountServices}=await import('./services/experience.js?v=482268d7dd');
  mountServices();
  ensureRevealObserver();
 }

 async function mountAboutSection(){
  if(mounted.about)return;
  mounted.about=true;
  activateSectionCss('about');
  const {mountReferenceCollage}=await import('./about/reference.js?v=aa1da4205d');
  mountReferenceCollage();
  ensureRevealObserver();
 }

 async function mountWorkSection(){
  if(mounted.work)return;
  mounted.work=true;
  activateSectionCss('work');
  activateSectionCss('gallery');
  await ensureCardShape();
  const [
   {mountWorkTextReveal},
   {mountWorkInteractions},
   {mountWorkEntrance},
   {mountWorkReel},
   {mountWorkFilters},
  ]=await Promise.all([
   import('./about/reference.js?v=aa1da4205d'),
   import('./work-interactions.js?v=203fae0eaf'),
   import('./work-entrance.js?v=70df8c2b46'),
   import('./work-reel.js?v=69584e8a45'),
   import('./cms/work-filter-mount.js?v=b084fc24c5'),
  ]);
  workTextReveal=mountWorkTextReveal();
  window.addEventListener('marvlore:work-mode',()=>workTextReveal?.refresh());
  mountWorkInteractions();
  mountWorkEntrance();
  mountWorkReel();
  mountWorkFilters();
  ensureRevealObserver();
 }

 async function mountExploreSection(){
  if(mounted.explore)return;
  mounted.explore=true;
  activateSectionCss('explore');
  const {mountExploreScene}=await import('./explore-scene.js?v=8011054c86');
  mountExploreScene();
 }

 async function mountPortalSection(){
  if(mounted.portal)return;
  mounted.portal=true;
  activateSectionCss('portal');
  const {mountPortalWall}=await import('./portal-wall.js?v=2a736d75bc');
  mountPortalWall();
 }

 async function mountAwardsSection(){
  if(mounted.awards)return;
  mounted.awards=true;
  activateSectionCss('awards');
  awards=getAwards();
  const [
   {mountSectionTextReveal},
   {mountAwardEffects},
  ]=await Promise.all([
   import('./about/reference.js?v=aa1da4205d'),
   import('./award-effects.js?v=aacf73b97d'),
  ]);
  mountSectionTextReveal({rootSelector:'#awards',textSelector:'[data-award-reveal]'});
  createAwardsCarousel(document.querySelector('.awards-carousel'),awards);
  mountAwardEffects();
  ensureRevealObserver();
 }

 async function mountContactSection(){
  if(mounted.contact)return;
  mounted.contact=true;
  activateSectionCss('contact');
  const {mountContactInteractions}=await import('./contact-interactions.js?v=d6e35aeffa');
  mountContactInteractions();
 }

 function scheduleSectionMounts(){
  afterPaint(()=>whenIdle(()=>mountNav().catch(err=>console.error('[app] nav mount failed',err))));

  const bind=(id,loader)=>{
   sectionWatchers[id]?.();
   sectionWatchers[id]=observeOnce(id,loader);
  };
  bind('services',()=>mountServicesSection().catch(err=>console.error('[app] services mount failed',err)));
  bind('about',()=>mountAboutSection().catch(err=>console.error('[app] about mount failed',err)));
  bind('work',()=>mountWorkSection().catch(err=>console.error('[app] work mount failed',err)));
  bind('explore',()=>mountExploreSection().catch(err=>console.error('[app] explore mount failed',err)));
  bind('marvlore-go',()=>mountPortalSection().catch(err=>console.error('[app] portal mount failed',err)));
  bind('awards',()=>mountAwardsSection().catch(err=>console.error('[app] awards mount failed',err)));
  bind('contact',()=>mountContactSection().catch(err=>console.error('[app] contact mount failed',err)));

  const hash=location.hash?.slice(1);
  if(hash){
   const map={
    services:mountServicesSection,
    about:mountAboutSection,
    work:mountWorkSection,
    explore:mountExploreSection,
    'marvlore-go':mountPortalSection,
    awards:mountAwardsSection,
    contact:mountContactSection,
   };
   const run=map[hash];
   if(run)void run().catch(()=>{});
  }
 }

 if(preferWork){
  void mountCoreInteractions().catch(err=>console.error('[app] core boot failed',err));
  afterPaint(()=>{
   whenIdle(()=>mountHero().catch(err=>console.error('[app] hero boot failed',err)));
  });
  scheduleSectionMounts();
 }else{
  void mountHero().catch(err=>console.error('[app] hero boot failed',err));
  afterPaint(()=>{
   whenIdle(()=>mountCoreInteractions().catch(err=>console.error('[app] core boot failed',err)));
  });
  scheduleSectionMounts();
 }

 cmsBoot.then(()=>{
  try{applyCmsDomUpdate();}
  catch(err){console.warn('[app] cms dom update failed',err);}
 }).catch(err=>{
  console.warn('[app] cms boot failed; static content kept',err);
 });
}

start().catch(err=>{
 console.error('[app] boot failed',err);
 document.documentElement.classList.remove('boot-pending');
 dismissWelcomeShell({force:true});
});
