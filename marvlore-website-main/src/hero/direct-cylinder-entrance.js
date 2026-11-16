import {cylinderIntroClock,CYLINDER_ENTRANCE} from './cylinder-entrance.js';

const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return clamp(t*t*t*(10+t*(-15+6*t)));};

export const DIRECT_TITLE_END=CYLINDER_ENTRANCE.delay+1.1;
export const DIRECT_ENTRANCE={delay:CYLINDER_ENTRANCE.delay,stagger:.13,flight:1.8,feed:.5,fade:.55,rotationLead:.4,halo:1.05};
export const directCylinderDuration=count=>DIRECT_ENTRANCE.delay+Math.max(0,count-1)*DIRECT_ENTRANCE.stagger+DIRECT_ENTRANCE.flight;
export const directSequenceDuration=count=>directCylinderDuration(count)+DIRECT_ENTRANCE.rotationLead+DIRECT_ENTRANCE.halo;

export function directCylinderClock(time,count){
 const end=directCylinderDuration(count);
 const haloStart=end+DIRECT_ENTRANCE.rotationLead;
 const {titleLift,titleScale}=cylinderIntroClock(time,count);
 const halo=smooth((time-haloStart)/DIRECT_ENTRANCE.halo);
 const stage=time<DIRECT_ENTRANCE.delay?'title':time<end?'direct-flight':time<haloStart?'rotation':time<directSequenceDuration(count)?'halo':'cylinder';
 return {stage,morph:smooth((time-DIRECT_ENTRANCE.delay)/.8),halo,titleLift,titleScale,end};
}

export function directCylinderTiming(index,count,direction=-1){
 const step=360/count,entry=45+step/2,seat=index*step;
 const travel=(((seat-entry)*direction)%360+360)%360;
 const rank=count-1-Math.floor(travel/step);
 const start=DIRECT_ENTRANCE.delay+rank*DIRECT_ENTRANCE.stagger;
 return {entry,seat,travel,rank,start,end:start+DIRECT_ENTRANCE.flight};
}

// Every card follows the same right-side entry and the native cylinder's plane.
// Lead cards travel farther around the ring, leaving room for the following ones.
export function directCylinderPose({time,index,count,width,height,cardWidth,radius,direction=-1}){
 const timing=directCylinderTiming(index,count,direction);
 const progress=time>=timing.end?1:clamp((time-timing.start)/DIRECT_ENTRANCE.flight);
 const arrival=smooth(progress),feed=1-smooth(progress/DIRECT_ENTRANCE.feed);
 const angle=timing.entry+direction*timing.travel*arrival;
 // Keep the arriving covers readable; align them with the ring as they settle.
 const yaw=angle+(20-timing.entry)*feed;
 const radians=angle*Math.PI/180,entryRadians=timing.entry*Math.PI/180;
 const sourceX=width*.68+cardWidth+radius;
 return {
  x:radius*Math.sin(radians)+(sourceX-radius*Math.sin(entryRadians))*feed,
  y:height*.08*feed,
  z:radius*Math.cos(radians)-radius*Math.cos(entryRadians)*feed,
  angle,
  yaw,
  roll:-2*feed,
  scale:1-.06*(1-arrival),
  opacity:smooth(progress/DIRECT_ENTRANCE.fade),
 };
}

