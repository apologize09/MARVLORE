// Lens response in CSS pixels, independent of render resolution and frame rate.
export const passageOptics={farBlur:34,sharpRange:.16,shutter:1/60,maxTravel:16,maxUvTravel:.12};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export function edgeOpacity(facing,weight=1){
 const t=clamp((Math.abs(facing)-.04)/.26);
 return 1-clamp(weight)*(1-t*t*(3-2*t));
}
export function depthDefocus(z,focusZ){
 const distance=clamp((focusZ-z)/Math.max(1,2*focusZ));
 const t=clamp((distance-passageOptics.sharpRange)/(1-passageOptics.sharpRange));
 return passageOptics.farBlur*(t*t*(3-2*t))**1.25;
}

// Invert the projected surface Jacobian so the shutter follows screen motion
// even on a rotated sheet. A near edge-on sheet must never produce a huge UV.
export function motionVectorUV(dx,dy,dt,duX,duY,dvX,dvY,weight=1,out=[0,0]){
 out[0]=out[1]=0;
 if(!(dt>0&&dt<=.08)||weight<=0||Math.hypot(dx,dy)>250)return out;
 const det=duX*dvY-duY*dvX;
 const area=Math.hypot(duX,duY)*Math.hypot(dvX,dvY);
 if(area<1||Math.abs(det)/area<.025)return out;
 let x=dx/dt*passageOptics.shutter,y=dy/dt*passageOptics.shutter;
 const screenLimit=Math.min(1,passageOptics.maxTravel/Math.max(.001,Math.hypot(x,y)));
 x*=screenLimit;y*=screenLimit;
 const u=(x*dvY-y*dvX)/det,v=(duX*y-duY*x)/det;
 const uvLimit=Math.min(1,passageOptics.maxUvTravel/Math.max(.001,Math.hypot(u,v)))*clamp(weight);
 out[0]=u*uvLimit;out[1]=v*uvLimit;return out;
}
