import type { CameraRig } from "../core/CameraRig";
export class Events {
  private readonly abort = new AbortController();
  constructor(
    canvas: HTMLCanvasElement,
    rig: CameraRig,
    resize: () => void,
    shock: () => void,
  ) {
    const options = { signal: this.abort.signal };
    window.addEventListener("resize", resize, options);
    window.addEventListener(
      "pointermove",
      (e) => {
        rig.rawPointer.set(
          (e.clientX / innerWidth) * 2 - 1,
          1 - (e.clientY / innerHeight) * 2,
        );
      },
      options,
    );
    let downX = 0,
      downY = 0,
      downType = "";
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        rig.rawPointer.set(
          (e.clientX / innerWidth) * 2 - 1,
          1 - (e.clientY / innerHeight) * 2,
        );
        downX = e.clientX;
        downY = e.clientY;
        downType = e.pointerType;
      },
      options,
    );
    window.addEventListener(
      "pointerup",
      (e) => {
        if (
          downType !== "" &&
          Math.hypot(e.clientX - downX, e.clientY - downY) < 14 &&
          !(e.target instanceof Element && e.target.closest("button,a"))
        )
          shock();
        downType = "";
      },
      options,
    );
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        const overlay = document.createElement("div");
        overlay.className = "context-overlay";
        overlay.setAttribute("role", "alert");
        overlay.textContent = "Graphics context lost, reloading";
        document.body.appendChild(overlay);
      },
      options,
    );
    canvas.addEventListener(
      "webglcontextrestored",
      () => location.reload(),
      options,
    );
  }
  dispose() {
    this.abort.abort();
  }
}
