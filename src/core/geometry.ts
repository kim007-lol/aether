import { BufferGeometry, IcosahedronGeometry, SphereGeometry, TorusGeometry } from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export type GeometryTier = 'low' | 'medium' | 'high' | 'ultra';
export const SEGMENTS: Record<GeometryTier, readonly [number, number]> = {
  low: [240, 128], medium: [320, 192], high: [384, 256], ultra: [512, 320],
};
export const ROCK_DETAILS = { hero: 28, mid: 14, far: 6, ring: 5 } as const;
export const GEOMETRY_MINIMUMS = { planet: 100000, cloud: 100000, monolith: 80000, heart: 20000, hero: 15000, mid: 4000, far: 900, ring: 700, orbit: 30000 } as const;

export function countTriangles(geometry: BufferGeometry): number {
  return (geometry.index?.count ?? geometry.getAttribute('position').count) / 3;
}

export function createPlanetGeometry(tier: GeometryTier, radius = 10): SphereGeometry {
  const [width, height] = SEGMENTS[tier];
  return new SphereGeometry(radius, width, height);
}

export function createCoreGeometry(kind: 'monolith' | 'heart'): BufferGeometry {
  const source = new IcosahedronGeometry(kind === 'monolith' ? 4 : 1.4, kind === 'monolith' ? 64 : 32);
  // No UV seam is needed by procedural materials; weld identical positions across it.
  source.deleteAttribute('uv');
  source.deleteAttribute('normal');
  const geometry = mergeVertices(source);
  source.dispose();
  geometry.computeVertexNormals();
  return geometry;
}

export function createOrbitGeometry(radius: number): TorusGeometry {
  return new TorusGeometry(radius, 0.015, 32, 512);
}
