import { gsap } from "gsap";
import { chapters } from "../config/chapters";
export function showFallback(): void {
  if (document.body.classList.contains("fallback")) return;
  document.body.classList.add("fallback");
  document.querySelector("#loader")?.remove();
  document.querySelector("#webgl")?.replaceChildren();
  const orb = document.createElement("div");
  orb.className = "fallback-orb";
  orb.setAttribute("aria-hidden", "true");
  document.body.prepend(orb);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const replay = { progress: 0 };
  let active = 0;
  let replayChapter = -1;
  const cancelReplay = () => gsap.killTweensOf(replay);
  const scrollToChapter = (index: number) => {
    cancelReplay();
    document
      .getElementById(chapters[index].id)
      ?.scrollIntoView({
        behavior: reduced ? "instant" : "smooth",
        block: "start",
      });
  };
  document
    .querySelectorAll<HTMLButtonElement>("[data-chapter]")
    .forEach((button) =>
      button.addEventListener(
        "click",
        () => scrollToChapter(Number(button.dataset.chapter)),
        options,
      ),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-action=home]")
    .forEach((button) =>
      button.addEventListener(
        "click",
        () => {
          cancelReplay();
          window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
        },
        options,
      ),
    );
  document
    .querySelector<HTMLButtonElement>("[data-action=replay]")
    ?.addEventListener(
      "click",
      () => {
        cancelReplay();
        replay.progress = 0;
        replayChapter = -1;
        window.scrollTo(0, 0);
        gsap.to(replay, {
          progress: 1,
          duration: 40,
          ease: "none",
          onUpdate: () => {
            if (reduced) {
              const next = Math.min(5, Math.floor(replay.progress * 6));
              if (next !== replayChapter) {
                replayChapter = next;
                document
                  .getElementById(chapters[next].id)
                  ?.scrollIntoView({ behavior: "instant" });
              }
            } else
              window.scrollTo(
                0,
                replay.progress *
                  (document.documentElement.scrollHeight - innerHeight),
              );
          },
        });
      },
      options,
    );
  window.addEventListener("wheel", cancelReplay, {
    passive: true,
    signal: abort.signal,
  });
  window.addEventListener("touchstart", cancelReplay, {
    passive: true,
    signal: abort.signal,
  });
  window.addEventListener(
    "keydown",
    (event) => {
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
      if (
        event.code === "ArrowDown" ||
        event.code === "PageDown" ||
        event.code === "Space"
      )
        destination = Math.min(5, active + 1);
      if (event.code === "ArrowUp" || event.code === "PageUp")
        destination = Math.max(0, active - 1);
      if (event.code === "Home") destination = 0;
      if (event.code === "End") destination = 5;
      if (destination !== undefined) {
        event.preventDefault();
        scrollToChapter(destination);
      }
    },
    options,
  );
  document.querySelector<HTMLElement>("#journey")!.style.height = "auto";
  const finalActions = document.querySelector<HTMLElement>("#final-actions");
  if (finalActions) finalActions.inert = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          const index = chapters.findIndex(
            (chapter) => chapter.id === entry.target.id,
          );
          if (index < 0) continue;
          active = index;
          document.querySelector<HTMLElement>("#live-chapter")!.textContent =
            chapters[index].label;
          document.querySelector<HTMLElement>(
            "#chapter-announcement",
          )!.textContent = chapters[index].name;
          document.querySelector<HTMLElement>("#chapter-counter")!.textContent =
            String(index + 1).padStart(2, "0");
          document
            .querySelectorAll<HTMLButtonElement>("[data-chapter]")
            .forEach((button, i) => {
              if (i === index) button.setAttribute("aria-current", "step");
              else button.removeAttribute("aria-current");
            });
        }
    },
    { threshold: 0.3 },
  );
  document
    .querySelectorAll<HTMLElement>(".chapter")
    .forEach((section) => observer.observe(section));
  window.addEventListener(
    "pagehide",
    () => {
      observer.disconnect();
      cancelReplay();
      abort.abort();
    },
    { once: true },
  );
}
export class Fallback {
  static show(): void {
    showFallback();
  }
}
