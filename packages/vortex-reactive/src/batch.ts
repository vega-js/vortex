/**
 * Perfect Reactivity - Batch
 * 
 * Batch multiple updates together for optimal performance.
 */

import { endBatch, startBatch } from "./core";

/**
 * Execute function within a batch context
 * 
 * All reactive updates within the batch are collected and effects
 * are executed once at the end, preventing redundant computations.
 * 
 * @template T - Return type
 * @param fn - Function to execute in batch
 * @returns Function result
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * const double = computed(() => count.read() * 2);
 * 
 * effect(() => console.log(double.read()));
 * // Logs: 0
 * 
 * batch(() => {
 *   count.write(1);
 *   count.write(2);
 *   count.write(3);
 * });
 * // Logs once: 6
 * ```
 */
export function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}
