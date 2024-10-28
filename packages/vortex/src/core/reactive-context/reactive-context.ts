export class ReactiveContext {
  private stack: Array<() => void> = [];

  track(fn: () => void) {
    this.stack.push(fn);
    fn();
    this.stack.pop();
  }

  getActive() {
    return this.stack[this.stack.length - 1];
  }
}
