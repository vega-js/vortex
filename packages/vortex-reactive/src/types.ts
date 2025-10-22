/**
 * Perfect Reactivity - Utility Types
 * 
 * Helper types for better TypeScript integration and DX.
 */

import type { IComputed } from "./computed";
import type { IEffect } from "./effect";
import type { ISignal } from "./signal";

/**
 * Extract the value type from a signal
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * type CountType = SignalValue<typeof count>; // number
 * ```
 */
export type SignalValue<S> = S extends ISignal<infer T> ? T : never;

/**
 * Extract the value type from a computed
 * 
 * @example
 * ```ts
 * const double = computed(() => 42);
 * type DoubleType = ComputedValue<typeof double>; // number
 * ```
 */
export type ComputedValue<C> = C extends IComputed<infer T> ? T : never;

/**
 * Union type of all reactive primitives
 */
export type Reactive<T = any> = ISignal<T> | IComputed<T>;

/**
 * Type guard to check if value is a signal
 * 
 * @example
 * ```ts
 * if (isSignal(value)) {
 *   value.write(42);
 * }
 * ```
 */
export function isSignal<T = any>(value: any): value is ISignal<T> {
  return value && typeof value.read === "function" && typeof value.write === "function";
}

/**
 * Type guard to check if value is a computed
 * 
 * @example
 * ```ts
 * if (isComputed(value)) {
 *   const result = value.read();
 * }
 * ```
 */
export function isComputed<T = any>(value: any): value is IComputed<T> {
  return value && typeof value.read === "function" && !value.write && value.fn;
}

/**
 * Type guard to check if value is an effect
 * 
 * @example
 * ```ts
 * if (isEffect(value)) {
 *   value.dispose();
 * }
 * ```
 */
export function isEffect(value: any): value is IEffect {
  return value && typeof value.dispose === "function";
}

/**
 * Extract value from reactive or return as-is
 * 
 * @example
 * ```ts
 * type T1 = Unwrap<ISignal<number>>; // number
 * type T2 = Unwrap<string>; // string
 * ```
 */
export type Unwrap<T> = T extends Reactive<infer U> ? U : T;

/**
 * Make all properties of an object reactive
 * 
 * @example
 * ```ts
 * type User = { name: string; age: number };
 * type ReactiveUser = ReactiveObject<User>;
 * // { name: ISignal<string>; age: ISignal<number> }
 * ```
 */
export type ReactiveObject<T> = {
  [K in keyof T]: ISignal<T[K]>;
};

/**
 * Helper to create reactive object from plain object
 * 
 * @example
 * ```ts
 * const user = reactiveObject({
 *   name: 'Alice',
 *   age: 25
 * });
 * user.name.write('Bob');
 * ```
 */
export function reactiveObject<T extends Record<string, any>>(
  obj: T
): ReactiveObject<T> {
  const { signal } = require("./signal");
  const result: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = signal(obj[key]);
    }
  }
  
  return result;
}

/**
 * Readonly signal - can only be read, not written
 * 
 * @example
 * ```ts
 * function useCount() {
 *   const count = signal(0);
 *   const increment = () => count.write(count.read() + 1);
 *   
 *   return {
 *     count: count as ReadonlySignal<number>,
 *     increment
 *   };
 * }
 * ```
 */
export type ReadonlySignal<T> = Omit<ISignal<T>, "write">;

/**
 * Readonly computed (already read-only by nature)
 */
export type ReadonlyComputed<T> = IComputed<T>;



