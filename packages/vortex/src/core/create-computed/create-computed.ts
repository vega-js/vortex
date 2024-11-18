import type { Computed } from '../../types';
import { ReactiveValue } from '../create-reactive';
import type { ReactiveContext } from '../reactive-context';

export class ComputedValue<T> implements Computed<T> {
  public type = 'computed' as const;

  private cachedValue: T;

  private result: ReactiveValue<T>;

  private context: ReactiveContext;

  constructor(
    private readonly fn: () => T,
    context: ReactiveContext,
  ) {
    this.context = context;
    this.cachedValue = this.computeValue();
    this.result = new ReactiveValue<T>(this.cachedValue, context);
    this.context.track(this.update.bind(this));
  }

  private computeValue(): T {
    try {
      return this.fn();
    } finally {
    }
  }

  private update(): void {
    const newValue = this.computeValue();

    if (!Object.is(this.cachedValue, newValue)) {
      this.cachedValue = newValue;
      this.result.set(newValue);
    }
  }

  public get value(): T {
    return this.result.value;
  }

  public subscribe(callback: (value: T) => void) {
    return this.result.subscribe(callback);
  }
}
