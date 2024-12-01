import type { ReactiveContext } from '../reactive-context';

export class Effect {
  #cleanup: (() => void) | undefined;

  #isActive = true;

  constructor(
    private readonly fn: () => (() => void) | void,
    private readonly context: ReactiveContext,
  ) {
    Promise.resolve().then(() => {
      this.initializeEffect();
    });
  }

  private executor = () => {
    if (!this.#isActive) {
      return;
    }

    try {
      if (!this.#isActive && this.#cleanup) {
        this.#cleanup();
      }

      this.#cleanup = this.fn() as (() => void) | undefined;
    } finally {
    }
  };

  private initializeEffect() {
    if (!this.#isActive) {
      return;
    }

    if (this.#cleanup) {
      this.#cleanup();
    }

    this.context.track(this.executor);
  }

  public stop() {
    if (this.#cleanup) {
      this.#cleanup();
    }

    this.#isActive = false;
  }
}
