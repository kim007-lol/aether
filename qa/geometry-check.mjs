import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import {
  createPlanetGeometry,
  createCoreGeometry,
  createOrbitGeometry,
  countTriangles,
  GEOMETRY_MINIMUMS,
  ROCK_DETAILS,
} from "../src/core/geometry.ts";
import { createRockGeometry } from "../src/core/RockGeometry.ts";

const report = { passed: true, tiers: {}, generationMilliseconds: {} };
const shared = {};
for (const [name, detail] of Object.entries(ROCK_DETAILS)) {
  const started = performance.now();
  const geometry = createRockGeometry(detail, 17);
  assert(
    geometry.index,
    name + ": vertices must be welded before displacement",
  );
  assert.equal(
    geometry.userData.craters >= 10 && geometry.userData.craters <= 16,
    true,
  );
  const normals = geometry.getAttribute("normal");
  for (let i = 0; i < normals.count; i++) {
    const length = Math.hypot(
      normals.getX(i),
      normals.getY(i),
      normals.getZ(i),
    );
    assert(
      Number.isFinite(length) && Math.abs(length - 1) < 0.001,
      name + ": smooth unit normals",
    );
  }
  shared[name] = countTriangles(geometry);
  report.generationMilliseconds[name] = +(performance.now() - started).toFixed(
    2,
  );
  geometry.dispose();
}
for (const name of ["monolith", "heart"]) {
  const geometry = createCoreGeometry(name);
  shared[name] = countTriangles(geometry);
  assert(geometry.index, name + ": merged smooth geometry");
  geometry.dispose();
}
const orbit = createOrbitGeometry(2.8);
shared.orbit = countTriangles(orbit);
orbit.dispose();
for (const tier of ["low", "medium", "high", "ultra"]) {
  const planet = createPlanetGeometry(tier);
  const cloud = createPlanetGeometry(tier, 10.14);
  const counts = {
    planet: countTriangles(planet),
    cloud: countTriangles(cloud),
    ...shared,
  };
  for (const [name, minimum] of Object.entries(GEOMETRY_MINIMUMS)) {
    assert(
      counts[name] >= minimum * (tier === "low" ? 0.6 : 1),
      tier + "/" + name + " below triangle minimum",
    );
  }
  report.tiers[tier] = counts;
  planet.dispose();
  cloud.dispose();
}
await writeFile(
  new URL("./geometry-report.json", import.meta.url),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
