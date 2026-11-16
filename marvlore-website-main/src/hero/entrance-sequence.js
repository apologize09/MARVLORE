// One active-time clock owns left-side flight, direct morph and the final orbit.
// A paused/hidden scene does not advance it. Card identities and phase stay intact.
const clamp01=value=>Math.max(0,Math.min(1,value));
export const smooth=value=>{const t=clamp01(value);return t*t*t*(10+t*(-15+6*t));};
const integralSmooth=t=>t**6-3*t**5+2.5*t**4;
const lerp=(a,b,t)=>a+(b-a)*t;
export const ENTRANCE={delay:.12,stagger:.13,flight:1.15,morph:2.3};

export function sequenceTiming(count){
 const assembled=ENTRANCE.delay+Math.max(0,count-1)*ENTRANCE.stagger+ENTRANCE.flight;
 return {assembled,morphStart:assembled,end:assembled+ENTRANCE.morph};
}

export function sequenceClock(time,count,duration=24){
 const timing=sequenceTiming(count),orbitRate=1/duration;
 const morphTime=Math.max(0,Math.min(ENTRANCE.morph,time-timing.morphStart));
 const t=morphTime/ENTRANCE.morph;
 let phase=orbitRate*ENTRANCE.morph*integralSmooth(t);
 phase+=Math.max(0,time-timing.end)*orbitRate;
 const morph=smooth(t);
 const stage=time<timing.assembled?'enter':time<timing.end?'morph':'orbit';
 return {phase,morph,stage,halo:lerp(.025,1,morph),...timing};
}

export function entrancePose({time,index,count,width,height,itemWidth,itemHeight,u,orbit,clock=sequenceClock(time,count)}){
 // Fit a true face-on circle to the desktop stage. The existing rectangular
 // cards keep their native width/height; only uniform scene scale is applied.
 const radius=Math.max(40,Math.min(width*.28,(height-itemHeight-46)/2));
 // The assembled face-on circle stays still; only its ellipse destination
 // advances during the morph, smoothly picking up the final cruising speed.
 const angle=(u-clock.phase)*Math.PI*2;
 const circle={x:width/2-radius*Math.cos(angle),y:height/2+radius*Math.sin(angle)};
 const flightStart=ENTRANCE.delay+index*ENTRANCE.stagger;
 const flightProgress=clamp01((time-flightStart)/ENTRANCE.flight),arrive=smooth(flightProgress);
 // All cards share the left entry edge and a tight vertical launch band.
 const start={x:-itemWidth*1.4-index*24,y:height/2+(index-(count-1)/2)*Math.min(itemHeight*.13,14)};
 const x=lerp(lerp(start.x,circle.x,arrive),orbit.x,clock.morph);
 const y=lerp(lerp(start.y,circle.y,arrive),orbit.y,clock.morph);
 return {
  x,y,scale:lerp(lerp(.92,1,arrive),orbit.scale,clock.morph),
  opacity:smooth(flightProgress/.25)*lerp(1,orbit.opacity,clock.morph),
  rotation:(1-arrive)*-8,
  z:clock.morph<.5?20+index:orbit.z
 };
}
