import {
  BufferGeometry,
  Camera,
  Color,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from "three";

export interface RockTextures {
  albedo: Texture;
  normal: Texture;
  dispose(): void;
}
const TEXTURE_SIZE = 1024;
const tileNoise = `
float rockHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float rockNoise(vec2 p,float period) { vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(rockHash(mod(i,period)),rockHash(mod(i+vec2(1,0),period)),f.x),mix(rockHash(mod(i+vec2(0,1),period)),rockHash(mod(i+vec2(1,1),period)),f.x),f.y); }
float stoneHeight(vec2 uv) { return rockNoise(uv*8.0,8.0)*.45+rockNoise(uv*16.0,16.0)*.25+rockNoise(uv*32.0,32.0)*.18+rockNoise(uv*64.0,64.0)*.12; }
`;

export function createRockTextures(renderer: WebGLRenderer): RockTextures {
  const previousTarget = renderer.getRenderTarget();
  const scene = new Scene();
  const camera = new Camera();
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
  );
  const material = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: { uNormal: { value: false } },
    vertexShader:
      "varying vec2 vUV; void main(){vUV=position.xy*.5+.5;gl_Position=vec4(position,1.0);}",
    fragmentShader: `
      uniform bool uNormal; varying vec2 vUV;
      ${tileNoise}
      void main(){
        float h=stoneHeight(vUV);
        if(uNormal){
          float e=1.0/1024.0;
          vec3 n=normalize(vec3((stoneHeight(vUV-vec2(e,0))-stoneHeight(vUV+vec2(e,0)))*7.0,(stoneHeight(vUV-vec2(0,e))-stoneHeight(vUV+vec2(0,e)))*7.0,1.0));
          gl_FragColor=vec4(n*.5+.5,1.0);
        }else{
          float fleck=smoothstep(.84,.96,rockHash(mod(floor(vUV*1024.0),1024.0)))*smoothstep(.48,.7,h);
          vec3 c=mix(vec3(.032,.026,.022),vec3(.30,.25,.19),h);
          c+=fleck*vec3(.22,.19,.11);
          gl_FragColor=vec4(c,1.0);
          #include <colorspace_fragment>
        }
      }`,
  });
  const triangle = new Mesh(geometry, material);
  triangle.frustumCulled = false;
  scene.add(triangle);
  const albedoTarget = new WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE);
  const normalTarget = new WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE);
  albedoTarget.texture.colorSpace = SRGBColorSpace;
  normalTarget.texture.colorSpace = NoColorSpace;
  for (const target of [albedoTarget, normalTarget]) {
    target.texture.wrapS = target.texture.wrapT = RepeatWrapping;
    target.texture.minFilter = LinearMipmapLinearFilter;
    target.texture.magFilter = LinearFilter;
    target.texture.generateMipmaps = true;
    target.texture.anisotropy = Math.min(
      8,
      renderer.capabilities.getMaxAnisotropy(),
    );
  }
  renderer.setRenderTarget(albedoTarget);
  renderer.render(scene, camera);
  material.uniforms.uNormal.value = true;
  renderer.setRenderTarget(normalTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(previousTarget);
  geometry.dispose();
  material.dispose();
  return {
    albedo: albedoTarget.texture,
    normal: normalTarget.texture,
    dispose() {
      albedoTarget.dispose();
      normalTarget.dispose();
    },
  };
}

export function attachRockMotion(
  geometry: BufferGeometry,
  count: number,
  seed = 1,
): void {
  const axes = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  let state = seed | 0;
  const random = () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const x = random() * 2 - 1,
      y = random() * 2 - 1,
      z = random() * 2 - 1;
    const length = Math.sqrt(x * x + y * y + z * z) || 1;
    axes[i * 3] = x / length;
    axes[i * 3 + 1] = y / length;
    axes[i * 3 + 2] = z / length;
    speeds[i] = (random() - 0.5) * 0.12;
  }
  geometry.setAttribute("aRockAxis", new InstancedBufferAttribute(axes, 3));
  geometry.setAttribute("aRockSpeed", new InstancedBufferAttribute(speeds, 1));
}

export function createRockMaterial(
  textures: RockTextures,
  time: { value: number },
  options: { ring?: boolean; tumble?: boolean } = {},
): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: new Color("#c6b6a2"),
    roughness: 0.92,
    metalness: 0.05,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRockAlbedo = { value: textures.albedo };
    shader.uniforms.uRockNormal = { value: textures.normal };
    shader.uniforms.uRockTime = time;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
      attribute float aCavity;
      varying vec3 vRockPosition;
      varying vec3 vRockNormal;
      varying vec3 vRockWorld;
      varying float vRockCavity;
      uniform float uRockTime;
      ${options.tumble ? "attribute vec3 aRockAxis; attribute float aRockSpeed;" : ""}
      vec3 rockRotate(vec3 p,vec3 axis,float angle){ float c=cos(angle),s=sin(angle);return p*c+cross(axis,p)*s+axis*dot(axis,p)*(1.0-c);}
    `,
    );
    if (options.tumble) {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        objectNormal=rockRotate(objectNormal,aRockAxis,uRockTime*aRockSpeed);`,
      );
    }
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vRockPosition=position;
      vRockNormal=normal;
      vRockCavity=aCavity;
      ${options.tumble ? "transformed=rockRotate(transformed,aRockAxis,uRockTime*aRockSpeed);" : ""}
    `,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      `#include <worldpos_vertex>
      vec4 rockWorld=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
        rockWorld=instanceMatrix*rockWorld;
      #endif
      vRockWorld=(modelMatrix*rockWorld).xyz;
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
      uniform sampler2D uRockAlbedo;
      uniform sampler2D uRockNormal;
      varying vec3 vRockPosition;
      varying vec3 vRockNormal;
      varying vec3 vRockWorld;
      varying float vRockCavity;
      vec3 rockWeights(){vec3 w=pow(abs(normalize(vRockNormal)),vec3(5.0));return w/max(dot(w,vec3(1.0)),.0001);}
      vec3 rockMap(sampler2D tex){vec3 p=vRockPosition*.7;vec3 w=rockWeights();return texture2D(tex,p.yz).rgb*w.x+texture2D(tex,p.zx).rgb*w.y+texture2D(tex,p.xy).rgb*w.z;}
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      diffuseColor.rgb*=rockMap(uRockAlbedo)*(.36+.64*vRockCavity)*2.8;
      ${options.ring ? "vec3 sun=normalize(vec3(1.0,.28,.55)); float along=dot(-vRockWorld,sun); float axisDistance=length(vRockWorld+sun*max(along,0.0)); diffuseColor.rgb*=mix(1.0,smoothstep(9.5,10.5,axisDistance),step(0.0,along));" : ""}
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_begin>",
      `#include <normal_fragment_begin>
      vec3 detailNormal=rockMap(uRockNormal)*2.0-1.0;
      vec3 rockTangent=normalize(cross(normal,abs(normal.y)<.95?vec3(0,1,0):vec3(1,0,0)));
      normal=normalize(normal+rockTangent*detailNormal.x*.4+cross(normal,rockTangent)*detailNormal.y*.4);
    `,
    );
  };
  material.customProgramCacheKey = () =>
    `rock-triplanar-${Boolean(options.ring)}-${Boolean(options.tumble)}`;
  return material;
}
