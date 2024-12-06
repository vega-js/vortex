import type { Computed } from '../../types';
import type { BatchManager } from '../batch-manager';
import { ReactiveValue } from '../create-reactive';
import type { ReactiveContext } from '../reactive-context';

export class ComputedValue<T> implements Computed<T> {
  public type = 'computed' as const;

  readonly #fn: () => T;

  #result: ReactiveValue<T>;

  #cachedValue: T;

  constructor(fn: () => T, context: ReactiveContext, batch: BatchManager) {
    this.#fn = fn;
    this.#cachedValue = this.computeValue();
    this.#result = new ReactiveValue<T>(this.#cachedValue, context, batch);
    context.track(this.update.bind(this));
  }

  private computeValue(): T {
    try {
      return this.#fn();
    } finally {
    }
  }

  private update(): void {
    const newValue = this.computeValue();

    if (!Object.is(this.#cachedValue, newValue)) {
      this.#cachedValue = newValue;
      this.#result.set(newValue);
    }
  }

  public get value(): T {
    this.#cachedValue = this.computeValue();

    return this.#result.value;
  }

  public subscribe(callback: (value: T) => void) {
    return this.#result.subscribe(callback);
  }
}
