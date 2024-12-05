export class ReactiveContext {
  #currentActive: (() => void) | null = null;

  public track(fn: () => void) {
    const previousActive = this.#currentActive;

    this.#currentActive = fn;

    try {
      fn();
    } finally {
      this.#currentActive = previousActive;
    }
  }

  public getActive() {
    return this.#currentActive;
  }
}
