import {PerspectiveCamera,Vector2,Vector3} from 'three';
import {samplePosition,sampleTarget} from '../config/cameraPath';
import {damp} from './math';
export class CameraRig {
 readonly camera=new PerspectiveCamera(40,1,.1,3000);readonly pointer=new Vector2();readonly rawPointer=new Vector2();private target=new Vector3();private previous=new Vector3();private right=new Vector3();private up=new Vector3();intro=1;shake=0;
 constructor(readonly reduced:boolean){this.resize();}
 resize(){const aspect=innerWidth/innerHeight;this.camera.aspect=aspect;this.camera.fov=aspect<1?52:40;this.camera.updateProjectionMatrix();}
 update(p:number,time:number,dt:number){const c=this.camera;this.previous.copy(c.position);samplePosition(p,c.position);sampleTarget(p,this.target);if(this.intro>0)c.position.z+=(60-52)*this.intro;
 // A tiny film drift uses seconds, so damping and amplitude are frame-rate independent.
 if(!this.reduced){this.pointer.lerp(this.rawPointer,damp(3.7125,dt));c.position.x+=this.pointer.x*.6+Math.sin(time*.93)*.05;c.position.y+=this.pointer.y*.6+Math.sin(time*.71)*.05;}
 c.lookAt(this.target);if(!this.reduced){c.rotateY(-this.pointer.x*.0349);c.rotateX(this.pointer.y*.0349);c.rotateZ(Math.max(-.052,Math.min(.052,(c.position.x-this.previous.x)*.012)));if(this.shake>0){c.position.x+=Math.sin(time*83)*this.shake*.15;c.position.y+=Math.cos(time*71)*this.shake*.15;this.shake*=Math.exp(-dt*8);}}
 // Final framing preserves glass in the right third, leaving the editorial copy on the left.
 const framing=Math.max(0,Math.min(1,(p-.87)/.13));this.right.setFromMatrixColumn(c.matrix,0);this.up.setFromMatrixColumn(c.matrix,1);if(c.aspect>=1){c.position.addScaledVector(this.right,-4.2*framing);this.target.addScaledVector(this.right,-4.2*framing);}else{c.position.addScaledVector(this.up,-4.3*framing);this.target.addScaledVector(this.up,-4.3*framing);}c.lookAt(this.target);c.updateMatrixWorld();
 }
}
