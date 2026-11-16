// Original separable Gaussian implementation. References and rationale:
// docs/explore-blur-reference.md. No third-party runtime dependency.
export function gaussianKernel(sigma=2){
 const taps=Array.from({length:5},(_,i)=>Math.exp(-i*i/(2*sigma*sigma)));
 const sum=taps[0]+2*taps.slice(1).reduce((a,b)=>a+b,0);
 const weights=taps.map(v=>v/sum);
 return {
  weights:[weights[0],weights[1]+weights[2],weights[3]+weights[4]],
  offsets:[(weights[1]+2*weights[2])/(weights[1]+weights[2]),(3*weights[3]+4*weights[4])/(weights[3]+weights[4])],
  variance:2*weights.reduce((v,w,i)=>v+i*i*w,0),
 };
}
export const gaussianSizes=[256,128,64,32,16];
export function gaussianSigmas(){
 let variance=0,previous=512;
 const kernel=gaussianKernel();
 return gaussianSizes.map(size=>{
  variance+=kernel.variance/(size*size)+.25/(previous*previous);
  previous=size;return Math.sqrt(variance);
 });
}
export function gaussianLevelMix(sigma){
 const levels=[0,...gaussianSigmas()];
 for(let i=1;i<levels.length;i++)if(sigma<=levels[i]){
  const a=levels[i-1],b=levels[i];
  return {low:i-1,high:i,mix:Math.max(0,(sigma*sigma-a*a)/(b*b-a*a))};
 }
 return {low:5,high:5,mix:0};
}

export const gaussianVertex=`
attribute vec2 aPosition;
varying vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.0,1.0);}
`;
export const gaussianFragment=`
precision highp float;
uniform sampler2D uImage;
uniform vec2 uDirection;
uniform vec3 uWeights;
uniform vec2 uOffsets;
uniform float uPremultiply;
varying vec2 vUv;
vec4 sampleAt(vec2 uv){vec4 c=texture2D(uImage,uv);c.rgb*=mix(1.0,c.a,uPremultiply);return c;}
void main(){
 vec4 c=sampleAt(vUv)*uWeights.x;
 c+=(sampleAt(vUv+uDirection*uOffsets.x)+sampleAt(vUv-uDirection*uOffsets.x))*uWeights.y;
 c+=(sampleAt(vUv+uDirection*uOffsets.y)+sampleAt(vUv-uDirection*uOffsets.y))*uWeights.z;
 gl_FragColor=c;
}
`;

export function createGaussianBuilder(gl){
 const shaders=[];
 function compile(type,source){
  const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;
 }
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,gaussianVertex));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,gaussianFragment));gl.linkProgram(program);
 shaders.forEach(shader=>gl.deleteShader(shader));
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);
 const buffer=gl.createBuffer(),framebuffer=gl.createFramebuffer(),scratch=new Map();
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'aPosition');
 const direction=gl.getUniformLocation(program,'uDirection'),premultiply=gl.getUniformLocation(program,'uPremultiply');
 const kernel=gaussianKernel();
 gl.uniform1i(gl.getUniformLocation(program,'uImage'),0);
 gl.uniform3fv(gl.getUniformLocation(program,'uWeights'),kernel.weights);
 gl.uniform2fv(gl.getUniformLocation(program,'uOffsets'),kernel.offsets);
 function target(size){
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return texture;
 }
 function pass(input,output,size,x,y,straightAlpha){
  gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,output,0);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Gaussian framebuffer unavailable');
  gl.viewport(0,0,size,size);gl.bindTexture(gl.TEXTURE_2D,input);
  gl.uniform2f(direction,x,y);gl.uniform1f(premultiply,straightAlpha?1:0);gl.drawArrays(gl.TRIANGLES,0,3);
 }
 return {
  build(texture,aspect){
   gl.useProgram(program);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.activeTexture(gl.TEXTURE0);
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   const levels=[texture];let input=texture;
   for(const size of gaussianSizes){
    if(!scratch.has(size))scratch.set(size,target(size));
    const output=target(size);
    // Horizontal then vertical. Pair adjacent taps using linear filtering.
    pass(input,scratch.get(size),size,1/(size*aspect),0,levels.length===1);
    pass(scratch.get(size),output,size,0,1/size,false);
    levels.push(output);input=output;
   }
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);return levels;
  },
  destroy(){scratch.forEach(texture=>gl.deleteTexture(texture));gl.deleteFramebuffer(framebuffer);gl.deleteBuffer(buffer);gl.deleteProgram(program);},
 };
}
