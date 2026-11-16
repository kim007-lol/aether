import { gsap } from 'gsap';
export class Loader {
  private readonly element = document.querySelector<HTMLElement>('#loader')!;
  private readonly counter = this.element.querySelector<HTMLElement>('.loader-count')!;
  private readonly arc = this.element.querySelector<SVGCircleElement>('.loader-arc')!;
  private readonly started = performance.now();
  private value = { progress: 0 };
  private finished = false;
  private render = (): void => {
    this.counter.textContent = Math.round(this.value.progress * 100).toString().padStart(3, '0');
    this.arc.style.strokeDashoffset = String(553 * (1 - this.value.progress));
  };
  setProgress(progress: number): void {
    gsap.to(this.value, { progress: Math.min(1, Math.max(this.value.progress, progress)), duration: 0.35, ease: 'power2.out', overwrite: true, onUpdate: this.render });
  }
  async finish(): Promise<void> {
    if (this.finished) return;
    this.finished = true;
    this.setProgress(1);
    const minimumDelay = Math.max(0.4, (2200 - (performance.now() - this.started)) / 1000);
    await new Promise<void>((resolve) => {
      gsap.delayedCall(minimumDelay, () => {
        this.counter.textContent = '100';
        this.element.dataset.loaded = 'true';
        gsap.timeline({ onComplete: () => { this.element.remove(); resolve(); } })
          .to(this.element.querySelector('.loader-orbit'), { scale: 4, opacity: 0, duration: 1.8, ease: 'expo.inOut' }, 0)
          .to(this.element.querySelectorAll('.loader-wordmark,.loader-status'), { opacity: 0, duration: 0.6 }, 0)
          .to(this.element, { opacity: 0, duration: 1.8, ease: 'power2.inOut' }, 0);
      });
    });
  }
  update(): void { this.render(); }
  dispose(): void { gsap.killTweensOf(this.value); this.element.remove(); }
}
