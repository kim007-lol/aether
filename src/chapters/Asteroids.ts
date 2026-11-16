import {
  InstancedMesh,
  Mesh,
  Object3D,
  Vector3,
  Color,
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  ShaderMaterial,
  AdditiveBlending,
  type MeshStandardMaterial,
} from "three";
import { SceneChapter, type Ctx, type FrameState } from "./Chapter";
import type { TaskQueue } from "../core/TaskQueue";
import type { Tier } from "../config/quality";
import { FIELD, samplePosition, pathClearance } from "../config/cameraPath";
import { random, smoothstep } from "../core/math";
import { createRockGeometryAsync } from "../core/RockGeometry";
import {
  createRockTextures,
  createRockMaterial,
  attachRockMotion,
  type RockTextures,
} from "../core/RockMaterial";
export class Asteroids extends SceneChapter {
  readonly id = "asteroids";
  readonly range: [number, number] = [0.52, 0.7];
  private instances: InstancedMesh<BufferGeometry, MeshStandardMaterial>[] = [];
  private heroes: Mesh<BufferGeometry, MeshStandardMaterial>[] = [];
  private time = { value: 0 };
  private reveals: { value: number }[] = [];
  private feathers: { value: number }[] = [];
  private textures!: RockTextures;
  private dust!: Points<BufferGeometry, ShaderMaterial>;
  private fade = { value: 0 };
  minClearance = Infinity;
  gateClearances: number[] = [];
  override async init(ctx: Ctx, queue: TaskQueue) {
    await super.init(ctx, queue);
    this.textures = createRockTextures(ctx.renderer);
    const rnd = random(719),
      dummy = new Object3D(),
      color = new Color();
    for (let level = 0; level < 2; level++) {
      for (let variant = 0; variant < 3; variant++) {
        const count = level === 0 ? 1000 : 267;
        const geometry = await createRockGeometryAsync(
          level === 0 ? 6 : 14,
          variant + 31 + level * 3,
          () => queue.yield(),
        );
        attachRockMotion(geometry, count, variant + 6);
        const visibleCount = { value: count },
          feather = { value: count * 0.08 };
        this.reveals.push(visibleCount);
        this.feathers.push(feather);
        const material = createRockMaterial(this.textures, this.time, {
          visibleCount,
          feather,
          tumble: true,
        });
        material.transparent = true;
        const mesh = new InstancedMesh(geometry, material, count);
        const radius =
          geometry.boundingSphere!.radius +
          geometry.boundingSphere!.center.length();
        for (let i = 0; i < count; i++) {
          let clearance = 0;
          while (clearance < 2.75) {
            const angle = rnd() * Math.PI * 2,
              lat = Math.asin(rnd() * 2 - 1),
              distance = 0.5 + rnd() * 0.5;
            dummy.position.set(
              FIELD.x + Math.cos(angle) * Math.cos(lat) * 38 * distance,
              FIELD.y + Math.sin(lat) * 14 * distance,
              FIELD.z + Math.sin(angle) * Math.cos(lat) * 38 * distance,
            );
            const size =
              level === 0
                ? 0.25 + Math.pow(rnd(), 3) * 0.7
                : 0.55 + Math.pow(rnd(), 3) * 1.5;
            dummy.scale.setScalar(size);
            clearance = pathClearance(dummy.position, size * radius);
          }
          this.minClearance = Math.min(this.minClearance, clearance);
          dummy.rotation.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          color.setHSL(
            0.075 + rnd() * 0.035,
            0.08 + rnd() * 0.12,
            0.4 + rnd() * 0.13,
          );
          mesh.setColorAt(i, color);
          if (i % 32 === 0) await queue.checkpoint();
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.frustumCulled = false;
        mesh.receiveShadow = true;
        this.instances.push(mesh);
        this.group.add(mesh);
      }
    }
    const center = new Vector3(),
      offset = new Vector3();
    for (let i = 0; i < 12; i++) {
      const geo = await createRockGeometryAsync(28, 70 + i, () =>
        queue.yield(),
      );
      const mat = createRockMaterial(this.textures, this.time);
      mat.transparent = true;
      const rock = new Mesh(geo, mat);
      const size = 1.1 + (i % 3) * 0.45;
      rock.scale.setScalar(size);
      samplePosition(0.588 + Math.floor(i / 2) * 0.018, center);
      const angle = i % 2 === 0 ? 0.3 : 3.6;
      offset.set(Math.cos(angle), Math.sin(angle), 0.15).normalize();
      let distance =
        (geo.boundingSphere!.radius + geo.boundingSphere!.center.length()) *
          size +
        2.75;
      rock.position.copy(center).addScaledVector(offset, distance);
      let clearance = pathClearance(
        rock.position,
        (geo.boundingSphere!.radius + geo.boundingSphere!.center.length()) *
          size,
      );
      while (clearance < 2.75) {
        distance += 0.1;
        rock.position.copy(center).addScaledVector(offset, distance);
        clearance = pathClearance(
          rock.position,
          (geo.boundingSphere!.radius + geo.boundingSphere!.center.length()) *
            size,
        );
      }
      this.gateClearances.push(clearance);
      this.minClearance = Math.min(this.minClearance, clearance);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.heroes.push(rock);
      this.group.add(rock);
    }
    const p = new Float32Array(4000 * 3);
    for (let i = 0; i < p.length; i++) p[i] = (rnd() - 0.5) * 30;
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(p, 3));
    this.dust = new Points(
      geometry,
      new ShaderMaterial({
        uniforms: { uTime: this.time, uFade: this.fade },
        vertexShader:
          "uniform float uTime;void main(){vec3 p=mod(position+vec3(0.,uTime*.03,uTime*.12)+15.,30.)-15.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=1.3;}",
        fragmentShader:
          "uniform float uFade;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.3,.48,.6,max(0.,1.-r)*.15*uFade);}",
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    this.dust.frustumCulled = false;
    this.group.add(this.dust);
    this.rebuild(ctx.tier);
  }
  update(s: FrameState) {
    this.time.value = s.time;
    const entrance = smoothstep(0.5, 0.58, s.progress),
      exit = 1 - smoothstep(0.7, 0.76, s.progress);
    this.fade.value = entrance * exit;
    this.dust.position.copy(s.camera.position);
    for (let i = 0; i < this.instances.length; i++) {
      const count = i < 3 ? s.tier.far : s.tier.mid;
      this.reveals[i].value = (count / 3) * entrance;
      this.feathers[i].value = (count / 3) * 0.08;
      this.instances[i].count = Math.ceil((count / 3) * entrance);
      this.instances[i].material.opacity = this.fade.value;
      this.instances[i].material.depthWrite = this.fade.value > 0.999;
    }
    for (const hero of this.heroes) {
      hero.material.opacity = this.fade.value;
      hero.material.depthWrite = this.fade.value > 0.999;
    }
  }
  rebuild(tier: Tier) {
    for (let i = 0; i < this.instances.length; i++) {
      this.instances[i].count = Math.floor((i < 3 ? tier.far : tier.mid) / 3);
      this.instances[i].receiveShadow = tier.shadowSize > 0;
    }
    for (const hero of this.heroes) {
      hero.castShadow = tier.shadowSize > 0;
      hero.receiveShadow = tier.shadowSize > 0;
    }
  }
  override dispose() {
    this.dust.geometry.dispose();
    this.dust.material.dispose();
    this.textures.dispose();
    super.dispose();
  }
}
