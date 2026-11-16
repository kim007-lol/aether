import type { App } from "../app/App";
import type { TierName } from "../config/quality";
export function installDebugApi(app: App) {
  const params = new URLSearchParams(location.search);
  if (!import.meta.env.DEV && !params.has("qa")) return;
  const api = {
    ready: app.ready,
    setProgress: (p: number) => app.setProgress(p),
    setTier: (tier: TierName) => app.setTier(tier),
    getInfo: () => app.getInfo(),
    forceSlowFrames: (ms: number) => app.quality.forceSlow(ms),
    setAuto: () => {
      app.quality.set("auto");
    },
    shockwave: () => app.shockwave(),
    getState: () => ({
      reduced: app.reduced,
      cameraParallaxEnabled: !app.reduced,
      cameraPosition: app.rig.camera.position.toArray(),
      cameraRotation: app.rig.camera.rotation.toArray(),
      pointer: app.rig.pointer.toArray(),
      target: app.scroll.target,
      audio: app.audio.enabled,
      audioPreferred: app.audio.preferred,
      shockwaves: app.shockwaves,
      automatic: app.quality.automatic,
      steps: app.quality.steps,
    }),
    dispose: () => app.dispose(),
  };
  Object.assign(window, { __AETHER__: api, AETHER: api });
}
