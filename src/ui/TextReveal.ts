import { gsap } from 'gsap';
export class TextReveal {
  private readonly heading: HTMLElement;
  private readonly original: string;
  private lines: HTMLElement[] = [];
  private active = false;
  private resizeTimer = 0;
  private readonly onResize = () => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.split(), 160);
  };
  constructor(private readonly element: HTMLElement, private readonly reduced: boolean) {
    this.heading = element.querySelector<HTMLElement>('.chapter-headline')!;
    this.original = this.heading.textContent ?? '';
    this.split();
    void document.fonts.ready.then(() => this.split());
    window.addEventListener('resize', this.onResize);
  }
  private split(): void {
    if (this.reduced) return;
    this.heading.textContent = '';
    const words = this.original.split(' ');
    const spans = words.map((word) => {
      const span = document.createElement('span');
      span.textContent = word + ' '; span.style.display = 'inline-block';
      this.heading.append(span); return span;
    });
    const groups: string[] = [];
    let lastTop = -1;
    for (const span of spans) {
      if (span.offsetTop !== lastTop) { groups.push(''); lastTop = span.offsetTop; }
      groups[groups.length - 1] += span.textContent;
    }
    this.heading.textContent = '';
    this.heading.setAttribute('aria-label', this.original);
    this.lines = groups.map((line) => {
      const mask = document.createElement('span'); mask.className = 'line-mask'; mask.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span'); inner.className = 'line-inner'; inner.textContent = line.trim();
      mask.append(inner); this.heading.append(mask); return inner;
    });
    gsap.set(this.lines, { yPercent: this.active ? 0 : 110 });
  }
  show(): void {
    if (this.active) return;
    this.active = true;
    this.element.classList.add('is-active');
    gsap.killTweensOf(this.element);
    gsap.to(this.element, { autoAlpha: 1, duration: this.reduced ? 0.4 : 0.65, ease: 'power2.out', overwrite: true });
    if (!this.reduced) {
      gsap.fromTo(this.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', overwrite: true });
      gsap.fromTo(this.element.querySelector('.chapter-label'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', overwrite: true });
      gsap.fromTo(this.element.querySelector('.chapter-body'), { y: 10, opacity: 0 }, { y: 0, opacity: 0.84, duration: 1, delay: 0.15, ease: 'expo.out', overwrite: true });
    }
  }
  hide(): void {
    if (!this.active) return;
    this.active = false;
    this.element.classList.remove('is-active');
    gsap.to(this.element, { autoAlpha: 0, duration: this.reduced ? 0.25 : 0.5, ease: 'power2.inOut', overwrite: true });
    if (!this.reduced) gsap.to(this.lines, { yPercent: -110, duration: 0.5, ease: 'power2.inOut', overwrite: true });
  }
  destroy(): void {
    window.removeEventListener('resize', this.onResize); window.clearTimeout(this.resizeTimer);
    gsap.killTweensOf(this.element); gsap.killTweensOf(this.lines);
    this.heading.textContent = this.original;
  }
}
