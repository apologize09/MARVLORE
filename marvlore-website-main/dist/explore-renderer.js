import {makeFlight,flightPose,sheetVertex,RELEASE_INTERVAL,clamp} from './explore-flight.js';
import {createDirectWall} from './explore-direct-wall.js?v=fluid-wall-146';
import {createGaussianBuilder,gaussianSigmas} from './explore-gaussian.js';
import {wallToneProgress,pickWallCard,wallToneFragment} from './wall-tone.js?v=wall-tone-160';
import {coverImageScale} from './cover-framing.js?v=cover-edges-164';

const VERTEX=`
attribute vec2 aPosition;
attribute vec2 aUv;
attribute vec2 aLook;
attribute float aDepth;
varying vec2 vUv;
varying vec2 vLook;
void main(){vUv=aUv;vLook=aLook;gl_Position=vec4(aPosition,aDepth,1.0);}
`;
const FRAGMENT=`
precision highp float;
uniform sampler2D uImage;
uniform float uImageAspect;
uniform float uCardAspect;
uniform float uDepthWeight;
uniform float uDepthSigma;
uniform float uWallTone;
uniform sampler2D uBlur1;
uniform sampler2D uBlur2;
uniform sampler2D uBlur3;
uniform sampler2D uBlur4;
uniform sampler2D uBlur5;
uniform vec4 uGaussianLevels;
uniform float uGaussianLast;
varying vec2 vUv;
varying vec2 vLook;
${wallToneFragment}
float maskAt(vec2 uv){
  float radius=min(uCardAspect,1.0)*.08;
  vec2 q=abs(uv-.5)*vec2(uCardAspect,1.0)-(vec2(uCardAspect,1.0)*.5-radius);
  float d=length(max(q,0.0))+min(max(q.x,q.y),0.0)-radius;
  return 1.0-smoothstep(-.003,.003,d);
}
vec4 picture(vec2 uv){
 vec2 crop=uImageAspect>uCardAspect?vec2(uCardAspect/uImageAspect,1.0):vec2(1.0,uImageAspect/uCardAspect);
 return texture2D(uImage,clamp((uv-.5)*crop+.5,0.0,1.0))*maskAt(uv);
}
vec4 originalPicture(vec2 uv){
  float blur=vLook.x;
  if(blur<.003){vec4 c=picture(uv);if(c.a<.01)return vec4(0.0);return vec4(c.rgb*c.a*vLook.y,c.a*vLook.y);}
  vec2 split=vec2(0.0,blur*.8);
  vec3 rgb=vec3(0.0);
  vec3 alphas=vec3(0.0);
  float total=0.0;
  // Distributed samples blur the actual image and its silhouette, not a clone.
  for(int i=0;i<12;i++){
    float fi=float(i);
    float radius=sqrt((fi+.5)/12.0);
    float angle=fi*2.39996323;
    vec2 sampleAt=uv+vec2(cos(angle)*.65,sin(angle))*radius*blur;
    float weight=exp(-radius*radius*1.8);
    vec4 r=picture(sampleAt+split);
    vec4 g=picture(sampleAt);
    vec4 b=picture(sampleAt-split);
    rgb+=vec3(r.r*r.a,g.g*g.a,b.b*b.a)*weight;
    alphas+=vec3(r.a,g.a,b.a)*weight;
    total+=weight;
  }
  float a=max(alphas.r,max(alphas.g,alphas.b))/total*vLook.y;
  return vec4(rgb/total*vLook.y,a);
}
float varianceMix(float sigma,float a,float b){return clamp((sigma*sigma-a*a)/(b*b-a*a),0.0,1.0);}
vec4 premultipliedSource(vec2 uv){vec4 c=texture2D(uImage,uv);return vec4(c.rgb*c.a,c.a);}
vec4 gaussianImage(vec2 uv,float sigma){
 if(sigma<uGaussianLevels.x)return mix(premultipliedSource(uv),texture2D(uBlur1,uv),varianceMix(sigma,0.0,uGaussianLevels.x));
 if(sigma<uGaussianLevels.y)return mix(texture2D(uBlur1,uv),texture2D(uBlur2,uv),varianceMix(sigma,uGaussianLevels.x,uGaussianLevels.y));
 if(sigma<uGaussianLevels.z)return mix(texture2D(uBlur2,uv),texture2D(uBlur3,uv),varianceMix(sigma,uGaussianLevels.y,uGaussianLevels.z));
 if(sigma<uGaussianLevels.w)return mix(texture2D(uBlur3,uv),texture2D(uBlur4,uv),varianceMix(sigma,uGaussianLevels.z,uGaussianLevels.w));
 return mix(texture2D(uBlur4,uv),texture2D(uBlur5,uv),varianceMix(sigma,uGaussianLevels.w,uGaussianLast));
}
vec4 depthPicture(vec2 uv){
 vec2 crop=uImageAspect>uCardAspect?vec2(uCardAspect/uImageAspect,1.0):vec2(1.0,uImageAspect/uCardAspect);
 vec2 imageUv=clamp((uv-.5)*crop+.5,0.0,1.0);
 float radius=min(uCardAspect,1.0)*.08;
 vec2 q=abs(uv-.5)*vec2(uCardAspect,1.0)-(vec2(uCardAspect,1.0)*.5-radius);
 float d=length(max(q,0.0))+min(max(q.x,q.y),0.0)-radius;
 float x=abs(d)/(max(uDepthSigma,.00001)*1.41421356237),t=1.0/(1.0+.3275911*x);
 float erf=1.0-(((((1.061405429*t-1.453152027)*t+1.421413741)*t-.284496736)*t+.254829592)*t)*exp(-x*x);
 float mask=.5*(1.0-sign(d)*erf);
 return gaussianImage(imageUv,uDepthSigma*crop.y)*mask*vLook.y;
}
void main(){
 vec2 uv=vUv;
 if(!gl_FrontFacing)uv.x=1.0-uv.x;
 vec4 c=originalPicture(uv);
 if(uDepthWeight>.001&&uDepthSigma>.0001)c=mix(c,depthPicture(uv),uDepthWeight);
 if(c.a<.002)discard;
 if(uWallTone>.001)c.rgb=mix(c.rgb,wallTone(c.rgb/c.a,uv,uCardAspect)*c.a,uWallTone);
 gl_FragColor=c;
}
`;

