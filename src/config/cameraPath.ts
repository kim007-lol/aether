import { CatmullRomCurve3, Euler, Vector3 } from "three";
export const SUN = new Vector3(1, 0.28, 0.55).normalize();
export const FIELD = new Vector3(70, 0, -60),
  NEBULA = new Vector3(170, 15, -250),
  CORE = new Vector3(190, 0, -290);
export const RING_EULER = new Euler(0.28, 0, -0.12);
export const PATH_STOPS = [
  0, 0.08, 0.16, 0.25, 0.34, 0.43, 0.52, 0.58, 0.64, 0.7, 0.78, 0.86, 1,
];
const ring = (x: number, y: number, z: number) =>
  new Vector3(x, y, z).applyEuler(RING_EULER);
export const PATH_POSITIONS = [
  new Vector3(0, 7, 52),
  new Vector3(-6, 5, 34),
  new Vector3(-9, 6, 21),
  new Vector3(-14, 3, 17),
  ring(16.5, 3, 8),
  ring(20.1, 0.6, -6),
  ring(18, -0.4, -17.35),
  new Vector3(48, 2, -26),
  new Vector3(62, 0, -50),
  new Vector3(78, -3, -72),
  new Vector3(110, 6, -112),
  new Vector3(150, 8, -190),
  new Vector3(190, 2, -268),
];
export const PATH_TARGETS = [
  new Vector3(0, 5, 0),
  new Vector3(0, 0, 0),
  new Vector3(0, 0, 0),
  new Vector3(2, 0, 0),
  ring(22, 0, -8),
  ring(17, 0, -20),
  ring(36, 0, -30),
  FIELD.clone(),
  new Vector3(74, 0, -72),
  new Vector3(100, 4, -112),
  new Vector3(150, 12, -200),
  CORE.clone(),
  CORE.clone(),
];
export const positionCurve = new CatmullRomCurve3(
  PATH_POSITIONS,
  false,
  "centripetal",
);
export const targetCurve = new CatmullRomCurve3(
  PATH_TARGETS,
  false,
  "centripetal",
);
positionCurve.arcLengthDivisions = 2048;
targetCurve.arcLengthDivisions = 2048;
function arcMap(curve: CatmullRomCurve3) {
  const lengths = curve.getLengths(2048);
  const total = lengths[2048];
  return PATH_STOPS.map(
    (_, i) => lengths[Math.round((i / (PATH_STOPS.length - 1)) * 2048)] / total,
  );
}
const posArc = arcMap(positionCurve),
  targetArc = arcMap(targetCurve);
function remap(p: number, map: number[]) {
  let i = 0;
  while (i < PATH_STOPS.length - 2 && p > PATH_STOPS[i + 1]) i++;
  const t = (p - PATH_STOPS[i]) / (PATH_STOPS[i + 1] - PATH_STOPS[i]);
  return map[i] + (map[i + 1] - map[i]) * Math.max(0, Math.min(1, t));
}
export function samplePosition(p: number, out: Vector3) {
  return positionCurve.getPointAt(remap(p, posArc), out);
}
export function sampleTarget(p: number, out: Vector3) {
  return targetCurve.getPointAt(remap(p, targetArc), out);
}
export const CAMERA_MOTION_RESERVE = 1.1;
function ease(a: number, b: number, p: number) {
  const t = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
export function composeCamera(
  p: number,
  portrait: boolean,
  position: Vector3,
  target: Vector3,
  right: Vector3,
  up: Vector3,
) {
  const chapterOffset =
    -4 * Math.exp(-Math.pow((p - 0.095) / 0.055, 2)) +
    6.5 * Math.exp(-Math.pow((p - 0.23) / 0.08, 2));
  const final = ease(0.87, 1, p);
  if (!portrait) {
    const x = chapterOffset - 4.2 * final;
    position.addScaledVector(right, x);
    target.addScaledVector(right, x);
  } else {
    const y =
      -4 * ease(0.025, 0.06, p) * (1 - ease(0.27, 0.32, p)) - 4.3 * final;
    position.addScaledVector(up, y);
    target.addScaledVector(up, y);
  }
}
// Check both responsive compositions; reserve covers diagonal pointer travel, drift and basis changes.
const upAxis = new Vector3(0, 1, 0);
export const CLEARANCE_SAMPLES = Array.from({ length: 2002 }, (_, i) => {
  const p = (i % 1001) / 1000,
    position = samplePosition(p, new Vector3()),
    target = sampleTarget(p, new Vector3());
  const forward = target.clone().sub(position).normalize(),
    right = forward.clone().cross(upAxis).normalize(),
    up = right.clone().cross(forward).normalize();
  composeCamera(p, i >= 1001, position, target, right, up);
  return position;
});
export function pathClearance(center: Vector3, radius: number) {
  let min = Infinity;
  for (const point of CLEARANCE_SAMPLES)
    min = Math.min(min, point.distanceTo(center) - radius);
  return min;
}
