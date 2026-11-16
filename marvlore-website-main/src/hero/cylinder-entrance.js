import { smooth } from './entrance-sequence.js';

const mix=(a,b,t)=>a+(b-a)*t;
const clamp=value=>Math.max(0,Math.min(1,value));
export const CYLINDER_ENTRANCE={delay:1.6,stagger:.045,flight:.8,stackHold:.10,dealDuration:1.55,morph:1.5};
export const CIRCLE_HOLD=0;

export function cylinderIntroTiming(count){
 const assembled=CYLINDER_ENTRANCE.delay+Math.max(0,count-1)*CYLINDER_ENTRANCE.stagger+CYLINDER_ENTRANCE.flight;
 const unfoldStart=assembled+CYLINDER_ENTRANCE.stackHold;
 const circleAt=unfoldStart+CYLINDER_ENTRANCE.dealDuration;
 const morphStart=circleAt+CIRCLE_HOLD;
 return {assembled,unfoldStart,circleAt,morphStart,end:morphStart+CYLINDER_ENTRANCE.morph};
}

export function cylinderIntroClock(time,count){
 const timing=cylinderIntroTiming(count);
 const morph=smooth((time-timing.morphStart)/CYLINDER_ENTRANCE.morph);
 const titleLift=smooth((time-CYLINDER_ENTRANCE.delay)/1.1);
 // Restore the 8% shrink throughout letter reveal and the full title lift.
 const titleScale=(1+.08*(1-smooth(time/(CYLINDER_ENTRANCE.delay+1.1))))*mix(.5,1,titleLift);
 const stage=time<CYLINDER_ENTRANCE.delay?'title':time<timing.unfoldStart?'stack':time<timing.circleAt?'deal':time<timing.morphStart?'circle':time<timing.end?'morph':'cylinder';
 return {...timing,morph,titleLift,titleScale,stage};
}

// All dimensions are in the existing carousel stage's local coordinate space.
// One set of card elements retains its identity through the full 2D-to-3D move.
export function cylinderIntroPose({time,index,count,width,height,centerY=0,cardWidth,cardHeight,radius,angle=0,clock=cylinderIntroClock(time,count)}){
 const sourceWidth=Math.min(cardWidth*.68,width*.28,height*.45);
 const sourceScale=sourceWidth/cardWidth;
 const circleRadius=Math.max(0,Math.min((height-cardHeight*sourceScale)/2,(width-sourceWidth)/2)-16);
 const progress=clamp((time-CYLINDER_ENTRANCE.delay-index*CYLINDER_ENTRANCE.stagger)/CYLINDER_ENTRANCE.flight);
 const arrival=smooth(progress);
 const startX=width/2+sourceWidth*.5+12+index*8;
 const startY=centerY+(index-(count-1)/2)*Math.min(cardHeight*sourceScale*.13,14);
 // 视频中的同一路径追随：从圆环右侧的牌堆出发，前牌顺时针牵引后牌。
 const deal=smooth((time-clock.unfoldStart)/CYLINDER_ENTRANCE.dealDuration);
 // 同一进度驱动整串牌，角间距随展开逐渐增加，牌始终保持前后追随。
 // 终点为 90° - index*step，与 cylinder 的屏幕投影顺序一致。
 const circleAngle=(Math.PI*2.5-index/count*Math.PI*2)*deal;
 const circleX=Math.cos(circleAngle)*circleRadius+index*4*(1-deal);
 const circleY=centerY+Math.sin(circleAngle)*circleRadius-index*2*(1-deal);
 const flatX=mix(startX,circleX,arrival);
 const flatY=mix(startY,circleY,arrival);
 const base=index/count*360;
 const degrees=base+angle;
 const radians=degrees*Math.PI/180;
 const yaw=((base+180)%360+360)%360-180+angle;
 return {
  x:mix(flatX,Math.sin(radians)*radius,clock.morph),
  y:mix(flatY,0,clock.morph),
  z:mix(-index*.05,Math.cos(radians)*radius,clock.morph),
  yaw:yaw*clock.morph,
  roll:mix(-8,mix((index-(count-1)/2)*1.4,0,deal),arrival)*(1-clock.morph),
  scale:mix(mix(sourceScale*.92,sourceScale,arrival),1,clock.morph),
  opacity:smooth(progress/.25),
  circleRadius,
 };
}
