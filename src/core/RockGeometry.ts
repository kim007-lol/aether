import { BufferAttribute, BufferGeometry, IcosahedronGeometry, MathUtils } from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createNoise3D } from 'simplex-noise';

type Crater = { x: number; y: number; z: number; radius: number; depth: number; rim: number };

function randomSource(seed: number): () => number {
  let state = (seed * 1000003 + 1337) | 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function prepare(detail: number, seed: number) {
  const random = randomSource(seed);
  const noise = createNoise3D(random);
  const source = new IcosahedronGeometry(1, detail);
  source.deleteAttribute('normal');
  source.deleteAttribute('uv');
  const geometry = mergeVertices(source);
  source.dispose();
  const positions = geometry.getAttribute('position');
  const cavity = new Float32Array(positions.count);
  const craters: Crater[] = [];
  const count = 10 + Math.floor(random() * 7);
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(1 - y * y);
    craters.push({ x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius, radius: 0.08 + random() * 0.22, depth: 0.10 + random() * 0.15, rim: 0.02 + random() * 0.025 });
  }
  const sx = 0.7 + random() * 0.6;
  const sy = 0.7 + random() * 0.6;
  const sz = 0.7 + random() * 0.6;
  function fbm(x: number, y: number, z: number, ridged: boolean): number {
    let result = 0;
    let amplitude = 0.5;
    for (let octave = 0; octave < 4; octave++) {
      const n = noise(x, y, z);
      result += amplitude * (ridged ? 1 - Math.abs(n) : n);
      x = x * 2.07 + 3.1; y = y * 2.07 + 1.7; z = z * 2.07 + 5.3;
      amplitude *= 0.5;
    }
    return result;
  }
  function displace(index: number) {
    const x = positions.getX(index); const y = positions.getY(index); const z = positions.getZ(index);
    let radius = 1 + 0.35 * fbm(x * 1.3 + seed, y * 1.3, z * 1.3, true) + 0.08 * fbm(x * 4 + seed, y * 4, z * 4, false);
    let ao = 1;
    for (const crater of craters) {
      // Angular crater profiles remain equally sized at poles and across the entire surface.
      const distance = Math.acos(MathUtils.clamp(x * crater.x + y * crater.y + z * crater.z, -1, 1));
      if (distance > crater.radius * 1.3) continue;
      const bowl = 1 - MathUtils.smoothstep(distance, 0, crater.radius);
      const rim = MathUtils.smoothstep(distance, crater.radius * 0.8, crater.radius) * (1 - MathUtils.smoothstep(distance, crater.radius, crater.radius * 1.3));
      radius += -crater.depth * bowl + crater.rim * rim;
      ao *= 1 - 0.75 * bowl;
    }
    positions.setXYZ(index, x * radius * sx, y * radius * sy, z * radius * sz);
    cavity[index] = ao;
  }
  function finish(): BufferGeometry {
    positions.needsUpdate = true;
    geometry.setAttribute('aCavity', new BufferAttribute(cavity, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.userData.seed = seed;
    geometry.userData.craters = count;
    return geometry;
  }
  return { count: positions.count, displace, finish };
}

export function createRockGeometry(detail: number, seed: number): BufferGeometry {
  const job = prepare(detail, seed);
  for (let i = 0; i < job.count; i++) job.displace(i);
  return job.finish();
}

export async function createRockGeometryAsync(detail: number, seed: number, yieldTask: () => Promise<void>): Promise<BufferGeometry> {
  await yieldTask();
  const job = prepare(detail, seed);
  let sliceStart = performance.now();
  for (let i = 0; i < job.count; i++) {
    job.displace(i);
    if ((i & 31) === 0 && performance.now() - sliceStart > 6) {
      await yieldTask();
      sliceStart = performance.now();
    }
  }
  await yieldTask();
  return job.finish();
}
