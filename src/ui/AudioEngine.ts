const STORAGE_KEY = "aether-sound";
const BASE_GAIN = 0.085;
export class AudioEngine {
  enabled = false;
  preferred = false;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly oscillators: OscillatorNode[] = [];
  private suspendTimer = 0;
  private readonly visibility = () => {
    if (!this.context) return;
    if (document.hidden) void this.context.suspend();
    else if (this.enabled) void this.context.resume();
  };
  constructor() {
    try {
      this.preferred = localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      this.preferred = false;
    }
    document.addEventListener("visibilitychange", this.visibility);
  }
  private create(): void {
    this.context = new AudioContext();
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 550;
    filter.Q.value = 0.65;
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    filter.connect(this.master);
    this.master.connect(this.context.destination);
    const frequencies = [55, 82.4069, 110];
    const detunes = [-5, 3, 7];
    for (let i = 0; i < frequencies.length; i++) {
      const oscillator = this.context.createOscillator();
      oscillator.type = i === 1 ? "triangle" : "sine";
      oscillator.frequency.value = frequencies[i];
      oscillator.detune.value = detunes[i];
      const gain = this.context.createGain();
      gain.gain.value = 0.3;
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start();
      this.oscillators.push(oscillator);
    }
    const lfo = this.context.createOscillator();
    const depth = this.context.createGain();
    lfo.frequency.value = 0.065;
    depth.gain.value = 180;
    lfo.connect(depth);
    depth.connect(filter.frequency);
    lfo.start();
    this.oscillators.push(lfo);
  }
  async toggle(): Promise<boolean> {
    window.clearTimeout(this.suspendTimer);
    if (!this.context) this.create();
    const context = this.context!;
    const gain = this.master!.gain;
    this.enabled = !this.enabled;
    this.preferred = this.enabled;
    try {
      localStorage.setItem(STORAGE_KEY, this.enabled ? "on" : "off");
    } catch {
      /* Private browsing can deny persistence. */
    }
    if (this.enabled) await context.resume();
    const now = context.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(this.enabled ? BASE_GAIN : 0, now + 0.4);
    if (!this.enabled)
      this.suspendTimer = window.setTimeout(() => {
        void context.suspend();
      }, 450);
    return this.enabled;
  }
  swell(chapter: number): void {
    if (!this.context || !this.master || !this.enabled) return;
    const now = this.context.currentTime;
    const gain = this.master.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(
      BASE_GAIN + 0.025 + chapter * 0.003,
      now + 0.8,
    );
    gain.linearRampToValueAtTime(BASE_GAIN, now + 3.2);
  }
  dispose(): void {
    window.clearTimeout(this.suspendTimer);
    document.removeEventListener("visibilitychange", this.visibility);
    for (const oscillator of this.oscillators) {
      oscillator.stop();
      oscillator.disconnect();
    }
    this.master?.disconnect();
    if (this.context) void this.context.close();
    this.context = null;
  }
}
