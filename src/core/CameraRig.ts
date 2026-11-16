import { PerspectiveCamera, Vector2, Vector3 } from "three";
import {
  samplePosition,
  sampleTarget,
  composeCamera,
} from "../config/cameraPath";
import { damp } from "./math";
export class CameraRig {
  readonly camera = new PerspectiveCamera(40, 1, 0.1, 3000);
  readonly pointer = new Vector2();
  readonly rawPointer = new Vector2();
  private target = new Vector3();
  private previous = new Vector3();
  private right = new Vector3();
  private up = new Vector3();
  intro = 1;
  shake = 0;
  constructor(readonly reduced: boolean) {
    this.resize();
  }
  resize() {
    const aspect = innerWidth / innerHeight;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1 ? 52 : 40;
    this.camera.updateProjectionMatrix();
  }
  update(p: number, time: number, dt: number) {
    const c = this.camera;
    this.previous.copy(c.position);
    samplePosition(p, c.position);
    sampleTarget(p, this.target);
    if (this.intro > 0) c.position.z += 8 * this.intro;
    this.pointer.lerp(this.rawPointer, damp(3.7125, dt));
    // Frame-rate-independent pointer damping remains available to the Core in reduced motion.
    if (!this.reduced) {
      c.position.x += this.pointer.x * 0.6 + Math.sin(time * 0.93) * 0.05;
      c.position.y += this.pointer.y * 0.6 + Math.sin(time * 0.71) * 0.05;
    }
    c.lookAt(this.target);
    c.updateMatrixWorld();
    this.right.setFromMatrixColumn(c.matrixWorld, 0);
    this.up.setFromMatrixColumn(c.matrixWorld, 1);
    composeCamera(
      p,
      c.aspect < 1,
      c.position,
      this.target,
      this.right,
      this.up,
    );
    c.lookAt(this.target);
    if (!this.reduced) {
      c.rotateY(-this.pointer.x * 0.0349);
      c.rotateX(this.pointer.y * 0.0349);
      c.rotateZ(
        Math.max(
          -0.052,
          Math.min(0.052, (c.position.x - this.previous.x) * 0.012),
        ),
      );
      if (this.shake > 0) {
        c.position.x += Math.sin(time * 83) * this.shake * 0.15;
        c.position.y += Math.cos(time * 71) * this.shake * 0.15;
        this.shake *= Math.exp(-dt * 8);
      }
    }
    c.updateMatrixWorld();
  }
}
