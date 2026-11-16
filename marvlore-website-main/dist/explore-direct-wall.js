// Reversible, sequential landing from the captured paper surface to the wall.
// No intermediate ring, orbit or throwing gate owns a second animation clock.
const CAMERA=1000;
const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{const t=clamp(x);return clamp(t*t*t*(t*(t*6-15)+10));};
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const scale=(a,n)=>a.map(v=>v*n);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
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
const world=p=>[p.x*(CAMERA-p.z)/CAMERA,p.y*(CAMERA-p.z)/CAMERA,p.z];
export const WALL_SCROLL_START=1.05;
export const WALL_SCROLL_END=2.10;
export const WALL_SCROLL_LINK=2.20;
export const WALL_LAND_END=.96;
export const directWallProgress=distance=>clamp((distance-WALL_SCROLL_START)/(WALL_SCROLL_END-WALL_SCROLL_START));
const matrix=q=>{
 const [x,y,z,w]=q;
 return [1-2*(y*y+z*z),2*(x*y+w*z),2*(x*z-w*y),2*(x*y-w*z),1-2*(x*x+z*z),2*(y*z+w*x),2*(x*z+w*y),2*(y*z-w*x),1-2*(x*x+y*y)];
};
const transform=(m,x,y,z)=>[m[0]*x+m[3]*y+m[6]*z,m[1]*x+m[4]*y+m[7]*z,m[2]*x+m[5]*y+m[8]*z];
function surfaceFrame(source){
 const at=world(source.vertex(.5,.5));
 const x=unit(sub(world(source.vertex(.75,.5)),world(source.vertex(.25,.5))));
 const up=unit(sub(world(source.vertex(.5,.25)),world(source.vertex(.5,.75)))),normal=unit(cross(x,up));
 const q=basisq(x,unit(cross(normal,x)),normal);
 return {at,q,matrix:matrix(q)};
}
// Rectangular minimum-cost matching keeps neighbouring floating cards near
// neighbouring seats, instead of sending ID-ordered cards through each other.
function matchSeats(rows,columns,cost){
 const n=rows.length,m=columns.length,u=Array(n+1).fill(0),v=Array(m+1).fill(0),p=Array(m+1).fill(0),way=Array(m+1).fill(0);
 for(let i=1;i<=n;i++){
  p[0]=i;let j0=0;const min=Array(m+1).fill(Infinity),used=Array(m+1).fill(false);
  do{
   used[j0]=true;const i0=p[j0];let delta=Infinity,j1=0;
   for(let j=1;j<=m;j++)if(!used[j]){
    const value=cost(rows[i0-1],columns[j-1])-u[i0]-v[j];
    if(value<min[j]){min[j]=value;way[j]=j0;}
    if(min[j]<delta){delta=min[j];j1=j;}
   }
   for(let j=0;j<=m;j++)if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else min[j]-=delta;
   j0=j1;
  }while(p[j0]!==0);
  do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0);
 }
 return new Map(columns.flatMap((slot,j)=>p[j+1]?[[rows[p[j+1]-1],slot]]:[]));
}

