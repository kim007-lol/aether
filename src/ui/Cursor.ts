export class Cursor {
  private readonly dot = document.querySelector<HTMLElement>('.cursor-dot')!;
  private readonly ring = document.querySelector<HTMLElement>('.cursor-ring')!;
  private readonly fine = matchMedia('(pointer: fine)');
  private x = innerWidth * 0.5;
  private y = innerHeight * 0.5;
  private ringX = this.x;
  private ringY = this.y;
  private scale = 1;
  private hovering = false;
  private readonly abort = new AbortController();
  constructor(private readonly reduced = false) {
    const options = { signal: this.abort.signal };
    window.addEventListener('pointermove', (event) => {
      if (!this.fine.matches || event.pointerType === 'touch') return;
      this.x = event.clientX; this.y = event.clientY;
      this.hovering = Boolean((event.target as HTMLElement | null)?.closest('button,a'));
      document.body.classList.add('cursor-active');
    }, options);
    document.documentElement.addEventListener('pointerleave', () => document.body.classList.remove('cursor-active'), options);
    window.addEventListener('blur', () => document.body.classList.remove('cursor-active'), options);
    this.fine.addEventListener('change', () => document.body.classList.remove('cursor-active'), options);
  }
  update(dt: number, coreActive = false, coreProximity = 0): void {
    if (!this.fine.matches) return;
    const damping = this.reduced ? 1 : 1 - Math.exp(-dt * 12);
    this.ringX += (this.x - this.ringX) * damping;
    this.ringY += (this.y - this.ringY) * damping;
    this.scale += ((this.hovering || (coreActive && coreProximity > 0.35) ? 1.65 : 1) - this.scale) * damping;
    this.dot.style.transform = 'translate3d(' + (this.x - 2) + 'px,' + (this.y - 2) + 'px,0)';
    this.ring.style.transform = 'translate3d(' + (this.ringX - 16) + 'px,' + (this.ringY - 16) + 'px,0) scale(' + this.scale + ')';
    this.ring.style.borderColor = coreActive && coreProximity > 0.35 ? 'var(--cyan)' : '';
  }
  destroy(): void { this.abort.abort(); document.body.classList.remove('cursor-active'); }
}
