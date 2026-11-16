const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
export const TAGS_ENTER_AT=.60;
export const SERVICES_LIST_START=.52;
export const SERVICES_LIST_DURATION=.12;

// Pure scroll position drives both directions; no entrance timers to replay or accumulate.
export function servicesListFrame(progress,index,viewportHeight){
 const start=SERVICES_LIST_START+(index===0?0:.025+index*.019);
 const enter=ease((progress-start)/SERVICES_LIST_DURATION);
 const rise=Math.max(90,Math.min(180,viewportHeight*.16));
 return {opacity:enter,blur:4*(1-enter),y:rise*(1-enter)};
}

export function servicesTitleFrame(progress,viewportHeight,metrics){
 const exit=ease((progress-.34)/(TAGS_ENTER_AT-.34));
 const travel=Math.max(0,...metrics.map(line=>line.top+line.height))+32;
 const y=-travel*exit;
 const fadeTop=Math.max(64,viewportHeight*.12);
 const riseDistance=Math.max(120,Math.min(240,viewportHeight*.22));
 return {y,lines:metrics.map((line,index)=>{
  const enter=ease((progress-index*.025)/.16);
  const top=line.top+y;
  // 位置决定退场：先上移至顶部附近，再逐行消失。
  const leave=ease((fadeTop-top)/(fadeTop+line.height*.65));
  const opacity=enter*(1-leave);
  return {opacity,blur:4*(1-opacity),enterY:riseDistance*(1-enter),leaveY:-riseDistance*leave};
 })};
}
