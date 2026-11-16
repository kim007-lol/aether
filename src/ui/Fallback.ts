import { chapters } from '../config/chapters';
export function showFallback(): void {
  document.body.classList.add('fallback');
  document.querySelector('#loader')?.remove();
  document.querySelector('#webgl')?.replaceChildren();
  const orb = document.createElement('div'); orb.className = 'fallback-orb'; orb.setAttribute('aria-hidden', 'true');
  document.body.prepend(orb);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollToChapter = (index: number) => document.getElementById(chapters[index].id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
  document.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach((button) => button.addEventListener('click', () => scrollToChapter(Number(button.dataset.chapter))));
  document.querySelectorAll<HTMLButtonElement>('[data-action=home]').forEach((button) => button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })));
  document.querySelector<HTMLButtonElement>('[data-action=replay]')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' }));
  document.querySelector<HTMLElement>('#journey')!.style.height = 'auto';
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) {
      const index = chapters.findIndex((chapter) => chapter.id === entry.target.id);
      if (index < 0) continue;
      document.querySelector<HTMLElement>('#live-chapter')!.textContent = chapters[index].label;
      document.querySelector<HTMLElement>('#chapter-announcement')!.textContent = chapters[index].name;
      document.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach((button, i) => {
        if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
      });
    }
  }, { threshold: 0.3 });
  document.querySelectorAll<HTMLElement>('.chapter').forEach((section) => observer.observe(section));
}
export class Fallback { static show(): void { showFallback(); } }
