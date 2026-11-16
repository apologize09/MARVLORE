// A sheet unrolls over an invisible lip, then travels outward through depth.
// The direction is fixed for each flight: there is no orbiting carousel.
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const CAMERA = 1000;
export const RELEASE_INTERVAL = .43;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
// The reference eases into the lip from rest, before building outward speed.
const FLOW_POWER=.6,FLOW_OFFSET=.35;
const FLOW_NORMAL=Math.pow(1+FLOW_OFFSET,FLOW_POWER)-Math.pow(FLOW_OFFSET,FLOW_POWER);
export function travelAt(f,age){
  const t=Math.max(0,age),distance=t-2*(1-Math.exp(-t/2));
  return f.reach*(Math.pow(distance/10+FLOW_OFFSET,FLOW_POWER)-Math.pow(FLOW_OFFSET,FLOW_POWER))/FLOW_NORMAL/.55;
}
function speedAt(f,age){
  const distance=age-2*(1-Math.exp(-age/2));
  return f.reach*FLOW_POWER*Math.pow(distance/10+FLOW_OFFSET,FLOW_POWER-1)*(1-Math.exp(-age/2))/10/FLOW_NORMAL/.55;
}
function ageAt(f,distance){
  let lo=0,hi=30;
  for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(travelAt(f,mid)<distance)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
const seeded = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const hermite = (a, av, b, bv, t) => (2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*av+(-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*bv;
const EXIT_ANGLE = 50 * Math.PI / 180;

export function lipAt(s, flight) {
  const {major,minor,zBase,arc} = flight;
  if (s < 0) return [major-minor, zBase+s];
  const turn = Math.PI - Math.min(s,arc) / minor;
  const extra = Math.max(0,s-arc);
  return [major+minor*Math.cos(turn)+extra*Math.sin(EXIT_ANGLE), zBase+minor*Math.sin(turn)-extra*Math.cos(EXIT_ANGLE)];
}

export function makeFlight(id,width,height) {
  const unit = clamp(Math.min(width,height)/900,.55,1.35);
  const angle = id * GOLDEN_ANGLE + (seeded(id)-.5)*.17;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  // The original has an empty centre. Widen it to fit the user's central title.
  const rx = Math.max(225*unit,width*.205), ry = height*.205;
  const inner = 1/Math.sqrt((cos/rx)**2+(sin/ry)**2);
  const minor = height*.088/.55;
  const size = 300*unit*(.87+seeded(id+17)*.22);
  const speed = 220*unit;
  const f = {id,angle,cos,sin,size,speed,minor,major:inner/.55+minor,zBase:CAMERA-CAMERA/.55-minor,arc:minor*(Math.PI-EXIT_ANGLE),seed:seeded(id+31)};
  f.start = -size*.68;
  f.release = f.arc+size*.68;
  f.reach = Math.hypot(width,height)/2+size*1.2*.8;
  f.releaseTime = ageAt(f,f.release-f.start);
  f.releaseSpeed = speedAt(f,f.releaseTime);
  f.from = lipAt(f.release,f);
  f.near = .75+seeded(id+73)*.4;
  const outside = Math.min(width/2/Math.max(.001,Math.abs(cos)),height/2/Math.max(.001,Math.abs(sin)))+size*f.near;
  f.to = [outside/f.near,CAMERA-CAMERA/f.near];
  const distance = Math.hypot(f.to[0]-f.from[0],f.to[1]-f.from[1]);
  f.freeTime = Math.max(2.2,distance/f.releaseSpeed);
  f.life = f.releaseTime+f.freeTime;
  f.startVelocity = [Math.sin(EXIT_ANGLE)*f.releaseSpeed*f.freeTime,-Math.cos(EXIT_ANGLE)*f.releaseSpeed*f.freeTime];
  f.endVelocity = [f.to[0]-f.from[0],f.to[1]-f.from[1]];
  return f;
}

export function flightPose(f,age) {
  const released = age >= f.releaseTime;
  const travel = travelAt(f,age);
  const t = clamp((age-f.releaseTime)/f.freeTime);
  const ease = smooth(t/.22);
  const radial = released ? hermite(f.from[0],f.startVelocity[0],f.to[0],f.endVelocity[0],t) : lipAt(f.start+travel,f)[0];
  const z = released ? hermite(f.from[1],f.startVelocity[1],f.to[1],f.endVelocity[1],t) : lipAt(f.start+travel,f)[1];
  return {
    age, released,t,radial,z,along:f.start+travel,
    // Free sheets turn face-on, flutter and bank; they do not spin round the centre.
    tilt: -(Math.PI/2-EXIT_ANGLE)*(1-smooth(t/.65))+ease*Math.sin(t*5+f.seed*6)*.25,
    bank: ease*(f.seed-.5)*.7+ease*Math.sin(t*4+f.seed*5)*.13,
    bend:ease*Math.sin(t*6+f.seed*5)*.46,
    flutter:ease*Math.sin(age*2.1+f.seed*8)*f.size*.025,
    alpha:smooth(travel/(f.size*.75)),
  };
}

export function sheetVertex(f,pose,u,v,offset={x:0,y:0,tilt:0}) {
  let across=(u-.5)*f.size, along=(.5-v)*f.size;
  let rho,z,x,y,blur,shown;
  if (!pose.released) {
    const at=pose.along+along;
    [rho,z]=lipAt(at,f);
    x=f.cos*rho-f.sin*across; y=f.sin*rho+f.cos*across;
    shown=smooth(at/(f.minor*.66));
    // Defocus varies across the curved surface, so one edge can be sharp.
    blur=(1-smooth(at/(f.minor*1.85)))*.16;
  } else {
    const c=Math.cos(pose.bank),s=Math.sin(pose.bank);
    [across,along]=[across*c-along*s,across*s+along*c];
    const wave=Math.sin(along/f.size*Math.PI*2.0+pose.age*2.1+f.seed*8)*Math.pow(Math.abs(across)/(f.size*.5),1.6);
    const curl=pose.bend*(across*across/f.size)+pose.flutter*wave;
    const tilt=pose.tilt+offset.tilt;
    const radial=along*Math.cos(tilt)-curl*Math.sin(tilt);
    z=pose.z+along*Math.sin(tilt)+curl*Math.cos(tilt);
    x=f.cos*(pose.radial+radial)-f.sin*across;
    y=f.sin*(pose.radial+radial)+f.cos*across;
    shown=1;
    blur=.0015+Math.max(0,Math.abs(z-pose.z)/f.size-.025)*.06+Math.min(.022,Math.abs(wave)*Math.abs(pose.flutter)/f.size*.65);
  }
  const perspective=CAMERA/(CAMERA-z);
  return {x:x*perspective+offset.x,y:y*perspective+offset.y,z,blur,alpha:shown*pose.alpha};
}
