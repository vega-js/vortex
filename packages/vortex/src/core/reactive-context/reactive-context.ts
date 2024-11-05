export class ReactiveContext {
  private currentActive: (() => void) | null = null;

  public track(fn: () => void) {
    const previousActive = this.currentActive;

    this.currentActive = fn;
    fn();
    this.currentActive = previousActive;
  }

  public getActive() {
    return this.currentActive;
  }
}
