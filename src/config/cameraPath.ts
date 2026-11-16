import {CatmullRomCurve3,Euler,Vector3} from 'three';
export const SUN=new Vector3(1,.28,.55).normalize();
export const FIELD=new Vector3(70,0,-60),NEBULA=new Vector3(170,15,-250),CORE=new Vector3(190,0,-290);
export const RING_EULER=new Euler(.28,0,-.12);
export const PATH_STOPS=[0,.08,.16,.25,.34,.43,.52,.58,.64,.70,.78,.86,1];
const ring=(x:number,y:number,z:number)=>new Vector3(x,y,z).applyEuler(RING_EULER);
export const PATH_POSITIONS=[new Vector3(0,7,52),new Vector3(-6,5,34),new Vector3(-9,6,21),new Vector3(-14,3,17),ring(16.5,3,8),ring(20.1,.6,-6),ring(18,-.4,-17.35),new Vector3(48,2,-26),new Vector3(62,0,-50),new Vector3(78,-3,-72),new Vector3(110,6,-112),new Vector3(150,8,-190),new Vector3(190,2,-268)];
export const PATH_TARGETS=[new Vector3(0,-3,0),new Vector3(0,0,0),new Vector3(0,0,0),new Vector3(2,0,0),ring(22,0,-8),ring(17,0,-20),ring(36,0,-30),FIELD.clone(),new Vector3(74,0,-72),new Vector3(100,4,-112),new Vector3(150,12,-200),CORE.clone(),CORE.clone()];
export const positionCurve=new CatmullRomCurve3(PATH_POSITIONS,false,'centripetal');
export const targetCurve=new CatmullRomCurve3(PATH_TARGETS,false,'centripetal');
positionCurve.arcLengthDivisions=2048;targetCurve.arcLengthDivisions=2048;
function arcMap(curve:CatmullRomCurve3){const lengths=curve.getLengths(2048);const total=lengths[2048];return PATH_STOPS.map((_,i)=>lengths[Math.round(i/(PATH_STOPS.length-1)*2048)]/total);}
const posArc=arcMap(positionCurve),targetArc=arcMap(targetCurve);
function remap(p:number,map:number[]){let i=0;while(i<PATH_STOPS.length-2&&p>PATH_STOPS[i+1])i++;const t=(p-PATH_STOPS[i])/(PATH_STOPS[i+1]-PATH_STOPS[i]);return map[i]+(map[i+1]-map[i])*Math.max(0,Math.min(1,t));}
export function samplePosition(p:number,out:Vector3){return positionCurve.getPointAt(remap(p,posArc),out);}
export function sampleTarget(p:number,out:Vector3){return targetCurve.getPointAt(remap(p,targetArc),out);}
export const CLEARANCE_SAMPLES=Array.from({length:1001},(_,i)=>samplePosition(i/1000,new Vector3()));
export function pathClearance(center:Vector3,radius:number){let min=Infinity;for(const point of CLEARANCE_SAMPLES)min=Math.min(min,point.distanceTo(center)-radius);return min;}
