export class ReactiveContext {
  private stack: Array<() => void> = [];

  private currentActive: (() => void) | null = null;

  public track(fn: () => void) {
    this.stack.push(fn);
    this.currentActive = fn;
    fn();
    this.stack.pop();
    this.currentActive = this.stack[this.stack.length - 1] || null;
  }

  public getActive() {
    return this.currentActive;
  }
}
