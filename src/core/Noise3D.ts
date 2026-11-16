import { Data3DTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RedFormat, RepeatWrapping, UnsignedByteType } from 'three';
import { createNoise3D as simplex3D } from 'simplex-noise';

const SIZE = 128;
const PERIOD = 8;

export async function createNoise3D(yieldTask: () => Promise<void>): Promise<Data3DTexture> {
  let seed = 0xabcdef;
  const noise = simplex3D(() => { seed = Math.imul(1664525, seed) + 1013904223; return (seed >>> 0) / 4294967296; });
  const data = new Uint8Array(SIZE * SIZE * SIZE);
  let sliceStart = performance.now();
  let index = 0;
  // Blend opposite noise cells to make all three texture seams periodic.
  for (let z = 0; z < SIZE; z++) {
    const tz = z / SIZE;
    for (let y = 0; y < SIZE; y++) {
      const ty = y / SIZE;
      for (let x = 0; x < SIZE; x++) {
        const tx = x / SIZE;
        const px = tx * PERIOD; const py = ty * PERIOD; const pz = tz * PERIOD;
        let value = 0;
        for (let dz = 0; dz <= 1; dz++) for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
          const weight = (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty) * (dz ? tz : 1 - tz);
          value += noise(px - dx * PERIOD, py - dy * PERIOD, pz - dz * PERIOD) * weight;
        }
        data[index++] = Math.max(0, Math.min(255, Math.round((0.5 + value * 0.7) * 255)));
      }
      if (performance.now() - sliceStart > 6) { await yieldTask(); sliceStart = performance.now(); }
    }
  }
  const texture = new Data3DTexture(data, SIZE, SIZE, SIZE);
  texture.name = 'Aether periodic noise volume';
  texture.format = RedFormat;
  texture.type = UnsignedByteType;
  texture.internalFormat = 'R8';
  texture.colorSpace = NoColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = texture.wrapT = texture.wrapR = RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
