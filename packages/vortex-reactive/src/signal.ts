/**
 * Perfect Reactivity - Signal
 *
 * Reactive data source that notifies subscribers when its value changes.
 */

import type { Link, SignalNode } from './core';
import { signalRead, signalWrite } from './core';

/**
 * Signal - mutable reactive data source
 *
 * @template T - Value type
 *
 * @example
 * ```ts
 * const count = signal(0);
 * count.write(count.read() + 1);
 * ```
 */
export class ISignal<T = any> implements SignalNode {
  value: any;
  subs: Link | null = null;
  subsTail: Link | null = null;
  version = 0;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  /**
   * Read signal value and track dependency in current reactive context
   *
   * @returns Current value
   */
  read(): T {
    return signalRead(this);
  }

  /**
   * Write new value and propagate changes to subscribers
   *
   * @param value - New value
   */
  write(value: T): void {
    signalWrite(this, value);
  }

  /**
   * Read value without tracking dependency
   *
   * @returns Current value
   */
  peek(): T {
    return this.value;
  }
}

/**
 * Create a new signal
 *
 * @template T - Value type
 * @param initialValue - Initial value
 * @returns Signal instance
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const name = signal('Alice');
 * ```
 */
export function signal<T>(initialValue: T): ISignal<T> {
  return new ISignal(initialValue);
}
