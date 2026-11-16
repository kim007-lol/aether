import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters, chapterAt, chapterStops } from "../config/chapters";
import { TextReveal } from "./TextReveal";
export type QualityChoice = "auto" | "low" | "medium" | "high" | "ultra";
interface HudCallbacks {
  jumpTo: (progress: number) => void;
  setQuality: (quality: QualityChoice) => void;
  toggleAudio: () => void;
  replay: () => void;
}
const choices: QualityChoice[] = ["auto", "low", "medium", "high", "ultra"];
export class Hud {
  private readonly copies = Array.from(
    document.querySelectorAll<HTMLElement>("[data-copy]"),
  );
  private readonly reveals: TextReveal[];
  private readonly nav = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-chapter]"),
  );
  private readonly hero = document.querySelector<HTMLElement>("#hero")!;
  private readonly hint = document.querySelector<HTMLElement>("#scroll-hint")!;
  private readonly line =
    document.querySelector<HTMLElement>("#progress-line")!;
  private readonly live = document.querySelector<HTMLElement>("#live-chapter")!;
  private readonly announcement = document.querySelector<HTMLElement>(
    "#chapter-announcement",
  )!;
  private readonly counter =
    document.querySelector<HTMLElement>("#chapter-counter")!;
  private readonly footer =
    document.querySelector<HTMLElement>("#footer-line")!;
  private readonly actions =
    document.querySelector<HTMLElement>("#final-actions")!;
  private readonly sound =
    document.querySelector<HTMLButtonElement>("#sound-toggle")!;
  private readonly quality =
    document.querySelector<HTMLButtonElement>("#quality-toggle")!;
  private readonly abort = new AbortController();
  private readonly trigger: ScrollTrigger;
  private chapter = -1;
  private copy = -1;
  private choice: QualityChoice = "auto";
  private finalVisible = false;
  constructor(callbacks: HudCallbacks, reduced: boolean) {
    this.reveals = this.copies.map((copy) => new TextReveal(copy, reduced));
    const options = { signal: this.abort.signal };
    for (let i = 0; i < this.nav.length; i++)
      this.nav[i].addEventListener(
        "click",
        () => callbacks.jumpTo(chapterStops[i]),
        options,
      );
    document
      .querySelectorAll<HTMLButtonElement>("[data-action=home]")
      .forEach((button) =>
        button.addEventListener("click", () => callbacks.jumpTo(0), options),
      );
    document
      .querySelector<HTMLButtonElement>("[data-action=replay]")
      ?.addEventListener("click", callbacks.replay, options);
    this.sound.addEventListener("click", callbacks.toggleAudio, options);
    this.quality.addEventListener(
      "click",
      () => {
        this.choice =
          choices[(choices.indexOf(this.choice) + 1) % choices.length];
        callbacks.setQuality(this.choice);
        this.setQuality(this.choice);
      },
      options,
    );
    gsap.registerPlugin(ScrollTrigger);
    this.trigger = ScrollTrigger.create({
      start: 0,
      end: () =>
        Math.max(1, document.documentElement.scrollHeight - innerHeight),
      onUpdate: (trigger) => this.update(trigger.progress),
      invalidateOnRefresh: true,
    });
    gsap.set(this.actions, { autoAlpha: 0 });
    this.actions.inert = true;
    this.update(0);
  }
  update(progress: number): void {
    const index = chapterAt(progress);
    const copy = progress > 0.042 ? index : -1;
    this.line.style.transform = "scaleX(" + progress + ")";
    const heroOpacity = Math.max(0, 1 - progress / 0.035);
    this.hero.style.opacity = String(heroOpacity);
    this.hero.style.visibility = heroOpacity > 0 ? "visible" : "hidden";
    this.hint.style.opacity = progress < 0.03 ? "1" : "0";
    if (copy !== this.copy) {
      if (this.copy >= 0) this.reveals[this.copy].hide();
      if (copy >= 0) this.reveals[copy].show();
      this.copy = copy;
    }
    if (index !== this.chapter) {
      this.chapter = index;
      this.live.textContent = chapters[index].label;
      this.announcement.textContent = chapters[index].name;
      this.counter.textContent = String(index + 1).padStart(2, "0");
      for (let i = 0; i < this.nav.length; i++) {
        if (i === index) this.nav[i].setAttribute("aria-current", "step");
        else this.nav[i].removeAttribute("aria-current");
      }
    }
    const finalVisible = progress > 0.93;
    if (finalVisible !== this.finalVisible) {
      this.finalVisible = finalVisible;
      this.actions.inert = !finalVisible;
      gsap.to(this.actions, {
        autoAlpha: finalVisible ? 1 : 0,
        duration: 0.7,
        overwrite: true,
      });
      gsap.to(this.footer, {
        autoAlpha: finalVisible ? 1 : 0,
        duration: 0.7,
        overwrite: true,
      });
    }
  }
  setQuality(label: string): void {
    const normalized = label.toLowerCase();
    if (choices.includes(normalized as QualityChoice))
      this.choice = normalized as QualityChoice;
    const text = label.charAt(0).toUpperCase() + label.slice(1);
    document.querySelector<HTMLElement>("#quality-value")!.textContent = text;
    this.quality.setAttribute(
      "aria-label",
      "Quality: " + text + ". Change quality",
    );
  }
  setSound(enabled: boolean): void {
    this.sound.setAttribute("aria-pressed", String(enabled));
    this.sound.setAttribute(
      "aria-label",
      enabled ? "Disable ambient sound" : "Enable ambient sound",
    );
    this.sound.querySelector<HTMLElement>(".sound-text")!.textContent = enabled
      ? "Sound on"
      : "Sound off";
  }
  destroy(): void {
    this.abort.abort();
    this.trigger.kill();
    for (const reveal of this.reveals) reveal.destroy();
    gsap.killTweensOf(this.actions);
    gsap.killTweensOf(this.footer);
  }
}
