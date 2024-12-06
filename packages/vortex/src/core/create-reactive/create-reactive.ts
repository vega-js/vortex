import type { Reactive } from '../../types';
import type { BatchManager } from '../batch-manager';
import type { ReactiveContext } from '../reactive-context';

export class ReactiveValue<Value> implements Reactive<Value> {
  public type = 'reactive' as const;

  #callbacks: Set<(value: Value) => void> | null = null;

  #currentValue: Value;

  readonly #initialValue: Value;

  readonly #context: ReactiveContext;

  readonly #batch: BatchManager;

  constructor(
    initialValue: Value,
    context: ReactiveContext,
    batchManager: BatchManager,
  ) {
    this.#initialValue = initialValue;
    this.#currentValue = initialValue;
    this.#context = context;
    this.#batch = batchManager;
  }

  private setContext() {
    const activeReactive = this.#context.getActive();

    if (activeReactive) {
      this.#callbacks ||= new Set();
      this.#callbacks.add(activeReactive);
    }
  }

  public get value(): Value {
    this.setContext();

    return this.#currentValue;
  }

  public set(value: Value | ((prev: Value) => Value)): void {
    this.setContext();

    const newValue =
      typeof value === 'function'
        ? (value as (prev: Value) => Value)(this.#currentValue)
        : value;

    if (!Object.is(newValue, this.#currentValue)) {
      this.#currentValue = newValue;
      this.notifySubscribers(this.#currentValue);
    }
  }

  public subscribe(callback: (value: Value) => void): () => void {
    this.#callbacks ||= new Set();
    this.#callbacks.add(callback);

    return () => {
      this.#callbacks?.delete(callback);

      if (this.#callbacks?.size === 0) {
        this.#callbacks = null;
      }
    };
  }

  public reset(): void {
    this.#currentValue = this.#initialValue;
    this.notifySubscribers(this.#currentValue);
  }

  private notifySubscribers(value: Value) {
    this.#batch.startBatch();
    this.#callbacks?.forEach((callback) => callback(value));
    this.#batch.endBatch();
  }
}
