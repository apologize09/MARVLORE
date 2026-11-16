// One reversible scroll state; free flight and settled-wall rotation are isolated.
const clamp=value=>Math.max(0,Math.min(1,value));
const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
export function createExplorePlayback({initialFlightTime=0}={}){
 const state={morph:0,velocity:0,requested:0,flightTime:initialFlightTime,captureTime:null,captureVersion:0,wallPhase:0};
 let releaseFlight=true;
 function capture(){
  if(state.captureTime===null&&state.requested>0){state.captureTime=state.flightTime;state.captureVersion++;}
 }
 function release(){
  if(state.morph===0&&state.requested===0&&releaseFlight)state.captureTime=null;
 }
 state.setProgress=(progress,reduced=false,options={})=>{
  state.requested=clamp(progress);releaseFlight=options.releaseFlight??true;capture();
  if(reduced)state.synchronize();
 };
 state.synchronize=()=>{
  // Crossing the whole section offscreen must not leave a half-built wall
  // waiting to play when the user returns from the next section.
  capture();state.morph=state.requested;state.velocity=0;release();
 };
 state.step=(elapsed,{reduced=false,dragging=false}={})=>{
  const dt=Math.max(0,Math.min(elapsed,.1));
  if(state.captureTime===null)state.flightTime+=dt;
  capture();
  const target=state.captureTime===null?0:state.requested;
  if(reduced){state.morph=target;state.velocity=0;}
  else{
   // Analytic critically damped spring: position AND velocity survive reversal.
   const rate=14,offset=state.morph-target,tail=state.velocity+rate*offset,decay=Math.exp(-rate*dt);
   state.morph=target+(offset+tail*dt)*decay;
   state.velocity=(state.velocity-rate*tail*dt)*decay;
   if(state.morph<=0){state.morph=0;state.velocity=Math.max(0,state.velocity);}
   if(state.morph>=1){state.morph=1;state.velocity=Math.min(0,state.velocity);}
   if(Math.abs(state.morph-target)<.0001&&Math.abs(state.velocity)<.001){state.morph=target;state.velocity=0;}
  }
  release();
  if(state.morph===1&&state.requested===1&&!dragging&&!reduced)state.wallPhase=wrap(state.wallPhase+dt*.072);
 };
 state.rotate=delta=>{state.wallPhase=wrap(state.wallPhase+delta);};
 // Keep the wall's current orientation when it starts to disassemble. Never
 // squeeze an accumulated rotation back to zero in a tiny scroll interval.
 Object.defineProperty(state,'rotation',{get:()=>state.wallPhase});
 return state;
}
