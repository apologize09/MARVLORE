const rails=new Map();

// 一次性建立真实弧长表，之后每张卡片只前进固定的路径距离，不再调整队列位置。
export function ellipseRail(radiusX,radiusY,rotation=0,segments=8192){
 const key=[radiusX,radiusY,rotation,segments].join(':');if(rails.has(key))return rails.get(key);
 const angle=rotation*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
 const x=new Float64Array(segments+1),y=new Float64Array(segments+1),lengths=new Float64Array(segments+1);
 let front=0;
 for(let i=0;i<=segments;i++){
  const t=i/segments*Math.PI*2,a=-radiusX*Math.cos(t),b=radiusY*Math.sin(t);
  x[i]=a*cos-b*sin;y[i]=a*sin+b*cos;
  if(i){lengths[i]=lengths[i-1]+Math.hypot(x[i]-x[i-1],y[i]-y[i-1]);if(y[i]>y[front])front=i;}
 }
 const length=lengths[segments];
 const sample=progress=>{
  const distance=((progress%1+1)%1)*length;let low=0,high=segments;
  while(high-low>1){const middle=(low+high)>>1;if(lengths[middle]<=distance)low=middle;else high=middle;}
  const ratio=(distance-lengths[low])/(lengths[high]-lengths[low]);
  return [x[low]+(x[high]-x[low])*ratio,y[low]+(y[high]-y[low])*ratio];
 };
 const rail={sample,length,front:lengths[front]/length};rails.set(key,rail);return rail;
}
