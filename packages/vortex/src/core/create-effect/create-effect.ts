import type { BatchManager } from '../batch-manager';
import type { ReactiveContext } from '../reactive-context';

export class Effect {
  #cleanup: (() => void) | undefined;

  #isActive = true;

  constructor(
    private readonly fn: () => (() => void) | void,
    private readonly context: ReactiveContext,
    private readonly batchManager: BatchManager,
  ) {
    Promise.resolve().then(() => {
      this.initializeEffect();
    });
  }

  public run() {
    if (!this.#isActive) {
      return;
    }

    if (this.#cleanup) {
      this.#cleanup();
    }

    try {
      this.#cleanup = this.fn() as (() => void) | undefined;
    } finally {
    }
  }

  private executor = () => {
    if (this.batchManager.batchDepth > 0) {
      this.batchManager.queueEffect(this);
    } else {
      try {
        this.run();
      } finally {
      }
    }
  };

  private initializeEffect() {
    this.context.track(this.executor);
  }

  public stop() {
    this.#isActive = false;

    if (this.#cleanup) {
      this.#cleanup();
    }
  }
}