function program(gl){
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  const vertex=compile(gl.VERTEX_SHADER,VERTEX),fragment=compile(gl.FRAGMENT_SHADER,FRAGMENT),p=gl.createProgram();
  gl.attachShader(p,vertex);gl.attachShader(p,fragment);gl.linkProgram(p);
  gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  return p;
}

async function loadTextures(gl,cards){
  const images=new Map(),gaussian=createGaussianBuilder(gl);
  const load=src=>{if(!images.has(src))images.set(src,new Promise((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';image.onload=()=>resolve(image);image.onerror=reject;image.src=src;}));return images.get(src);};
  try{return await Promise.all(cards.map(async card=>{
    const p=card.preview;
    const source=await load(card.image||`./assets/${p.image}`);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
    const ctx=canvas.getContext('2d');
    if(card.image){
      const scale=coverImageScale(card.image),w=source.naturalWidth/scale,h=source.naturalHeight/scale;
      ctx.drawImage(source,(source.naturalWidth-w)/2,(source.naturalHeight-h)/2,w,h,0,0,512,512);
    } else {
      const zoom=card.row==='bottom'&&(card.index===0||card.index===4)?1.35:1.055;
      ctx.scale(512/350,512/350);ctx.translate(175,175);ctx.scale(zoom,zoom);ctx.rotate(-p.rotation*Math.PI/180);ctx.translate(-p.cx,-p.cy);ctx.drawImage(source,0,0,p.width,p.height);
    }
    const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    const aspect=card.image?source.naturalWidth/source.naturalHeight:1;
    return {texture,aspect,levels:gaussian.build(texture,aspect)};
  }));}finally{gaussian.destroy();}
}

export async function createExploreRenderer(canvas,cards){
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance'});
  if(!gl)throw Error('WebGL unavailable');
  const p=program(gl);gl.useProgram(p);
  const textures=await loadTextures(gl,cards);
  gl.useProgram(p);
  const segments=16,side=segments+1;
  const vertices=new Float32Array(side*side*7),indices=[];
  for(let y=0;y<segments;y++)for(let x=0;x<segments;x++){
    const a=y*side+x;indices.push(a,a+side,a+1,a+1,a+side,a+side+1);
  }
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices.byteLength,gl.DYNAMIC_DRAW);
  const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  for(const [name,offset] of [['aPosition',0],['aUv',8],['aLook',16],['aDepth',24]]){
    const location=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,name==='aDepth'?1:2,gl.FLOAT,false,28,offset);
  }
  gl.uniform1i(gl.getUniformLocation(p,'uImage'),0);
  for(let i=1;i<=5;i++)gl.uniform1i(gl.getUniformLocation(p,'uBlur'+i),i);
  const levels=gaussianSigmas();
  gl.uniform4fv(gl.getUniformLocation(p,'uGaussianLevels'),levels.slice(0,4));
  gl.uniform1f(gl.getUniformLocation(p,'uGaussianLast'),levels[4]);
  const depthWeight=gl.getUniformLocation(p,'uDepthWeight'),depthSigma=gl.getUniformLocation(p,'uDepthSigma');
  const imageAspect=gl.getUniformLocation(p,'uImageAspect'),cardAspect=gl.getUniformLocation(p,'uCardAspect');
  const wallToneUniform=gl.getUniformLocation(p,'uWallTone');
  function textureAt(index,aspect,tone=0){const entry=textures[index];entry.levels.forEach((texture,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);});gl.activeTexture(gl.TEXTURE0);gl.uniform1f(imageAspect,entry.aspect);gl.uniform1f(cardAspect,aspect);gl.uniform1f(wallToneUniform,tone);}
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  let width=1,height=1,time=0,cache=new Map(),offsets=new Map(),assembly=null;
  const pointer={x:0,y:0,active:false};
  const hoverReveal=new Float32Array(cards.length);
  function hoverLabel(index){const id=index<0?'':cards[index].id;if(canvas.dataset.wallHovered!==id)canvas.dataset.wallHovered=id;}
  function prepare(freeze=time){
        const frozen=[];const latest=Math.floor(freeze/RELEASE_INTERVAL);
        for(let id=Math.max(0,latest-48);id<=latest;id++){const f=makeFlight(id,width,height),age=freeze-id*RELEASE_INTERVAL;if(age>f.life)continue;const pose=flightPose(f,age);frozen.push({f,pose});}
        const live=new Map(frozen.map(item=>{const offset={...(offsets.get(item.f.id)||{x:0,y:0,tilt:0})};return [item.f.id%cards.length,{...item,vertex:(u,v)=>sheetVertex(item.f,item.pose,u,v,offset),sample:delta=>{const pose=flightPose(item.f,item.pose.age+delta);return {f:item.f,pose,vertex:(u,v)=>sheetVertex(item.f,pose,u,v,offset)};}}];}));
        assembly=createDirectWall(width,height,cards,live);
      }

  function resize(w,h){
    if(width===w&&height===h&&assembly)return;
    width=w;height=h;cache.clear();offsets.clear();assembly=null;
    const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  function frame(dt,still=false,morph=0,flightTime=0,rotation=0,captured=false){
    time=flightTime;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const sceneTime=time;
    const latest=Math.floor(sceneTime/RELEASE_INTERVAL),list=[];
    for(let id=Math.max(0,latest-48);id<=latest;id++){
      if(!cache.has(id))cache.set(id,makeFlight(id,width,height));
      const f=cache.get(id),age=sceneTime-id*RELEASE_INTERVAL;
      if(age>f.life)continue;
      const pose=flightPose(f,age);list.push({f,pose});
    }
    if(captured||morph>0){
      if(!assembly)prepare(sceneTime);
      const wallItems=assembly.frame(morph,rotation),tone=wallToneProgress(morph);
      const hovered=morph>=.999?pickWallCard(wallItems,(pose,u,v)=>assembly.vertex(pose,u,v),pointer):-1;
      hoverLabel(hovered);
      const blend=still?1:1-Math.exp(-Math.max(0,dt)*10);
      for(let i=0;i<hoverReveal.length;i++)hoverReveal[i]+=((i===hovered?1:0)-hoverReveal[i])*blend;
      gl.uniform1f(depthWeight,0);gl.uniform1f(depthSigma,0);
      for(const item of wallItems){
        if(item.pose.alpha<.002 && !(item.pose.mesh && item.pose.meshWeight>0))continue;
        let at=0;
        for(let n=0;n<side*side;n++){
          const u=(n%side)/segments*1.32-.16,v=Math.floor(n/side)/segments*1.32-.16;
          const point=assembly.vertex(item.pose,u,v);
          vertices[at++]=point.x/(width/2);vertices[at++]=point.y/(height/2);
          vertices[at++]=u;vertices[at++]=v;vertices[at++]=point.blur;vertices[at++]=point.alpha;vertices[at++]=1-20/Math.max(10,1000-point.z);
        }
        textureAt(item.index,item.pose.w/item.pose.h,cards[item.index].keepOriginal?0:tone*(1-hoverReveal[item.index]));gl.bufferSubData(gl.ARRAY_BUFFER,0,vertices);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
      }
      return cards.length;
    }
    hoverReveal.fill(0);hoverLabel(-1);
    gl.uniform1f(depthWeight,0);gl.uniform1f(depthSigma,0);
    // Transparent sheets are painted back to front; depth changes continuously.
    list.sort((a,b)=>a.pose.z-b.pose.z);
    const alive=new Set(list.map(({f})=>f.id));
    for(const id of cache.keys())if(!alive.has(id))cache.delete(id);
    for(const id of offsets.keys())if(!alive.has(id))offsets.delete(id);
    for(const {f,pose} of list){
      if(!offsets.has(f.id))offsets.set(f.id,{x:0,y:0,vx:0,vy:0,tilt:0});
      const offset=offsets.get(f.id),centre=sheetVertex(f,pose,.5,.5);
      const dx=centre.x-pointer.x,dy=centre.y-pointer.y,distance=Math.hypot(dx,dy);
      const force=pointer.active&&!still?Math.max(0,1-distance/210)**2:0;
      const tx=dx/Math.max(distance,1)*force*85,ty=dy/Math.max(distance,1)*force*85;
      // Critically damped local displacement; pointer input never changes flight time.
      for(let step=0;step<2;step++){
        const d=dt/2;offset.vx+=((tx-offset.x)*65-offset.vx*16)*d;offset.vy+=((ty-offset.y)*65-offset.vy*16)*d;
        offset.x+=offset.vx*d;offset.y+=offset.vy*d;
      }
      offset.tilt+=(clamp((offset.vx*f.cos+offset.vy*f.sin)*.001,-.16,.16)-offset.tilt)*(1-Math.exp(-dt*12));
      let at=0;
      for(let y=0;y<=segments;y++)for(let x=0;x<=segments;x++){
        const u=x/segments*1.32-.16,v=y/segments*1.32-.16;
        const point=sheetVertex(f,pose,u,v,offset);
        vertices[at++]=point.x/(width/2);vertices[at++]=point.y/(height/2);
        vertices[at++]=u;vertices[at++]=v;vertices[at++]=point.blur;vertices[at++]=point.alpha;vertices[at++]=1-20/Math.max(10,1000-point.z);
      }
      textureAt(f.id%textures.length,1);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,vertices);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    }
    return list.length;
  }
  function reset(){
    time=0;cache.clear();offsets.clear();assembly=null;
    hoverReveal.fill(0);hoverLabel(-1);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  }
  return {resize,frame,reset,pointer,freeze(t){prepare(t);for(const offset of offsets.values()){offset.vx=0;offset.vy=0;}},destroy(){new Set(textures.flatMap(t=>t.levels)).forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buffer);gl.deleteBuffer(index);gl.deleteProgram(p);}};
}
