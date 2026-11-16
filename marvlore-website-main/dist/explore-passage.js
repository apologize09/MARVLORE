// Premotio hero passage, inspected at https://premotio.com/.
// Keep its radial planes, gathering schedule, common gate, and velocity-matched
// throws. Only the destination is MARVLORE's existing three-row curved wall.
const TAU=Math.PI*2, CAMERA=1000, FLY=.16;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const scale=(a,n)=>a.map(v=>v*n);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const smooth=t=>{t=clamp(t);return t*t*t*(t*(6*t-15)+10);};
const smoother=t=>{t=clamp(t);return t**4*(35-84*t+70*t*t-20*t**3);};
const turnTo=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const qmul=(a,b)=>[
 a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
 a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
 a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
 a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
];
const inverse=q=>[-q[0],-q[1],-q[2],q[3]];
const axisq=v=>{const a=Math.hypot(...v);return a<1e-9?[0,0,0,1]:[...scale(v,Math.sin(a/2)/a),Math.cos(a/2)];};
const rotate=(q,v)=>{const a=cross(q.slice(0,3),v),b=cross(q.slice(0,3),a);return add(v,add(scale(a,2*q[3]),scale(b,2)));};
function slerp(a,b,t){
 let d=dot(a,b);if(d<0){b=scale(b,-1);d=-d;}
 const angle=Math.acos(clamp(d,-1,1)),s=Math.sin(angle);
 return s<1e-6?unit(a.map((v,i)=>mix(v,b[i],t))):a.map((v,i)=>(v*Math.sin((1-t)*angle)+b[i]*Math.sin(t*angle))/s);
}
function basisq(x,y,z){
 const trace=x[0]+y[1]+z[2];
 if(trace>0){const s=.5/Math.sqrt(1+trace);return[(y[2]-z[1])*s,(z[0]-x[2])*s,(x[1]-y[0])*s,.25/s];}
 if(x[0]>y[1]&&x[0]>z[2]){const s=2*Math.sqrt(1+x[0]-y[1]-z[2]);return[.25*s,(y[0]+x[1])/s,(z[0]+x[2])/s,(y[2]-z[1])/s];}
 if(y[1]>z[2]){const s=2*Math.sqrt(1+y[1]-x[0]-z[2]);return[(y[0]+x[1])/s,.25*s,(z[1]+y[2])/s,(z[0]-x[2])/s];}
 const s=2*Math.sqrt(1+z[2]-x[0]-y[1]);return[(z[0]+x[2])/s,(z[1]+y[2])/s,.25*s,(x[1]-y[0])/s];
}
// The original quintic Hermite retains position, velocity, and acceleration.
function hermite(x,v,a,target,t){
 t=clamp(t);const t2=t*t,t3=t2*t,t4=t3*t,t5=t4*t;
 return x*(1-10*t3+15*t4-6*t5)+v*(t-6*t3+8*t4-3*t5)+a*(.5*t2-1.5*t3+1.5*t4-.5*t5)+target*(10*t3-15*t4+6*t5);
}
const tail=t=>{t=clamp(t);return-4*t**3+7*t**4-3*t**5;};
const spinTime=t=>{const x=clamp(t/.25);return .25*(x-(x**6-3*x**5+2.5*x**4));};
function schedule(count){
 const step=TAU/count,start=.04,end=.34,ramp=.2*(end-start);
 const delta=(.78-end)/(count-1+8),slide=8*delta,constantAt=end+slide;
 const gathering=TAU*.5/(end-start-ramp/2),cruise=step/delta;
 const integrated=t=>t*t*t-t*t*t*t/2;
 function turn(p){
  if(p<=start)return 0;
  if(p<=start+ramp)return gathering*ramp*integrated((p-start)/ramp);
  let a=gathering*(ramp/2+Math.min(p,end)-start-ramp);
  if(p<=end)return a;
  a+=gathering*(Math.min(p,constantAt)-end)+(cruise-gathering)*slide*integrated(Math.min(1,(p-end)/slide));
  if(p<=constantAt)return a;
  a+=cruise*(Math.min(p,.78)-constantAt);
  if(p<=.78)return a;
  const t=Math.min(1,(p-.78)/slide);return a+cruise*slide*(t-integrated(t));
 }
 const pace=p=>(turn(p+1e-6)-turn(p-1e-6))/2e-6;
 const gateIndex=Math.round((Math.PI/2-turn(constantAt))/step),gate=gateIndex*step+turn(constantAt);
 const order=Array.from({length:count},(_,i)=>((gateIndex-i)%count+count)%count);
 const slides=[],lets=[];order.forEach((slot,rank)=>{slides[slot]=end+rank*delta;lets[slot]=constantAt+rank*delta;});
 return{turn,pace,gate,slides,lets,order,sets:Array.from({length:count},(_,i)=>.05+.16*i/(count-1)),step};
}
const world=point=>{const k=(CAMERA-point.z)/CAMERA;return[point.x*k,point.y*k,point.z];};

