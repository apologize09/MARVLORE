const clamp=value=>Math.max(0,Math.min(1,value));

// Fade the colour treatment in with the wall, without touching the flight clock.
export function wallToneProgress(morph){
 const t=clamp((morph-.82)/.18);
 return t*t*(3-2*t);
}

// Invert the projected card plane. Its rounded corners and the gaps between
// cards are excluded, rather than treating the whole canvas as one hover area.
export function wallCardHit(quad,point,aspect){
 const [p0,p1,p2,p3]=quad;
 const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
 const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
 const determinant=dx1*dy2-dx2*dy1;
 if(Math.abs(determinant)<1e-8)return null;
 const g=(dx3*dy2-dx2*dy3)/determinant,h=(dx1*dy3-dx3*dy1)/determinant;
 const a=p1.x-p0.x+g*p1.x-point.x*g,b=p3.x-p0.x+h*p3.x-point.x*h;
 const d=p1.y-p0.y+g*p1.y-point.y*g,e=p3.y-p0.y+h*p3.y-point.y*h;
 const x=point.x-p0.x,y=point.y-p0.y,denominator=a*e-b*d;
 if(Math.abs(denominator)<1e-8)return null;
 const u=(x*e-b*y)/denominator,v=(a*y-x*d)/denominator;
 if(u<0||u>1||v<0||v>1)return null;
 const radius=Math.min(aspect,1)*.08;
 const qx=Math.abs(u-.5)*aspect-(aspect*.5-radius),qy=Math.abs(v-.5)-(.5-radius);
 const distance=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-radius;
 if(distance>0)return null;
 return {u,v,z:p0.z+(p1.z-p0.z)*u+(p3.z-p0.z)*v};
}

export function pickWallCard(items,vertex,pointer){
 if(!pointer.active)return -1;
 let selected=-1,depth=-Infinity;
 for(const item of items){
  if(item.pose.alpha<.99||item.pose.weight<.999)continue;
  const quad=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>vertex(item.pose,u,v));
  const hit=wallCardHit(quad,pointer,item.pose.w/item.pose.h);
  if(hit&&hit.z>depth){selected=item.index;depth=hit.z;}
 }
 return selected;
}

// Same cold gray-blue treatment as the work reel, applied to unpremultiplied
// image colour so the existing depth blur, alpha and card geometry stay intact.
export const wallToneFragment=`
vec3 wallTone(vec3 rgb,vec2 uv,float aspect){
 float gray=dot(rgb,vec3(.2126,.7152,.0722));
 vec3 p=clamp(gray*vec3(1.351,1.203,.937),0.0,1.0);
 float c=cos(radians(172.0)),s=sin(radians(172.0));
 vec3 hue=clamp(vec3(
  dot(p,vec3(.213+.787*c-.213*s,.715-.715*c-.715*s,.072-.072*c+.928*s)),
  dot(p,vec3(.213-.213*c+.143*s,.715+.285*c+.140*s,.072-.072*c-.283*s)),
  dot(p,vec3(.213-.213*c-.787*s,.715-.715*c+.715*s,.072+.928*c+.072*s))
 ),0.0,1.0);
 float luminance=dot(hue,vec3(.213,.715,.072));
 vec3 filtered=clamp(mix(vec3(luminance),hue,.55),0.0,1.0)*.94;
 filtered=clamp((filtered-.5)*.97+.5,0.0,1.0);
 float t=clamp((uv.x*aspect*.5+uv.y*.8660254)/(aspect*.5+.8660254),0.0,1.0);
 vec4 mask=mix(vec4(.3882353,.4470588,.5450980,.1882353),vec4(.0901961,.1294118,.1960784,.2392157),t);
 return mix(filtered,mask.rgb,mask.a);
}
`;
