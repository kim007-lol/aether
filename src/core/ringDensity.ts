import { smoothstep } from "./math";
export function ringDensity(r: number) {
  let density = smoothstep(14, 14.5, r) * (1 - smoothstep(29, 30, r));
  density *= 1 - 0.96 * Math.exp(-Math.pow((r - 18.2) / 0.5, 4));
  density *= 1 - 0.98 * Math.exp(-Math.pow((r - 22.6) / 0.9, 4));
  density *= 1 - 0.9 * Math.exp(-Math.pow((r - 26.8) / 0.3, 4));
  return density * (0.75 + 0.15 * Math.sin(r * 20));
}
