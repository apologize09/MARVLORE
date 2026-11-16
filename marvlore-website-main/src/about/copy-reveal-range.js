// 以整段文案的实际中心为基准，在居中前完成，并为 scrub 缓动预留距离。
export function copyRevealRange(index,count,copyTop,viewportHeight,copyHeight=440){
 const finish=copyTop+copyHeight/2-viewportHeight*.58;
 const total=viewportHeight*.60;
 const fade=count>1?total*.46:total;
 const step=count>1?total*.54/(count-1):0;
 const start=Math.max(0,finish-total+index*step);
 return {start,end:Math.max(start+1,finish-total+index*step+fade)};
}
