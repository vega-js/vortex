import type { Reactive } from '../../types';
import type { ReactiveContext } from '../reactive-context';

export class ReactiveValue<Value> implements Reactive<Value> {
  private callbacks: Set<(value: Value) => void> | null = null;

  public type = 'reactive' as const;

  private currentValue: Value;

  constructor(
    private readonly initialValue: Value,
    private readonly context: ReactiveContext,
  ) {
    this.currentValue = initialValue;
  }

  public get value(): Value {
    const activeReactive = this.context.getActive();

    if (activeReactive) {
      this.callbacks ||= new Set();
      this.callbacks.add(activeReactive);
    }

    return this.currentValue;
  }

  public set(value: Value | ((prev: Value) => Value)): void {
    const newValue =
      typeof value === 'function'
        ? (value as (prev: Value) => Value)(this.currentValue)
        : value;

    if (!Object.is(newValue, this.currentValue)) {
      this.currentValue = newValue;
      this.notifySubscribers(this.currentValue);
    }
  }

  public subscribe(callback: (value: Value) => void): () => void {
    this.callbacks ||= new Set();
    this.callbacks.add(callback);

    return () => {
      this.callbacks?.delete(callback);

      if (this.callbacks?.size === 0) {
        this.callbacks = null;
      }
    };
  }

  public reset(): void {
    this.currentValue = this.initialValue;
    this.notifySubscribers(this.currentValue);
  }

  private notifySubscribers(value: Value): void {
    this.callbacks?.forEach((callback) => callback(value));
  }
}
