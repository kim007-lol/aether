import { App } from "./app/App";
import { showFallback } from "./ui/Fallback";
const probe = document.createElement("canvas");
const gl = probe.getContext("webgl2");
const fallback =
  new URLSearchParams(location.search).has("forceFallback") || !gl;
if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
if (fallback) showFallback();
else new App();
