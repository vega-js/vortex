import type { BatchManager } from '../batch-manager';
import type { ReactiveContext } from '../reactive-context';

export class Effect {
  readonly #fn: () => (() => void) | void;

  #cleanup: (() => void) | undefined;

  #isActive = true;

  #context: ReactiveContext;

  #batch: BatchManager;

  constructor(
    fn: () => (() => void) | void,
    context: ReactiveContext,
    batch: BatchManager,
  ) {
    this.#fn = fn;
    this.#context = context;
    this.#batch = batch;
    // TODO
    // Promise.resolve().then(() => {
    this.initializeEffect();
    // });
  }

  public run() {
    if (!this.#isActive) {
      return;
    }

    if (this.#cleanup) {
      this.#cleanup();
    }

    try {
      this.#cleanup = this.#fn() as (() => void) | undefined;
    } finally {
    }
  }

  private executor = () => {
    if (this.#batch.batchDepth > 0) {
      this.#batch.queueEffect(this);
    } else {
      try {
        this.run();
      } finally {
      }
    }
  };

  private initializeEffect() {
    this.#context.track(this.executor);
  }

  public stop() {
    this.#isActive = false;

    if (this.#cleanup) {
      this.#cleanup();
    }
  }
}
