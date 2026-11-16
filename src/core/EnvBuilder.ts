import {
  Scene,
  Mesh,
  SphereGeometry,
  ShaderMaterial,
  BackSide,
  PlaneGeometry,
  MeshBasicMaterial,
  Color,
  PMREMGenerator,
  type WebGLRenderer,
} from "three";
export function buildEnvironment(renderer: WebGLRenderer) {
  const scene = new Scene();
  const dome = new Mesh(
    new SphereGeometry(50, 32, 16),
    new ShaderMaterial({
      side: BackSide,
      vertexShader:
        "varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec3 vP;void main(){float h=normalize(vP).y;gl_FragColor=vec4(mix(vec3(.015,.008,.04),vec3(.2,.3,.4),smoothstep(-.3,1.,h)),1.);}",
    }),
  );
  scene.add(dome);
  const colors = ["#5ce1ff", "#8b5cff", "#ff8a4c"];
  for (let i = 0; i < 3; i++) {
    const box = new Mesh(
      new PlaneGeometry(6, 20),
      new MeshBasicMaterial({ color: new Color(colors[i]).multiplyScalar(6) }),
    );
    box.position.set(Math.cos(i * 2.09) * 20, 6, Math.sin(i * 2.09) * 20);
    box.lookAt(0, 0, 0);
    scene.add(box);
  }
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.06, 0.1, 100);
  pmrem.dispose();
  scene.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.geometry.dispose();
      (obj.material as ShaderMaterial).dispose();
    }
  });
  return target;
}
