export class TaskQueue {
  private last = performance.now();
  private completed = 0;
  constructor(
    private readonly total: number,
    private readonly progress: (p: number) => void,
  ) {}
  async yield() {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    this.last = performance.now();
  }
  async checkpoint() {
    if (performance.now() - this.last >= 7) await this.yield();
  }
  async task<T>(action: () => T | Promise<T>): Promise<T> {
    await this.yield();
    const value = await action();
    this.completed++;
    this.progress(Math.min(0.94, (this.completed / this.total) * 0.94));
    return value;
  }
}
