import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapterAt, chapterStops } from "../config/chapters";

gsap.registerPlugin(ScrollTrigger);
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export class ScrollDirector {
  readonly lenis: Lenis;
  target = 0;
  progress = 0;
  velocity = 0;
  readonly reduced: boolean;
  private previousTarget = 0;
  private reducedChapter = 0;
  private replayDelay: gsap.core.Tween | null = null;
  private readonly tick = (time: number) => {
    if (!document.hidden) this.lenis.raf(time * 1000);
  };
  private readonly onScroll = () => {
    this.target = clamp(this.lenis.scroll / Math.max(1, this.lenis.limit));
  };
  private readonly onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      target?.matches("input,textarea,select,[contenteditable=true]")
    )
      return;
    if (event.code === "Space" && target?.closest("button,a")) return;
    let destination: number | undefined;
    const chapter = chapterAt(this.target + 0.001);
    if (
      event.code === "ArrowDown" ||
      event.code === "PageDown" ||
      event.code === "Space"
    )
      destination = chapterStops[Math.min(5, chapter + 1)];
    if (event.code === "ArrowUp" || event.code === "PageUp")
      destination = chapterStops[Math.max(0, chapter - 1)];
    if (event.code === "Home") destination = 0;
    if (event.code === "End") destination = 1;
    if (destination !== undefined) {
      event.preventDefault();
      this.jumpTo(destination);
    }
  };
  constructor(reduced: boolean) {
    this.reduced = reduced;
    this.lenis = new Lenis({
      duration: 1.4,
      smoothWheel: true,
      autoRaf: false,
    });
    this.lenis.on("scroll", ScrollTrigger.update);
    this.lenis.on("scroll", this.onScroll);
    gsap.ticker.add(this.tick);
    gsap.ticker.lagSmoothing(0);
    window.addEventListener("keydown", this.onKey);
    this.onScroll();
  }
  update(dt: number): void {
    // Exponential damping is invariant to frame rate; velocity uses normalized page travel.
    const damping = 1 - Math.exp(-dt * 6);
    const speed = Math.max(
      -1,
      Math.min(1, (this.target - this.previousTarget) / Math.max(dt, 0.001)),
    );
    this.velocity += (speed - this.velocity) * damping;
    this.previousTarget = this.target;
    if (!this.reduced) this.progress += (this.target - this.progress) * damping;
    else {
      const next = chapterAt(this.target);
      if (next !== this.reducedChapter) {
        this.reducedChapter = next;
        gsap.to(this, {
          progress: chapterStops[next],
          duration: 0.8,
          ease: "power3.inOut",
          overwrite: true,
        });
      }
      this.velocity = 0;
    }
  }
  jumpTo(progress: number, duration = 1.6): void {
    this.replayDelay?.kill();
    this.lenis.scrollTo(clamp(progress) * this.lenis.limit, {
      duration: this.reduced ? 0.8 : duration,
      easing: gsap.parseEase("expo.inOut"),
      force: true,
    });
  }
  setProgress(progress: number): void {
    this.replayDelay?.kill();
    gsap.killTweensOf(this);
    const value = clamp(progress);
    this.lenis.scrollTo(value * this.lenis.limit, {
      immediate: true,
      force: true,
    });
    this.target = value;
    this.progress = value;
    this.previousTarget = value;
    this.reducedChapter = chapterAt(value);
    this.velocity = 0;
    ScrollTrigger.update();
  }
  replay(): void {
    this.setProgress(0);
    this.replayDelay = gsap.delayedCall(0.15, () =>
      this.lenis.scrollTo(this.lenis.limit, {
        duration: 40,
        easing: (value: number) => value,
        force: true,
      }),
    );
  }
  destroy(): void {
    this.replayDelay?.kill();
    gsap.killTweensOf(this);
    gsap.ticker.remove(this.tick);
    window.removeEventListener("keydown", this.onKey);
    this.lenis.destroy();
  }
}
