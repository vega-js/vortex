import { reactive } from '@vegajs/vortex';
import { useCallback, useRef, useSyncExternalStore } from 'react';

/**
 * Represents a reactive state unit that holds a value and notifies subscribers on updates.
 *
 * @template Value - The type of the signal value.
 */
export type ReactiveUnit<Value> = {
  /** Gets the current value of the signal. */
  get value(): Value;
  /**
   * Sets a new value for the signal.
   * @param value - A new value or an updater function that receives the previous value.
   */
  set value(value: Value | ((prevValue: Value) => Value));
  /**
   * Subscribes to value changes.
   * @param callback - A function to be called when the value changes.
   * @returns An unsubscribe function.
   */
  subscribe(callback: (value: Value) => void): () => void;
};

/**
 * React hook that subscribes to a readable reactive unit and returns its current value.
 * Automatically updates when the value changes.
 *
 * @template T - The type of the signal value.
 * @param r - The reactive unit to observe.
 * @returns The current value of the reactive unit.
 *
 * @example
 * ```tsx
 * const count = createSignal(0);
 * const double = createComputed(() => count.value * 2);
 * function Display() {
 *   const countValue = useReactiveValue(count);
 *   const doubleValue = useReactiveValue(double);
 *   return <div>Count: {countValue}, Double: {doubleValue}</div>;
 * }
 * ```
 */
export function useReactiveValue<T>(r: ReactiveUnit<T>): T {
  return useSyncExternalStore(
    (callback) => r.subscribe(callback),
    () => r.value,
    () => r.value,
  );
}

/**
 * React hook that creates a reactive state and subscribes to updates.
 * Returns a tuple containing the current value and a setter function.
 *
 * Internally, it uses React's `useSyncExternalStore` for concurrency-safe re-renders.
 *
 * @template T - The type of the reactive state.
 * @param input - The initial value of the reactive state.
 * @returns A tuple `[value, setValue]` where `value` is the current state and `setValue` updates it.
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [value, setValue] = useReactive(0);
 *   return <button onClick={() => setValue(value + 1)}>{value}</button>;
 * }
 * ```
 */
export function useReactive<T>(input: T) {
  const r = useRef(reactive<T>(input));

  const value = useSyncExternalStore(
    (callback) => r.current.subscribe(callback),
    () => r.current.value,
    () => r.current.value,
  );

  const setValue = useCallback((val: T | ((oldVal: T) => T)) => {
    r.current.value =
      typeof val === 'function'
        ? (val as (prev: T) => T)(r.current.value)
        : val;
  }, []);

  return [value, setValue] as const;
}