export function createDirectWall(width,height,cards,live){
 const w=clamp(width*.187,152,242)*.8;
 const h=(clamp(width*.138,112,178)+50)*.8;
 const gap=clamp(width*.0075,7,12)*.8,rowGap=clamp(width*.0078,7,12)*.8;
 const radius=1.88*(w+gap)/Math.sin(Math.PI/5);
 function destination(index,rotation=0){
  const angle=(Math.floor(index/3)-2)*Math.PI/10-rotation;
  const a=Math.atan2(Math.sin(angle),Math.cos(angle));
  return {a,at:[radius*Math.sin(a),-(index%3-1)*(h+rowGap),radius*(1-Math.cos(a))*CAMERA/900],alpha:Math.abs(a)<Math.PI/2?1:0};
 }
 // Reuse the previous far-band landing order, mapping the actual floating
 // textures into visible seats before filling offscreen wall columns.
 const targets=cards.map((_,index)=>destination(index));
 function landingOrder(rotation=0){
  const poses=cards.map((_,index)=>destination(index,rotation));
  const slots=poses.map((p,index)=>({p,index})).filter(({p})=>p.alpha&&Math.abs(p.at[0]*CAMERA/(CAMERA-p.at[2]))<width*.65).map(({index})=>index);
  const gate=[-width*.45,-height*.3];
  const distance=index=>Math.hypot(poses[index].at[0]-gate[0],poses[index].at[1]-gate[1]);
  const far=Math.max(...slots.map(distance)),band=index=>Math.floor((far-distance(index))/(h*.9));
  const angle=index=>Math.atan2(poses[index].at[1]-gate[1],poses[index].at[0]-gate[0]);
  return slots.sort((a,b)=>band(a)-band(b)||(band(a)%2?-1:1)*(angle(a)-angle(b))||a-b);
 }
 const visible=landingOrder();
 let scheduleAngle=0,schedule=new Map(visible.map((slot,rank)=>[slot,rank]));
 const sourceVisible=item=>[[0,0],[.5,0],[1,0],[0,.5],[.5,.5],[1,.5],[0,1],[.5,1],[1,1]].some(([u,v])=>{const p=item.vertex(u,v);return p.alpha>.001&&Math.abs(p.x)<width*.65&&Math.abs(p.y)<height*.65;});
 const sources=[...live.keys()].sort((a,b)=>Number(sourceVisible(live.get(b)))-Number(sourceVisible(live.get(a)))||a-b);
 const selected=sources.slice(0,visible.length);
 const projected=index=>{const point=targets[index].at,k=CAMERA/(CAMERA-point[2]);return [point[0]*k,point[1]*k];};
 const centres=new Map(sources.map(index=>[index,live.get(index).vertex(.5,.5)]));
 const assigned=matchSeats(selected,visible,(index,slot)=>{
  const source=centres.get(index),target=projected(slot);
  return ((source.x-target[0])/width)**2+((source.y-target[1])/height)**2;
 });
 const freeSlots=cards.map((_,i)=>i).filter(i=>![...assigned.values()].includes(i));
 const unassigned=[...sources.filter(i=>!assigned.has(i)),...cards.map((_,i)=>i).filter(i=>!live.has(i))];
 unassigned.forEach((index,rank)=>assigned.set(index,freeSlots[rank]));
 const order=new Map(visible.map((slot,rank)=>[slot,rank]));
 const duration=.38;
 const entries=cards.map((_,index)=>{
  const source=live.get(index),slot=assigned.get(index),target=destination(slot);
  const side=target.at[0]<0?-1:1;
  const outside=[side*(width/2+w*(1.6+index%3*.15))*1.16,target.at[1]*1.3,-160];
  const delay=order.has(slot)?order.get(slot)/Math.max(1,visible.length-1)*(1-duration):0;
  return {index,slot,source,outside,sourceFrame:source?surfaceFrame(source):null,cast:order.has(slot),delay,duration:order.has(slot)?duration:.4};
 });
 function project(at,alpha,blur){
  const k=CAMERA/Math.max(30,CAMERA-at[2]);
  return{x:at[0]*k,y:at[1]*k,z:at[2],alpha,blur};
 }
 function wallVertex(target,u,v){
  const x=(u-.5)*w,y=(.5-v)*h;
  return[target.at[0]+Math.cos(target.a)*x,target.at[1]+y,target.at[2]+Math.sin(target.a)*x*CAMERA/900];
 }
 return {
  frame(progress,rotation=0){
   const travel=clamp(progress/WALL_LAND_END);
   if(travel<1&&Math.abs(rotation-scheduleAngle)>1e-9){
    const slots=landingOrder(rotation);schedule=new Map(slots.map((slot,rank)=>[slot,rank]));scheduleAngle=rotation;
   }
   return entries.map(entry=>{
    // After a dwell/drag the visible columns have changed. Reuse their current
    // seats but keep the sequential departure on the return, rather than
    // peeling every newly-visible column away at the same instant.
    const rank=schedule.get(entry.slot),cast=rank!==undefined;
    const delay=cast?rank/Math.max(1,schedule.size-1)*(1-duration):0;
    const span=cast?duration:.4;
    const t=clamp((travel-delay)/span),weight=smooth(t);
    const target=destination(entry.slot,rotation);
    // Waiting cards continue their captured flight along this reversible
    // timeline; they never freeze in midair until their stagger begins.
    const source=entry.source?.sample?.(travel*.8)||entry.source;
    const from=source?(entry.source.sample?surfaceFrame(source):entry.sourceFrame):{at:entry.outside,q:[0,0,0,1],matrix:matrix([0,0,0,1])};
    const sourceAlpha=source?source.vertex(.5,.5).alpha:1;
    const landing=target.alpha?target.at:[entry.outside[0],entry.outside[1],0];
    const at=from.at.map((x,i)=>mix(x,landing[i],weight));
    const q=slerp(from.q,[0,-Math.sin(target.a/2),0,Math.cos(target.a/2)],weight);
    return{index:entry.index,pose:{entry,target,source,from,matrix:matrix(q),weight,t,w:mix(source?.f.size||w,w,weight),h:mix(source?.f.size||h,h,weight),at,alpha:mix(sourceAlpha,target.alpha,weight),mesh:source?.vertex,meshWeight:1-weight}};
   }).sort((a,b)=>a.pose.at[2]-b.pose.at[2]);
  },
  vertex(p,u,v){
   const {entry,target,source,from,weight,t}=p;
   if(weight===1)return project(wallVertex(target,u,v),target.alpha,0);
   const sample=source?.vertex(u,v);
   if(sample&&weight===0)return sample;
   let x=(u-.5)*p.w,y=(.5-v)*p.h,z=0;
   if(sample){
    const point=sub(world(sample),from.at),m=from.matrix;
    // Carry the paper's remaining curvature in its own rotating local frame.
    x+=(dot(point,m.slice(0,3))-(u-.5)*source.f.size)*(1-weight);
    y+=(dot(point,m.slice(3,6))-(.5-v)*source.f.size)*(1-weight);
    z=dot(point,m.slice(6,9))*(1-weight);
   }
   const local=transform(p.matrix,x,y,z);local[2]*=mix(1,CAMERA/900,weight);
   const point=add(p.at,local);
   const alpha=target.alpha?mix(sample?.alpha??1,1,weight):(sample?.alpha??1)*(1-smooth(t/.7));
   return project(point,alpha,(sample?.blur||0)*(1-weight));
  }
 };
}