export function createPassage(width,height,cards,live){
 const radius=Math.min(width*.4,height*.32,CAMERA/2.6);
 const tilt=22*Math.PI/180,axis=[0,Math.cos(tilt),Math.sin(tilt)],front=[0,-Math.sin(tilt),Math.cos(tilt)],side=[1,0,0];
 const ringWidth=radius*.5,ringRadius=radius*.75;
 const cardW=clamp(width*.187,152,242)*.8,cardH=(clamp(width*.138,112,178)+50)*.8;
 const aspect=cardW/cardH,gap=clamp(width*.0075,7,12)*.8,rowGap=clamp(width*.0078,7,12)*.8;
 const wallRadius=1.88*(cardW+gap)/Math.sin(Math.PI/5);
 const radial=a=>add(scale(front,Math.cos(a)),scale(side,Math.sin(a)));
 const ringPose=(seat,p,r=ringRadius)=>{const a=seat*s.step+s.turn(p),x=radial(a);return{at:scale(x,r),q:basisq(x,axis,cross(x,axis)),w:ringWidth,h:ringWidth/aspect,blur:.002,alpha:1,bend:0};};
 const targetAt=(index,rotation=0)=>{
  let a=(Math.floor(index/3)-2)*Math.PI/10-rotation;a=Math.atan2(Math.sin(a),Math.cos(a));
  return{at:[wallRadius*Math.sin(a),-(index%3-1)*(cardH+rowGap),wallRadius*(1-Math.cos(a))*CAMERA/900],q:axisq([0,-a,0]),w:cardW,h:cardH,depthScale:CAMERA/900,alpha:Math.abs(a)<Math.PI/2?1:0,blur:0,bend:0};
 };
 const targets=cards.map((_,i)=>targetAt(i));
 // Original casts visible destination sheets only, not the rear columns.
 const active=targets.map((p,i)=>({p,i})).filter(({p})=>p.alpha && Math.abs(p.at[0]*CAMERA/(CAMERA-p.at[2]))<width*.65).map(({i})=>i);
 // A curved sheet can have a visible edge even when its centre is transparent.
 for(const [index,item]of live){const visible=[[0,0],[.5,0],[1,0],[0,.5],[.5,.5],[1,.5],[0,1],[.5,1],[1,1]].some(([u,v])=>{const p=item.vertex(u,v);return p.alpha>.001&&Math.abs(p.x)<width*.65&&Math.abs(p.y)<height*.65;});if(visible&&!active.includes(index))active.push(index);}
 const count=active.length,s=schedule(count);
 // Keep texture identity from free flight to the wall. Unseen sheets begin
 // beyond the viewport, never materialize in the middle of the gathering ring.
 const entries=active.map((index,rank)=>{
  const item=live.get(index),theta=rank*s.step+s.turn(s.sets[rank]);
  if(!item){
   const screenAngle=rank*s.step;
   const reach=Math.max(width,height)*1.25;
   return{index,source:{at:[Math.cos(screenAngle)*reach,Math.sin(screenAngle)*reach,-100],q:ringPose(rank,s.sets[rank]).q,w:ringWidth,h:ringWidth/aspect,alpha:1,blur:.006,bend:0}};
  }
  const centre=world(item.vertex(.5,.5)),x=unit(sub(world(item.vertex(.75,.5)),world(item.vertex(.25,.5)))),up=unit(sub(world(item.vertex(.5,.25)),world(item.vertex(.5,.75)))),z=unit(cross(x,up));
  const p=item.vertex(.5,.5);
  return{index,source:{at:centre,q:basisq(x,unit(cross(z,x)),z),w:item.f.size,h:item.f.size,alpha:p.alpha,blur:p.blur,bend:item.pose.bend||0,mesh:item.vertex,meshWeight:1}};
 });
 const available=new Set(Array.from({length:count},(_,i)=>i));
 const sorted=[...entries].sort((a,b)=>Math.atan2(a.source.at[0],dot(a.source.at,front))-Math.atan2(b.source.at[0],dot(b.source.at,front)));
 for(const entry of sorted){
  const angle=Math.atan2(entry.source.at[0],dot(entry.source.at,front));
  let seat=-1,cost=Infinity;
  for(const n of available){const d=Math.abs(turnTo(angle,n*s.step+s.turn(s.sets[n])));if(d<cost){seat=n;cost=d;}}
  entry.seat=seat;available.delete(seat);
  entry.angle=angle;entry.out=Math.hypot(entry.source.at[0],dot(entry.source.at,front));entry.up=dot(entry.source.at,axis);
  const intended=seat*s.step+s.turn(s.sets[seat]);entry.angle+=TAU*Math.round((intended-entry.angle)/TAU);
  const half=ringWidth*Math.hypot(1,1/aspect)/2+14;
  const clear=Math.max(radius+half,half/Math.sin(4*Math.PI/count));
  const needed=(Math.max(entry.out,clear)-clear)/(Math.max(entry.out,clear)-ringRadius);
  let lo=0,hi=1;for(let n=0;n<40;n++){let m=(lo+hi)/2;if(smoother(m)<needed)lo=m;else hi=m;}
  entry.latch=Math.max(.35,hi);
 }
 // Reference z_: fill farther destination bands first in alternating angular order.
 const gatePreview=scale(radial(s.gate),radius+ringWidth/2+14);
 const distance=i=>Math.hypot(targets[i].at[0]-gatePreview[0],targets[i].at[1]-gatePreview[1]);
 const far=Math.max(...active.map(distance)),band=i=>Math.floor((far-distance(i))/(cardH*.9));
 const angle=i=>Math.atan2(targets[i].at[1]-gatePreview[1],targets[i].at[0]-gatePreview[0]);
 const landing=[...active].sort((a,b)=>targets[b].alpha-targets[a].alpha||band(a)-band(b)||(band(a)%2?-1:1)*(angle(a)-angle(b))||a-b);
 const destination=new Map();
 for(const entry of entries)destination.set(entry.index,landing[s.order.indexOf(entry.seat)]);
 const finalTarget=(index,rotation=0)=>targetAt(destination.get(index)??index,rotation);
 // One exit point for all cards, with the original tangential momentum.
 const gateDirection=radial(s.gate),tangent=add(scale(front,-Math.sin(s.gate)),scale(side,Math.cos(s.gate)));
 const outer=radius+ringWidth/2+14,exitSpeed=s.pace(s.lets[s.order[1]]);
 const thrown={at:scale(gateDirection,outer),velocity:scale(tangent,outer*exitSpeed),curve:scale(gateDirection,-outer*exitSpeed**2),q:basisq(gateDirection,axis,cross(gateDirection,axis)),spin:scale(axis,exitSpeed)};
 function gather(entry,p){
  const seat=entry.seat,t=clamp((p-s.sets[seat])/.13),t7=smoother(t),ring=ringPose(seat,p);
  // Angular Hermite catches the moving ring instead of cutting across it.
  const latch=entry.latch,local=clamp(t/latch),catchAt=s.sets[seat]+latch*.13;
  const endAngle=seat*s.step+s.turn(catchAt),v=s.pace(catchAt)*.13*latch,a=(s.pace(catchAt+1e-4)-s.pace(catchAt-1e-4))/2e-4*(.13*latch)**2;
  const angle=t<latch?hermite(entry.angle,0,0,endAngle,local)+v*tail(local)+a*(.5*local**3-local**4+.5*local**5):seat*s.step+s.turn(p);
  const at=add(scale(radial(angle),mix(entry.out,ringRadius,t7)),scale(axis,entry.up*(1-t7)));
  return{...ring,at,q:slerp(entry.source.q,ring.q,smoother(t/latch)),w:mix(entry.source.w,ring.w,t7),h:mix(entry.source.h,ring.h,t7),alpha:mix(entry.source.alpha,1,t7),blur:entry.source.blur*(1-t7)+.002,bend:entry.source.bend*(1-t7),mesh:entry.source.mesh,meshWeight:1-t7,source:entry.source};
 }
 function throwTo(entry,p,rotation=0){
  const target=finalTarget(entry.index,rotation),r=clamp((p-s.lets[entry.seat])/FLY);
  if(!target.alpha){
   // Rear columns of the final wall are not in the camera frustum. Continue
   // through the same gate until fully off-screen, rather than crossing it.
   return{...ringPose(entry.seat,s.lets[entry.seat]),at:add(thrown.at,scale(thrown.velocity,FLY*r)),q:qmul(axisq(scale(thrown.spin,FLY*spinTime(r))),thrown.q),alpha:1};
  }
  // A common landing plane, matching J_, then continuously shaped into our wall.
  const from=thrown.at,v=scale(thrown.velocity,FLY),a=scale(thrown.curve,FLY*FLY);
  const planar=[0,1].map(i=>hermite(from[i],v[i]*.65,a[i]*.65*.65,target.at[i],r/.65));
  const middle=from[2]*.3,exit=-middle/(1-.55);
  const baseDepth=r<.55?hermite(from[2],v[2]*.55,a[2]*.55*.55,middle,r/.55)+exit*.55*tail(r/.55):hermite(middle,exit*(1-.55),0,0,(r-.55)/(1-.55));
  const depth=baseDepth+target.at[2]*smooth(r);
  const inertia=t=>axisq(scale(thrown.spin,FLY*t));
  const correction=qmul(target.q,inverse(qmul(inertia(spinTime(1)),thrown.q)));
  const q=qmul(slerp([0,0,0,1],correction,smooth(r/.55)),qmul(inertia(spinTime(r)),thrown.q));
  const weight=smooth(r/.65),w=mix(ringWidth,target.w,weight),h=mix(ringWidth/aspect,target.h,weight);
  const bend=0;
  return{...target,at:[...planar,depth],q,w,h,bend,depthScale:mix(1,target.depthScale||1,smooth(r)),alpha:target.alpha?1:1-smooth(r/.65),blur:.002*(1-weight)};
 }
 function pose(entry,p,rotation=0){
  const seat=entry.seat;
  if(p<=s.sets[seat])return entry.source;
  if(p<s.sets[seat]+.13)return gather(entry,p);
  if(p<=s.slides[seat])return ringPose(seat,p);
  if(p<s.lets[seat])return ringPose(seat,p,mix(ringRadius,outer,smooth((p-s.slides[seat])/(s.lets[seat]-s.slides[seat]))));
  if(p<s.lets[seat]+FLY)return throwTo(entry,p,rotation);
  return finalTarget(entry.index,rotation);
 }
 // Original velocity-driven paper response, sampled on the scroll timeline.
 // A damped spring makes bend/half-wave follow motion rather than a keyframe.
 const STEPS=200, stride=7, paper=new Float32Array((STEPS+1)*count*stride),states=[];
 const spring=(x,v,target,dt)=>{const rate=Math.abs(target)>Math.abs(x)?10:5,a=x-target,b=v+rate*a,e=Math.exp(-rate*dt);return[target+(a+b*dt)*e,(v-rate*b*dt)*e];};
 for(let step=0;step<=STEPS;step++)for(let i=0;i<count;i++){
  const p=pose(entries[i],step/STEPS),previous=states[i],dt=3/STEPS;
  let bend=0,bends=0,flutter=0,flutters=0,axisAngle=0,phase=0;
  if(previous){
   const velocity=scale(sub(p.at,previous.at),1/dt),speed=Math.hypot(...velocity);
   const normal=dot(velocity,rotate(p.q,[0,0,1])),vx=dot(velocity,rotate(p.q,[1,0,0])),vy=dot(velocity,rotate(p.q,[0,1,0]));
   [bend,bends]=spring(previous.bend,previous.bends,Math.tanh(-normal/2400)*1.1,dt);
   [flutter,flutters]=spring(previous.flutter,previous.flutters,Math.tanh(speed/2400)*.05,dt);
   const aim=Math.hypot(vx,vy)>.3*Math.abs(normal)&&speed>1?Math.atan2(vy,vx):0;
   axisAngle=previous.axis+Math.atan(Math.tan(aim-previous.axis))*(1-Math.exp(-dt*4));
   phase=previous.phase+dt*(6+12*Math.min(1,speed/2400));
  }
  states[i]={at:p.at,bend,bends,flutter,flutters,axis:axisAngle,phase};
  const at=(step*count+i)*stride;paper.set([bend,bends,flutter,flutters,axisAngle,phase,0],at);
 }
 function withPaper(p,index,progress){
  const f=clamp(progress)*STEPS,a=Math.min(STEPS-1,Math.floor(f)),t=f-a;
  const at=(a*count+index)*stride,next=at+count*stride;
  const entry=entries[index];const rest=1-smooth((progress-s.lets[entry.seat]-FLY*.75)/(FLY*.25));
  return{...p,bend:p.bend+mix(paper[at],paper[next],t)*rest,flutter:mix(paper[at+2],paper[next+2],t)*rest,paperAxis:mix(paper[at+4],paper[next+4],t),phase:mix(paper[at+5],paper[next+5],t)};
 }
 function project(p,u,v){
  if(p.mesh&&p.meshWeight>=.9999)return p.mesh(u,v);
  const x=(u-.5)*p.w,y=(.5-v)*p.h,axis=p.paperAxis||0,c=Math.cos(axis),sine=Math.sin(axis);
  const across=x*c+y*sine,length=-x*sine+y*c,bend=p.bend||0,r=Math.abs(bend)>1e-4?p.w/bend:0;
  const bent=r?r*Math.sin(across/r):across,z=(r?r*(1-Math.cos(across/r)):0)+(p.flutter||0)*p.h*Math.sin(length*Math.PI/Math.max(p.w,p.h)+(p.phase||0));
  const bx=bent*c-length*sine,by=bent*sine+length*c,m=p.matrix;
  let at=[p.at[0]+m[0]*bx+m[3]*by+m[6]*z,p.at[1]+m[1]*bx+m[4]*by+m[7]*z,p.at[2]+(m[2]*bx+m[5]*by+m[8]*z)*(p.depthScale||1)],alpha=p.alpha,blur=p.blur;
  if(p.mesh&&p.meshWeight>0){
   const sample=p.mesh(u,v),original=world(sample),source=p.source||p;
   const sx=(u-.5)*source.w,sy=(.5-v)*source.h,sz=(source.bend||0)*sx*sx/source.w;
   const flat=add(source.at,rotate(source.q,[sx,sy,sz]));
   at=add(at,scale(sub(original,flat),p.meshWeight));
   alpha=mix(p.alpha,sample.alpha,p.meshWeight);blur=mix(p.blur,sample.blur,p.meshWeight);
  }
  const k=CAMERA/Math.max(30,CAMERA-at[2]);
  return{x:at[0]*k,y:at[1]*k,z:at[2],alpha,blur};
 }
 return{frame(progress,rotation=0){return (progress>=1?cards.map((_,index)=>({index})):entries).map((entry,rank)=>{
  const p=progress>=1?finalTarget(entry.index,rotation):withPaper(pose(entry,progress,rotation),rank,progress),[x,y,z,w]=p.q;
  p.matrix=[1-2*(y*y+z*z),2*(x*y+w*z),2*(x*z-w*y),2*(x*y-w*z),1-2*(x*x+z*z),2*(y*z+w*x),2*(x*z+w*y),2*(y*z-w*x),1-2*(x*x+y*y)];
  return{index:entry.index,pose:p};
 }).concat(progress<1&&progress>.8?cards.map((_,index)=>index).filter(index=>!active.includes(index)).map(index=>{const p=finalTarget(index,rotation),[x,y,z,w]=p.q;p.alpha*=smooth((progress-.8)/.2);p.matrix=[1-2*(y*y+z*z),2*(x*y+w*z),2*(x*z-w*y),2*(x*y-w*z),1-2*(x*x+z*z),2*(y*z+w*x),2*(x*z+w*y),2*(y*z-w*x),1-2*(x*x+y*y)];return {index,pose:p};}):[]).sort((a,b)=>a.pose.at[2]-b.pose.at[2]);},vertex:project};
}
