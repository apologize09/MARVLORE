// 同一滚动进度控制卡片、三组文案和最终展开；正向与反向共用同一条路径。
export const clamp01 = n => Math.max(0,Math.min(1,n));
const mix = (a,b,t) => a+(b-a)*t;
const ease = (p,a,b) => {const t=clamp01((p-a)/(b-a));return t*t*t*(10+t*(-15+6*t));};

export function aboutGeometry({width,height,size,drop,groupHeights}){
 const arcHeight=size*1.2+drop;
 const gap=Math.max(24,Math.min(40,height*.042));
 const textHeight=groupHeights.reduce((a,b)=>a+b,0)+gap*2;
 let cursor=-textHeight/2;
 const expandedCenters=groupHeights.map(h=>{const y=cursor+h/2;cursor+=h+gap;return y;});
 const bottomBase=height*.72;
 const topShift=arcHeight*.7;
 const bottomShift=Math.max(150,Math.min(280,height*.25));
 return {width,height,size,drop,arcHeight,gap,textHeight,groupHeights,expandedCenters,bottomBase,topShift,bottomShift,
  tail:Math.max(0,bottomBase+bottomShift+arcHeight-height)+48,runway:height*3.2};
}

export function aboutMotionFrame(progress,g,introProgress=1){
 const p=clamp01(progress),expansion=ease(p,.8,.98);
 const windows=[[-.08,0,.27,.32],[.34,.415,.55,.6],[.62,.695,2,3]];
 const introText=ease(introProgress,.015,.3);
 const groups=windows.map(([start,finish,outStart,outEnd],index)=>{
  const enter=ease(p,start,finish),exit=ease(p,outStart,outEnd);
  const soloOpacity=enter*(1-exit);
  return {opacity:mix(soloOpacity,1,expansion)*introText,
   y:mix(22*(1-enter)-26*exit,g.expandedCenters[index],expansion)+22*(1-introText),
   blur:mix(3*(1-soloOpacity),0,expansion)+3*(1-introText)};
 });
 const rows=[{y:-g.topShift*expansion},{y:g.bottomBase+g.bottomShift*expansion}];
 const cards=[0,1].flatMap(row=>Array.from({length:5},(_,index)=>{
  const order=row?9-index*2:index*2;
  const entry=ease(introProgress,.025*order,.65+.025*order);
  const angle=(-50+25*index)*Math.PI/180;
  const rx=g.width*.38/Math.sin(50*Math.PI/180);
  const x=g.width/2+rx*Math.sin(angle)-g.size/2;
  const curve=g.drop*(1-Math.cos(angle))/(1-Math.cos(50*Math.PI/180));
  const y=row?g.arcHeight-g.size-curve:curve;
  const rotation=(-30+15*index)*(row?-1:1);
  // 参考页的中心聚拢、逐张旋开；图片本身不拉伸。
  const fromX=(g.width-g.size)/2;
  const fromY=g.height/2-rows[row].y-g.size/2+18+order*4;
  return {row,index,order,entry,x:mix(fromX,x,entry),y:mix(fromY,y,entry),
   rotation:mix(-96-order*18,rotation,entry),scale:mix(.18+order*.024,1,entry),opacity:mix(.04,1,entry),
   scatterX:Math.sin(angle)*30,scatterY:(row?1:-1)*(18+Math.abs(Math.sin(angle))*12)};
 }));
 return {progress:p,expansion,groups,rows,cards};
}
