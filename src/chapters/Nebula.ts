import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  ShaderMaterial,
  WebGLRenderTarget,
  HalfFloatType,
  UnsignedByteType,
  LinearFilter,
  Scene,
  Camera,
  Points,
  Vector2,
  Matrix4,
  Euler,
  type WebGLRenderer,
} from "three";
import { SceneChapter, type Ctx, type FrameState } from "./Chapter";
import type { TaskQueue } from "../core/TaskQueue";
import type { Tier } from "../config/quality";
import { createNoise3D } from "../core/Noise3D";
import { glsl } from "../core/glsl";
import { random, smoothstep } from "../core/math";
import vert from "../shaders/fullscreen.vert?raw";
import frag from "../shaders/nebula.frag?raw";
import composite from "../shaders/nebula-composite.frag?raw";
export class Nebula extends SceneChapter {
  readonly id = "nebula";
  readonly range: [number, number] = [0.7, 1];
  private volumeScene = new Scene();
  private screenCamera = new Camera();
  private target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  });
  private shader!: ShaderMaterial;
  private time = { value: 0 };
  private fade = { value: 0 };
  private steps = { value: 40 };
  private screen = new Vector2();
  private sparks!: Points<BufferGeometry, ShaderMaterial>;
  private glows!: Points<BufferGeometry, ShaderMaterial>;
  private volume!: Mesh;
  private width = 0;
  private height = 0;
  override async init(ctx: Ctx, queue: TaskQueue) {
    await super.init(ctx, queue);
    if (
      !ctx.renderer.extensions.has("EXT_color_buffer_float") &&
      !ctx.renderer.extensions.has("EXT_color_buffer_half_float")
    )
      this.target.texture.type = UnsignedByteType;
    ctx.noise = await createNoise3D(() => queue.yield());
    const full = new BufferGeometry();
    full.setAttribute(
      "position",
      new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    );
    this.shader = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: glsl(frag),
      uniforms: {
        uNoise: { value: ctx.noise },
        uInverseProjection: { value: ctx.camera.projectionMatrixInverse },
        uCameraWorld: { value: ctx.camera.matrixWorld },
        uCamera: { value: ctx.camera.position },
        uSteps: this.steps,
        uTime: this.time,
        uFade: this.fade,
      },
      depthTest: false,
      depthWrite: false,
    });
    this.volume = new Mesh(full, this.shader);
    this.volume.frustumCulled = false;
    this.volumeScene.add(this.volume);
    const screen = new Mesh(
      full,
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: glsl(composite),
        uniforms: {
          uVolume: { value: this.target.texture },
          uInverseProjection: { value: ctx.camera.projectionMatrixInverse },
          uCameraWorld: { value: ctx.camera.matrixWorld },
          uSkyInverse: {
            value: new Matrix4()
              .makeRotationFromEuler(new Euler(0.4, 0, -0.35))
              .invert(),
          },
        },
        depthTest: false,
        depthWrite: false,
        transparent: false,
      }),
    );
    screen.frustumCulled = false;
    screen.renderOrder = -100;
    this.group.add(screen);
    const rnd = random(109);
    const p = new Float32Array(8000 * 3);
    for (let i = 0; i < 8000; i++) {
      p[i * 3] = 170 + (rnd() - 0.5) * 180;
      p[i * 3 + 1] = 15 + (rnd() - 0.5) * 100;
      p[i * 3 + 2] = -250 + (rnd() - 0.5) * 180;
    }
    const particles = new BufferGeometry();
    particles.setAttribute("position", new Float32BufferAttribute(p, 3));
    this.sparks = new Points(
      particles,
      new ShaderMaterial({
        vertexShader: glsl(`#include <noise>
uniform float uTime;void main(){vec3 p=position;vec3 q=p*.07+uTime*.03;vec3 curl=vec3(noise3(q+vec3(0,.1,0))-noise3(q-vec3(0,.1,0)),noise3(q+vec3(0,0,.1))-noise3(q-vec3(0,0,.1)),noise3(q+vec3(.1,0,0))-noise3(q-vec3(.1,0,0)));p+=curl*4.;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(40./max(-v.z,1.),.8,3.);}`),
        fragmentShader:
          "uniform float uFade;void main(){float r=length(gl_PointCoord*2.-1.);gl_FragColor=vec4(.18,.6,1.2,pow(max(1.-r,0.),3.)*uFade*.5);}",
        uniforms: { uTime: this.time, uFade: this.fade },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.sparks.frustumCulled = false;
    this.group.add(this.sparks);
    const glowGeo = new BufferGeometry();
    glowGeo.setAttribute(
      "position",
      new Float32BufferAttribute(
        [175, 18, -230, 205, -5, -265, 145, 25, -270],
        3,
      ),
    );
    this.glows = new Points(
      glowGeo,
      new ShaderMaterial({
        vertexShader:
          "void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(1800./max(-p.z,1.),2.,100.);}",
        fragmentShader:
          "uniform float uFade;void main(){vec2 uv=gl_PointCoord*2.-1.;float r=length(uv);float glow=exp(-r*r*14.);gl_FragColor=vec4(2.8,3.5,4.,glow*uFade*.7);}",
        uniforms: { uFade: this.fade },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.glows.frustumCulled = false;
    this.group.add(this.glows);
    this.rebuild(ctx.tier);
    if (ctx.renderer.extensions.has("KHR_parallel_shader_compile"))
      await ctx.renderer.compileAsync(this.volumeScene, this.screenCamera);
    else ctx.renderer.compile(this.volumeScene, this.screenCamera);
  }
  update(s: FrameState) {
    this.time.value = s.time;
    this.fade.value =
      smoothstep(0.64, 0.74, s.progress) *
      (1 - 0.78 * smoothstep(0.86, 1, s.progress));
    this.renderVolume();
  }
  renderVolume() {
    this.resize();
    const renderer = this.ctx.renderer,
      previous = renderer.getRenderTarget();
    renderer.setRenderTarget(this.target);
    renderer.render(this.volumeScene, this.screenCamera);
    renderer.setRenderTarget(previous);
  }
  resize() {
    this.ctx.renderer.getDrawingBufferSize(this.screen);
    const w = Math.floor(this.screen.x * this.ctx.tier.nebulaRes),
      h = Math.floor(this.screen.y * this.ctx.tier.nebulaRes);
    if (w !== this.width || h !== this.height) {
      this.width = w;
      this.height = h;
      this.target.setSize(w, h);
    }
  }
  rebuild(tier: Tier) {
    this.steps.value = tier.nebulaSteps;
    if (this.ctx) this.resize();
  }
  override warm(renderer: WebGLRenderer) {
    this.fade.value = 1;
    this.renderVolume();
    super.warm(renderer);
  }
  override dispose() {
    this.target.dispose();
    this.shader.dispose();
    this.sparks.geometry.dispose();
    this.sparks.material.dispose();
    this.glows.geometry.dispose();
    this.glows.material.dispose();
    this.ctx.noise?.dispose();
    super.dispose();
  }
}
