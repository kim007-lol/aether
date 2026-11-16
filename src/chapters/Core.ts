import {
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  InstancedMesh,
  BufferGeometry,
  Float32BufferAttribute,
  Object3D,
  Vector3,
  Plane,
  Raycaster,
  PointLight,
  RingGeometry,
  AdditiveBlending,
  Color,
  DoubleSide,
  type Texture,
} from "three";
import { SceneChapter, type Ctx, type FrameState } from "./Chapter";
import type { TaskQueue } from "../core/TaskQueue";
import type { Tier } from "../config/quality";
import { CORE } from "../config/cameraPath";
import { createCoreGeometry, createOrbitGeometry } from "../core/geometry";
import { random, smoothstep } from "../core/math";
import { glsl } from "../core/glsl";
import heartVert from "../shaders/heart.vert?raw";
import heartFrag from "../shaders/heart.frag?raw";
import waveVert from "../shaders/shockwave.vert?raw";
import waveFrag from "../shaders/shockwave.frag?raw";
function glass(env: Texture) {
  return new MeshPhysicalMaterial({
    color: "#d8e6ff",
    transmission: 1,
    thickness: 2.5,
    ior: 1.45,
    dispersion: 0.35,
    roughness: 0.02,
    iridescence: 1,
    iridescenceIOR: 1.3,
    iridescenceThicknessMinimum: 200,
    iridescenceThicknessMaximum: 800,
    attenuationColor: new Color("#8b5cff"),
    attenuationDistance: 3,
    clearcoat: 1,
    envMapIntensity: 1.6,
    envMap: env,
  });
}
function shardGeometry() {
  const vertices: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3,
      b = ((i + 1) * Math.PI) / 3;
    vertices.push(
      0,
      2,
      0,
      Math.cos(a) * 0.5,
      0,
      Math.sin(a) * 0.5,
      Math.cos(b) * 0.5,
      0,
      Math.sin(b) * 0.5,
      0,
      -2,
      0,
      Math.cos(b) * 0.5,
      0,
      Math.sin(b) * 0.5,
      Math.cos(a) * 0.5,
      0,
      Math.sin(a) * 0.5,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}
export class Core extends SceneChapter {
  readonly id = "core";
  readonly range: [number, number] = [0.86, 1];
  private time = { value: 0 };
  private energy = { value: 1 };
  private amplitude = { value: 0.35 };
  private opacity = { value: 0 };
  private shards!: InstancedMesh;
  private monolith!: Mesh;
  private heart!: Mesh;
  private orbits: Mesh[] = [];
  private lights: PointLight[] = [];
  private wave!: Mesh;
  private waveAge = 2;
  private params = new Float32Array(400 * 5);
  private springs = new Float32Array(400 * 2);
  private dummy = new Object3D();
  private ray = new Raycaster();
  private plane = new Plane();
  private normal = new Vector3();
  private hit = new Vector3();
  private attract = new Vector3();
  private attractionVelocity = new Vector3();
  private attractionForce = new Vector3();
  proximity = 0;
  override async init(ctx: Ctx, queue: TaskQueue) {
    await super.init(ctx, queue);
    this.group.position.copy(CORE);
    const material = glass(ctx.env!);
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uCoreTime = this.time;
      shader.uniforms.uAmplitude = this.amplitude;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        "#include <common>\n" +
          glsl("#include <fbm>") +
          "\nuniform float uCoreTime;uniform float uAmplitude;vec3 coreDisplace(vec3 p){vec3 n=normalize(p);float d=(noise3(p*.28+uCoreTime*.12)-.5)*uAmplitude*2.+(fbm(p*.65-uCoreTime*.08)-.5)*uAmplitude;vec3 q=p+n*d;q.y*=1.3;return q;}",
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nvec3 cn=normalize(position);vec3 ct=normalize(cross(cn,abs(cn.y)<.95?vec3(0,1,0):vec3(1,0,0)));vec3 cb=cross(cn,ct);vec3 cp=coreDisplace(position);objectNormal=normalize(cross(coreDisplace(position+ct*.015)-cp,coreDisplace(position+cb*.015)-cp));",
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "vec3 transformed=coreDisplace(position);",
      );
    };
    material.customProgramCacheKey = () => "aether-liquid-glass";
    this.monolith = new Mesh(createCoreGeometry("monolith"), material);
    await queue.yield();
    this.heart = new Mesh(
      createCoreGeometry("heart"),
      new ShaderMaterial({
        vertexShader: heartVert,
        fragmentShader: glsl(heartFrag),
        uniforms: { uTime: this.time, uEnergy: this.energy },
        toneMapped: false,
        transparent: false,
      }),
    );
    this.group.add(this.monolith, this.heart);
    for (let i = 0; i < 3; i++) {
      const torus = new Mesh(
        createOrbitGeometry(2.4 + i * 0.4),
        new MeshStandardMaterial({
          color: "#315a6f",
          metalness: 1,
          roughness: 0.2,
          emissive: new Color("#5ce1ff").multiplyScalar(2),
          envMap: ctx.env,
        }),
      );
      torus.rotation.set(i * 0.9, 0.4 + i * 0.7, i * 0.8);
      this.orbits.push(torus);
      this.group.add(torus);
    }
    const shardMat = glass(ctx.env!);
    shardMat.transmission = 0.9;
    shardMat.roughness = 0.05;
    shardMat.thickness = 0.5;
    this.shards = new InstancedMesh(shardGeometry(), shardMat, 400);
    this.shards.frustumCulled = false;
    const rnd = random(812);
    for (let i = 0; i < 400; i++) {
      this.params[i * 5] = 6 + rnd() * 8;
      this.params[i * 5 + 1] = rnd() * 6.28;
      this.params[i * 5 + 2] = (0.07 + rnd() * 0.12) * (rnd() > 0.5 ? 1 : -1);
      this.params[i * 5 + 3] = (rnd() - 0.5) * 1.5;
      this.params[i * 5 + 4] = 0.1 + Math.pow(rnd(), 2) * 0.35;
    }
    this.group.add(this.shards);
    const colors = ["#5ce1ff", "#8b5cff", "#ff8a4c", "#d8efff"];
    for (let i = 0; i < 4; i++) {
      const light = new PointLight(colors[i], i === 3 ? 35 : 60, 35, 2);
      light.position.set(Math.cos(i * 2.1) * 9, 4, Math.sin(i * 2.1) * 9);
      this.lights.push(light);
      this.group.add(light);
    }
    this.wave = new Mesh(
      new RingGeometry(1, 1.15, 256),
      new ShaderMaterial({
        vertexShader: waveVert,
        fragmentShader: waveFrag,
        uniforms: { uOpacity: this.opacity },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    );
    this.wave.visible = false;
    this.group.add(this.wave);
    this.rebuild(ctx.tier);
  }
  update(s: FrameState) {
    this.time.value = s.time;
    this.group.scale.setScalar(smoothstep(0.8, 0.86, s.progress));
    this.normal.set(0, 0, -1).applyQuaternion(s.camera.quaternion);
    this.plane.setFromNormalAndCoplanarPoint(this.normal, CORE);
    this.ray.setFromCamera(s.pointer, s.camera);
    this.ray.ray.intersectPlane(this.plane, this.hit);
    this.proximity = 1 - smoothstep(0, 14, this.hit.distanceTo(CORE));
    this.energy.value = 1 + this.proximity * 1.6;
    this.amplitude.value = 0.35 + this.proximity * 0.25;
    this.attractionForce
      .copy(this.hit)
      .sub(CORE)
      .clampLength(0, 1.5)
      .sub(this.attract)
      .multiplyScalar(14)
      .addScaledVector(this.attractionVelocity, -7);
    this.attractionVelocity.addScaledVector(this.attractionForce, s.dt);
    this.attract.addScaledVector(this.attractionVelocity, s.dt);
    this.monolith.rotation.y = s.time * 0.09;
    this.monolith.rotation.z = Math.sin(s.time * 0.18) * 0.08;
    this.heart.rotation.y = -s.time * 0.1;
    for (let i = 0; i < this.orbits.length; i++) {
      this.orbits[i].rotation.y =
        s.time * (i % 2 === 0 ? 0.13 : -0.16) + i * 0.7;
      this.orbits[i].rotation.x = s.time * 0.07 + i * 0.9;
    }
    for (let i = 0; i < this.shards.count; i++) {
      const j = i * 5,
        k = i * 2;
      this.springs[k + 1] +=
        (-this.springs[k] * 32 - this.springs[k + 1] * 8) * s.dt;
      this.springs[k] += this.springs[k + 1] * s.dt;
      const r = this.params[j] + this.springs[k],
        angle = this.params[j + 1] + s.time * this.params[j + 2],
        inclination = this.params[j + 3];
      this.dummy.position.set(
        Math.cos(angle) * r,
        Math.sin(angle) * r * Math.sin(inclination) * 0.65,
        Math.sin(angle) * r * 0.55,
      );
      this.dummy.position.add(this.attract);
      this.dummy.rotation.set(
        angle * 0.3,
        angle,
        inclination + Math.sin(angle) * 0.4,
      );
      this.dummy.scale.setScalar(this.params[j + 4]);
      this.dummy.updateMatrix();
      this.shards.setMatrixAt(i, this.dummy.matrix);
    }
    this.shards.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < this.lights.length; i++) {
      const angle = s.time * 0.12 + i * 2.1;
      this.lights[i].position.set(
        Math.cos(angle) * 9,
        3 + Math.sin(angle) * 4,
        Math.sin(angle) * 9,
      );
    }
    this.waveAge += s.dt;
    this.wave.visible = !s.reduced && this.waveAge < 1.2;
    if (this.wave.visible) {
      const t = this.waveAge / 1.2;
      this.wave.scale.setScalar(1 + 17 * (1 - Math.pow(1 - t, 2)));
      this.wave.quaternion.copy(s.camera.quaternion);
      this.opacity.value = Math.pow(1 - t, 2);
    }
  }
  shock() {
    this.waveAge = 0;
    for (let i = 0; i < 400; i++) this.springs[i * 2 + 1] += 12 + (i % 7);
  }
  rebuild(tier: Tier) {
    if (this.shards) this.shards.count = tier.shards;
  }
}
