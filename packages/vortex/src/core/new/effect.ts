/**
 * Perfect Reactivity - Effect
 * 
 * Side effects that automatically re-run when their dependencies change.
 */

import { createEffectNode, effectDispose, effectExecute } from "./core";

/**
 * Effect handle with dispose method
 */
export interface IEffect {
  /**
   * Dispose effect and stop tracking dependencies
   */
  dispose(): void;
}

/**
 * Create and run an effect that tracks dependencies
 * 
 * Effects are batched and scheduled for optimal performance.
 * They run immediately on creation and again whenever dependencies change.
 * 
 * @param fn - Effect function
 * @returns Effect handle with dispose method
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * 
 * const dispose = effect(() => {
 *   console.log('Count:', count.read());
 * });
 * // Logs: "Count: 0"
 * 
 * count.write(1);
 * // Logs: "Count: 1"
 * 
 * dispose(); // Stop tracking
 * ```
 */
export function effect(fn: () => void): IEffect {
  const node = createEffectNode(fn);
  effectExecute(node);

  return {
    dispose: () => effectDispose(node),
  };
}
