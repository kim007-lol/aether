import {
  TIERS,
  TIER_NAMES,
  isTier,
  type Tier,
  type TierName,
} from "../config/quality";
export class Quality {
  tier: Tier;
  automatic = true;
  steps = 0;
  private frames = 0;
  private sum = 0;
  private delay = 0;
  constructor(gpu: string) {
    let name: TierName = "medium";
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (
      !matchMedia("(pointer: coarse)").matches &&
      navigator.hardwareConcurrency >= 8 &&
      /nvidia|radeon|geforce|apple m/i.test(gpu)
    )
      name = "high";
    if (
      /swiftshader|llvmpipe|software/i.test(gpu) ||
      (nav.deviceMemory ?? 8) <= 2
    )
      name = "low";
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("aether-quality");
    } catch {
      /* Storage can be denied. */
    }
    const forced = new URLSearchParams(location.search).get("tier");
    if (isTier(forced)) {
      name = forced;
      this.automatic = false;
    } else if (isTier(saved)) {
      name = saved;
      this.automatic = false;
    }
    this.tier = TIERS[name];
  }
  set(name: string) {
    this.automatic = name === "auto";
    if (isTier(name)) this.tier = TIERS[name];
    this.frames = 0;
    this.sum = 0;
    try {
      localStorage.setItem("aether-quality", name);
    } catch {
      /* Storage can be denied. */
    }
  }
  sample(ms: number): Tier | null {
    if (!this.automatic || this.steps >= 2) return null;
    this.sum += Math.max(ms, this.delay);
    this.frames++;
    if (this.frames < 90) return null;
    const avg = this.sum / this.frames;
    this.frames = 0;
    this.sum = 0;
    if (avg <= 22) return null;
    const index = TIER_NAMES.indexOf(this.tier.name);
    if (index === 0) return null;
    this.tier = TIERS[TIER_NAMES[index - 1]];
    this.steps++;
    return this.tier;
  }
  forceSlow(ms: number) {
    this.delay = ms;
  }
}
