import type { Effect } from '../create-effect';

export class BatchManager {
  public batchDepth = 0;

  public batchedEffect: Effect | undefined;

  readonly #MAX_ITERATIONS = 100;

  #batchIteration = 0;

  public startBatch() {
    this.batchDepth++;
  }

  public endBatch() {
    if (this.batchDepth > 1) {
      this.batchDepth--;

      return;
    }

    let error: unknown;
    let hasError = false;

    while (this.batchedEffect !== undefined) {
      let effect: Effect | undefined = this.batchedEffect;

      this.batchedEffect = undefined;
      this.#batchIteration++;

      if (this.#batchIteration > this.#MAX_ITERATIONS) {
        throw new Error(
          `Cycle detected: Too many iterations in a single batch (${this.#batchIteration}).`,
        );
      }

      while (effect !== undefined) {
        try {
          effect.run();
        } catch (err) {
          if (!hasError) {
            error = err;
            hasError = true;
          }
        }

        effect = undefined;
      }
    }

    this.batchDepth--;
    this.#batchIteration = 0;

    if (hasError) {
      throw error;
    }
  }

  public batch<T>(fn: () => T): T {
    if (this.batchDepth > 0) {
      return fn();
    }

    this.startBatch();

    try {
      return fn();
    } finally {
      this.endBatch();
    }
  }

  public queueEffect(effect: Effect) {
    this.batchedEffect = effect;
  }
}
