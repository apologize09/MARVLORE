import Matter from 'matter-js';

const {Engine,Bodies,Body,Composite,Sleeping,Query,Events}=Matter;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const TAG_STEP=1000/120;

// CSS sizes are the real rendered sizes, including the service-tag scale.
export function createTagPhysics({sizes,width,height,spawnOffset,random=Math.random}){
 const engine=Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:8});
 engine.gravity.y=1.2;
 const shuffle=()=>{const a=sizes.map((_,i)=>i);for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const order=shuffle(),slots=shuffle(),times=[];
 let at=0;for(let i=0;i<sizes.length;i++){times.push(at);at+=35+random()*70;}
 const walls=[
  // 物理轮廓比显示元素略小；地面顶部留出 2px，让视觉底缘贴合屏幕。
  Bodies.rectangle(width/2,height+43,width+200,90,{isStatic:true,friction:.9,frictionStatic:1}),
  Bodies.rectangle(-28,height/2,100,(spawnOffset+height)*4,{isStatic:true}),
  Bodies.rectangle(width+28,height/2,100,(spawnOffset+height)*4,{isStatic:true})
 ];
 Composite.add(engine.world,walls);
 const bodies=sizes.map(({width:w,height:h},i)=>{
  const x=clamp((slots[i]+.5)/sizes.length*width+(random()-.5)*width*.08,w/2+22,width-w/2-22);
  const y=-spawnOffset-h/2-20-random()*130;
  const body=Bodies.rectangle(x,y,w*.98,h*.96,{chamfer:{radius:Math.min(h*.35,w*.2)},restitution:.25,friction:.68,frictionStatic:.9,frictionAir:.022,density:.0012,slop:.02});
  Body.setAngle(body,(random()*8-4)*Math.PI/180);
  body.plugin.releaseAt=times[order[i]];body.plugin.released=false;
  body.plugin.impact={value:0,velocity:0,axisX:0};
  body.plugin.previous={x,y,angle:body.angle,squash:0};
  return body;
 });
 Events.on(engine,'collisionStart',event=>{
  for(const pair of event.pairs){
   const a=pair.collision.parentA,b=pair.collision.parentB,n=pair.collision.normal;
   const va=a.isStatic?{x:0,y:0}:Body.getVelocity(a),vb=b.isStatic?{x:0,y:0}:Body.getVelocity(b);
   const speed=Math.abs((va.x-vb.x)*n.x+(va.y-vb.y)*n.y);
   if(speed<.65)continue;
   for(const body of [a,b]){if(!body.plugin.impact||body.isStatic)continue;
    const localAngle=Math.atan2(n.y,n.x)-body.angle;
    body.plugin.impact.axisX=Math.cos(localAngle)**2;
    body.plugin.impact.velocity=Math.min(body.plugin.impact.velocity,-clamp((speed-.65)*.34,0,2.25));
   }
  }
 });
 let elapsed=0,accumulator=0;
 function step(){
  elapsed+=TAG_STEP;
  const live=bodies.filter(b=>b.plugin.released);
  for(const body of bodies){
   if(body.plugin.released||elapsed<body.plugin.releaseAt)continue;
   // Waiting outside the screen avoids initial collision impulses and teleports.
   if(Query.collides(body,live).length)continue;
   body.plugin.released=true;Composite.add(engine.world,body);Sleeping.set(body,false);
   Body.setVelocity(body,{x:0,y:6.3});live.push(body);
  }
  const previousVelocity=new Map();
  for(const body of live){body.plugin.previous={x:body.position.x,y:body.position.y,angle:body.angle,squash:body.plugin.impact.value};previousVelocity.set(body,{...body.velocity});}
  Engine.update(engine,TAG_STEP);
  for(const body of live){
   const impact=body.plugin.impact,dt=TAG_STEP/1000;
   impact.velocity+=(-110*impact.value-15*impact.velocity)*dt;
   impact.value=clamp(impact.value+impact.velocity*dt,-.10,.04);
   if(Math.abs(impact.value)<.00005&&Math.abs(impact.velocity)<.001){impact.value=0;impact.velocity=0;}
   if(body.isStatic||body.isSleeping)continue;
   const before=previousVelocity.get(body),v=body.velocity;
   // Contacts may slow a falling tag immediately; downward acceleration stays bounded.
   const vx=clamp(v.x,-1.1,1.1),vy=Math.min(v.y,14.4,before.y+.22);
   if(vx!==v.x||vy!==v.y)Body.setVelocity(body,{x:vx,y:vy});
   if(Math.abs(body.angle)>.38){Body.setAngle(body,clamp(body.angle,-.38,.38));Body.setAngularVelocity(body,0);}
  }
 }
 return {engine,bodies,
  advance(delta){accumulator+=Math.min(Math.max(delta,0),1000/30);while(accumulator+1e-7>=TAG_STEP){step();accumulator=Math.max(0,accumulator-TAG_STEP);}return accumulator/TAG_STEP;},
  destroy(){Composite.clear(engine.world,false);Engine.clear(engine);}
 };
}
