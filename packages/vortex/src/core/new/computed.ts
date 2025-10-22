/**
 * Perfect Reactivity - Computed
 * 
 * Derived reactive values that automatically update when dependencies change.
 */

import type { ComputedNode, Link } from "./core";
import {
    computedUpdate,
    computedUpdateIfNecessary,
    link,
    trackingContext,
} from "./core";

/**
 * Computed - derived reactive value with automatic dependency tracking
 * 
 * @template T - Value type
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * const double = computed(() => count.read() * 2);
 * console.log(double.read()); // 0
 * count.write(5);
 * console.log(double.read()); // 10
 * ```
 */
export class IComputed<T = any> implements ComputedNode {
  fn: () => T;
  value: any;
  flags: number = 0x1;
  deps: Link | null = null;
  depsTail: Link | null = null;
  subs: Link | null = null;
  subsTail: Link | null = null;
  version: number = 0;
  lastCheckCycle: number = 0;

  constructor(fn: () => T) {
    this.fn = fn;
    this.value = undefined;
  }

  /**
   * Read computed value and track dependency in current reactive context
   * 
   * Lazily computes value only when accessed and dependencies have changed.
   * 
   * @returns Current computed value
   */
  read(): T {
    const flags = this.flags;

    // Fast path: clean value, no tracking needed
    if (!(flags & 0x1)) {
      const ctx = trackingContext;
      if (ctx) {
        link(this, ctx);
      }
      return this.value;
    }

    // Slow path: need to check/update
    const ctx = trackingContext;
    if (ctx) {
      link(this, ctx);
    }

    const firstDep = this.deps;
    if (firstDep && firstDep.dep!.version !== firstDep.version) {
      computedUpdate(this);
    } else {
      computedUpdateIfNecessary(this);
    }

    return this.value;
  }

  /**
   * Read value without tracking dependency or updating
   * 
   * @returns Current cached value (may be stale)
   */
  peek(): T {
    return this.value;
  }
}

/**
 * Create a computed value with automatic dependency tracking
 * 
 * @template T - Value type
 * @param fn - Computation function
 * @returns Computed instance
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * const double = computed(() => count.read() * 2);
 * const quadruple = computed(() => double.read() * 2);
 * ```
 */
export function computed<T>(fn: () => T): IComputed<T> {
  return new IComputed(fn);
}

// Type exports for compatibility
export type { IComputed as ComputedOptions };

