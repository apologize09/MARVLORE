import {mountAwardEffects} from './award-effects.js?v=75358a56db';
import {mountContactInteractions} from './contact-interactions.js?v=d6e35aeffa';
import {mountSiteNavigation} from './navigation/menu.js?v=8f8a524dc7';
import {mountWorkDetails} from './work-detail.js?v=e6f6398e8d';
import {mountWorkInteractions} from './work-interactions.js?v=203fae0eaf';
import {mountWorkEntrance} from './work-entrance.js?v=70df8c2b46';
import {mountWorkReel} from './work-reel.js?v=69584e8a45';
import { Hero,Services,About,Work,Explore,Portal,Awards,Contact } from './components.js?v=8edd6c6edd';
import { bootWorkBundle,getProjects,getWorkReelItems,getAwards,getWorkPage,getBundleLocale,getHeroProjects,getContact } from './cms/work-runtime.js?v=9ced1b3bd7';
import { mountWorkFilters } from './cms/work-filter-mount.js?v=b084fc24c5';
import { getCmsConfig } from './cms/config.js?v=570e58cba8';
import { applyDocumentLang } from './cms/locale.js?v=654d705d77';
import { applyWorkSeo } from './cms/seo.js?v=53dbe2d483';
import { mountWorkCacheSync } from './cms/work-cache-sync.js?v=8888eb175a';
import { createAwardsCarousel } from './motion.js?v=53e5c054f1';
import { mountHeroOrbit } from './hero/orbit.js?v=4b28d9d1f5';
import { observeCardCorners } from './card-shape.js?v=dc5814bef2';
import { createProjectGallery } from './project-gallery.js?v=2847385654';
import { mountServices } from './services/experience.js?v=482268d7dd';
import { mountExploreScene } from './explore-scene.js?v=8011054c86';
import { mountPortalWall } from './portal-wall.js?v=2a736d75bc';
import { mountReferenceCollage,mountWorkTextReveal,mountSectionTextReveal } from './about/reference.js?v=aa1da4205d';
import { assetUrl } from './media-cdn.js?v=4a6c7d09a5';
import { mountWorkRouteOwner,bindWorkPathLinks,navigateWork,parseWorkPath } from './work-route.js?v=4591b22067';
import { mountWorkListingPage,hideWorkListingShell } from './work-listing.js?v=e03d0a9710';

const BOOT_POSTER='./assets/hero-video/swft-icon-poster.webp?v=b16550e768';

/** Dismiss HTML welcome overlay after a short brand beat (outside #app so shell paint is safe). */
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

/**
 * Phase A/B: reuse HTML #home / #hero-orbit (keep poster). Append missing sections only.
 * Never wipe #app with a full innerHTML replace.
 */
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

 // Phase B: CMS boots in background — never blocks first shell / hero paint.
 const cmsBoot=bootWorkBundle();

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

 // Brand welcome covers the first beat; hero shell is already under it.
 dismissWelcomeShell({minMs:preferWork?0:1700,force:preferWork});

 let projects=getProjects();
 let workReelItems=getWorkReelItems();
 let awards=getAwards();
 let workPage=getWorkPage();

 const mounted={
  hero:false,
  work:false,
  awards:false,
  contact:false,
 };

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

 function ensureRevealObserver(){
  if(!revealObserver){
   revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
   }),{threshold:.08});
  }
  document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
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

  if(!mounted.work){
   const workEl=document.getElementById('work');
   if(workEl){
    const wrap=document.createElement('div');
    wrap.innerHTML=Work();
    const next=wrap.firstElementChild;
    if(next){
     workEl.replaceWith(next);
     ensureRevealObserver();
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
     ensureRevealObserver();
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
     ensureRevealObserver();
    }
   }
  }

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

 function mountCore(){
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

  if(!mounted.hero){
   try{
    mountHeroOrbit();
    mounted.hero=true;
    document.getElementById('home')?.classList.remove('boot-shell');
   }catch(err){
    console.error('[app] hero mount failed; keeping static poster',err);
   }
  }

  mountServices();
  mountReferenceCollage();
  mountExploreScene();
  mountPortalWall();
  workTextReveal=mountWorkTextReveal();
  mountSectionTextReveal({rootSelector:'#awards',textSelector:'[data-award-reveal]'});
  observeCardCorners();
  ensureRevealObserver();

  mounted.work=true;
  mountWorkInteractions();
  mountWorkEntrance();
  mountWorkReel();
  mountWorkFilters();

  if(cms.enabled){
   mountWorkCacheSync({
    onInvalidate:()=>{
     console.info('[cms] work cache invalidated; reloading');
     location.reload();
    },
   });
  }
  mountSiteNavigation();
  window.addEventListener('marvlore:work-mode',()=>workTextReveal?.refresh());

  const workRouteOwner=mountWorkRouteOwner(applyWorkChannel);
  const unbindWorkLinks=bindWorkPathLinks(document);
  workChannel.addEventListener('click',event=>{
   const back=event.target.closest('[data-work-listing-back]');
   if(!back)return;
   if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();
   navigateWork({type:'home'},{mode:'push'});
  });
  void workRouteOwner;void unbindWorkLinks;

  document.addEventListener('click',event=>{
   const link=event.target.closest('[data-project]');
   if(link){
    event.preventDefault();
    const id=link.dataset.project;
    if(link.closest('#work')){workDetails.open({id,source:link,historyMode:'push'});return;}
    const index=projects.findIndex(project=>project.id===id);if(index<0)return;
    const workProjectsLive=projects.map(project=>({id:`work-${project.id}`,src:project.image?assetUrl(project.image):null,title:project.title}));
    gallery.open({items:workProjectsLive,index,source:link.querySelector('.work-image'),historyMode:'push'});
   }
  });
  function syncRoute(){
   if(location.hash.startsWith('#project-')){
    const id=location.hash.slice(9);
    const index=projects.findIndex(project=>project.id===id);if(index<0)return;
    const workProjectsLive=projects.map(project=>({id:`work-${project.id}`,src:project.image?assetUrl(project.image):null,title:project.title}));
    gallery.open({items:workProjectsLive,index,source:null,historyMode:'replace'});
   }
  }
  window.addEventListener('hashchange',syncRoute);
  window.addEventListener('popstate',syncRoute);
  syncRoute();
  if(location.hash&&!location.hash.startsWith('#project-')&&!location.hash.startsWith('#view/')&&!location.hash.startsWith('#case/')){
   const anchor=decodeURIComponent(location.hash.slice(1));
   const positionAnchor=()=>requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView({behavior:'instant'}));
   if(document.readyState==='complete')positionAnchor();
   else window.addEventListener('load',positionAnchor,{once:true});
  }

  mounted.awards=true;
  createAwardsCarousel(document.querySelector('.awards-carousel'),awards);
  mountAwardEffects();

  mounted.contact=true;
  mountContactInteractions();

  // Welcome should already be leaving; ensure exit once hero is live.
  dismissWelcomeShell({minMs:preferWork?0:900,force:preferWork});
 }

 // Paint + mount immediately with static bundle (CMS may still be in flight).
 mountCore();

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
