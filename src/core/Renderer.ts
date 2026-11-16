import {
  WebGLRenderer,
  SRGBColorSpace,
  NoToneMapping,
  PCFShadowMap,
} from "three";
import type { Tier } from "../config/quality";
export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
    alpha: false,
    stencil: false,
    depth: true,
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor("#05060A");
  renderer.info.autoReset = false;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setSize(innerWidth, innerHeight);
  return renderer;
}
export function resizeRenderer(renderer: WebGLRenderer, tier: Tier) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, tier.dprCap));
  renderer.setSize(innerWidth, innerHeight);
}
export function gpuName(renderer: WebGLRenderer) {
  const gl = renderer.getContext();
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  return ext
    ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
    : "Unavailable";
}
