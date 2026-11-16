import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  Mesh,
  RingGeometry,
  DoubleSide,
  InstancedMesh,
  Object3D,
  Vector3,
  Color,
  type MeshStandardMaterial,
} from "three";
import { SceneChapter, type Ctx, type FrameState } from "./Chapter";
import type { TaskQueue } from "../core/TaskQueue";
import type { Tier } from "../config/quality";
import { SUN, RING_EULER, pathClearance } from "../config/cameraPath";
import { random, smoothstep } from "../core/math";
import { ringDensity } from "../core/ringDensity";
import { glsl } from "../core/glsl";
import { createRockGeometryAsync } from "../core/RockGeometry";
import {
  createRockTextures,
  createRockMaterial,
  attachRockMotion,
  type RockTextures,
} from "../core/RockMaterial";
import vert from "../shaders/rings.vert?raw";
import frag from "../shaders/rings.frag?raw";
import dustVert from "../shaders/dust.vert?raw";
import dustFrag from "../shaders/dust.frag?raw";
export class Rings extends SceneChapter {
  readonly id = "rings";
  readonly range: [number, number] = [0.34, 0.52];
  private particles!: Points<BufferGeometry, ShaderMaterial>;
  private heroes: InstancedMesh<BufferGeometry, MeshStandardMaterial>[] = [];
  private time = { value: 0 };
  private reveals: { value: number }[] = [];
  private feathers: { value: number }[] = [];
  private fade = { value: 0 };
  private pixel = { value: 1 };
  private light = { value: new Vector3() };
  textures!: RockTextures;
  minClearance = Infinity;
  override async init(ctx: Ctx, queue: TaskQueue) {
    await super.init(ctx, queue);
    this.group.rotation.copy(RING_EULER);
    const rnd = random(991);
    const max = 450000;
    const positions = new Float32Array(max * 3),
      orbits = new Float32Array(max * 4);
    for (let i = 0; i < max; i++) {
      let r = 14 + rnd() * 16;
      while (rnd() > ringDensity(r)) r = 14 + rnd() * 16;
      const angle = rnd() * Math.PI * 2;
      const height =
        Math.sqrt(-2 * Math.log(Math.max(rnd(), 0.00001))) *
        Math.cos(rnd() * 6.28) *
        0.06;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      orbits.set([r, angle, height, 0.04 + Math.pow(rnd(), 4) * 0.3], i * 4);
      if (i % 4096 === 0) await queue.checkpoint();
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("aOrbit", new Float32BufferAttribute(orbits, 4));
    this.particles = new Points(
      geo,
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: glsl(frag),
        uniforms: {
          uTime: this.time,
          uPixelRatio: this.pixel,
          uFade: this.fade,
          uSun: { value: SUN },
          uLightView: this.light,
        },
        transparent: true,
        depthWrite: false,
      }),
    );
    this.particles.frustumCulled = false;
    this.group.add(this.particles);
    const dust = new Mesh(
      new RingGeometry(14, 30, 512, 32),
      new ShaderMaterial({
        vertexShader: dustVert,
        fragmentShader: glsl(dustFrag),
        uniforms: { uSun: { value: SUN }, uFade: this.fade },
        side: DoubleSide,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    dust.rotation.x = -Math.PI / 2;
    this.group.add(dust);
    this.textures = createRockTextures(ctx.renderer);
    const dummy = new Object3D(),
      world = new Vector3(),
      color = new Color();
    for (let variant = 0; variant < 3; variant++) {
      const geometry = await createRockGeometryAsync(5, variant + 3, () =>
        queue.yield(),
      );
      const count = Math.ceil(4000 / 3);
      attachRockMotion(geometry, count, variant);
      const visibleCount = { value: count },
        feather = { value: count * 0.08 };
      this.reveals.push(visibleCount);
      this.feathers.push(feather);
      const material = createRockMaterial(this.textures, this.time, {
        visibleCount,
        feather,
        ring: true,
        tumble: true,
      });
      material.transparent = true;
      const mesh = new InstancedMesh(geometry, material, count);
      for (let i = 0; i < count; i++) {
        let safe = false;
        while (!safe) {
          let r = 14 + rnd() * 16;
          while (rnd() > ringDensity(r)) r = 14 + rnd() * 16;
          const angle = rnd() * Math.PI * 2;
          const size = 0.03 + Math.pow(rnd(), 4) * 0.3;
          dummy.position.set(
            Math.cos(angle) * r,
            (rnd() - 0.5) * 0.12,
            Math.sin(angle) * r,
          );
          world.copy(dummy.position).applyEuler(RING_EULER);
          const clearance = pathClearance(
            world,
            size *
              (geometry.boundingSphere!.radius +
                geometry.boundingSphere!.center.length()),
          );
          safe = clearance >= 2.75;
          if (safe) {
            this.minClearance = Math.min(this.minClearance, clearance);
            dummy.scale.setScalar(size);
          }
        }
        dummy.rotation.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        color.setHSL(
          0.08 + rnd() * 0.04,
          0.08 + rnd() * 0.2,
          0.4 + rnd() * 0.3,
        );
        mesh.setColorAt(i, color);
        if (i % 64 === 0) await queue.checkpoint();
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      this.heroes.push(mesh);
      this.group.add(mesh);
    }
    this.rebuild(ctx.tier);
  }
  update(s: FrameState) {
    this.time.value = s.time;
    this.fade.value =
      smoothstep(0.28, 0.34, s.progress) *
      (1 - smoothstep(0.5, 0.58, s.progress));
    this.pixel.value = Math.min(devicePixelRatio, s.tier.dprCap);
    this.light.value.copy(SUN).transformDirection(s.camera.matrixWorldInverse);
    for (let i = 0; i < this.heroes.length; i++) {
      const mesh = this.heroes[i];
      mesh.material.opacity = this.fade.value;
      mesh.material.depthWrite = this.fade.value > 0.999;
      const count =
        (s.tier.ringHeroRocks / 3) * (1 - smoothstep(0.5, 0.58, s.progress));
      this.reveals[i].value = count;
      this.feathers[i].value = (s.tier.ringHeroRocks / 3) * 0.08;
      mesh.count = Math.ceil(count);
    }
  }
  rebuild(tier: Tier) {
    this.particles?.geometry.setDrawRange(0, tier.ringParticles);
    for (let i = 0; i < this.heroes.length; i++)
      this.heroes[i].count =
        Math.floor(tier.ringHeroRocks / 3) +
        (i < tier.ringHeroRocks % 3 ? 1 : 0);
  }
  override dispose() {
    this.particles.geometry.dispose();
    this.particles.material.dispose();
    this.textures.dispose();
    super.dispose();
  }
}
