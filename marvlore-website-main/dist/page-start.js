// Run before the page is parsed so a reload cannot restore a section or gallery route.
// Fresh deep links and back/forward navigation keep their normal destinations.
(() => {
 if(performance.getEntriesByType('navigation')[0]?.type!=='reload')return;
 const restoration=history.scrollRestoration;
 history.scrollRestoration='manual';
 history.replaceState(null,'',`${location.pathname}${location.search}#home`);
 const home=()=>window.scrollTo({top:0,left:0,behavior:'instant'});
 home();
 window.addEventListener('pageshow',()=>{
  home();
  requestAnimationFrame(()=>{home();history.scrollRestoration=restoration;});
 },{once:true});
})();
