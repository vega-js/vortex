/**
 * Perfect Reactivity - Public API
 *
 * High-performance fine-grained reactive system with excellent DX.
 *
 * @packageDocumentation
 *
 * @example
 * Basic usage:
 * ```ts
 * import { signal, computed, effect } from 'perfect-reactivity';
 *
 * const count = signal(0);
 * const double = computed(() => count.read() * 2);
 *
 * effect(() => {
 *   console.log('Double:', double.read());
 * });
 *
 * count.write(5); // Logs: "Double: 10"
 * ```
 */

// Core exports
export { batch } from './batch';
export { computed } from './computed';
export type { ComputedOptions, IComputed } from './computed';
export { effect } from './effect';
export type { IEffect } from './effect';
export { signal } from './signal';
export type { ISignal } from './signal';

// Utility types and helpers
export { isComputed, isEffect, isSignal, reactiveObject } from './types';
export type {
  ComputedValue,
  Reactive,
  ReactiveObject,
  ReadonlyComputed,
  ReadonlySignal,
  SignalValue,
  Unwrap,
} from './types';

import { batch as withBatch } from './batch';
import { computed as createComputed } from './computed';
import { effect as createEffect } from './effect';
// Re-export for convenience
import { signal as createSignal } from './signal';

/**
 * Perfect Reactivity System - Ultra-Optimized
 *
 * A high-performance, glitch-free reactive system with:
 * - O(1) dependency management via linked lists + inline storage
 * - Link pooling for zero-allocation dependency updates
 * - Epoch-based dirty checking
 * - Topological sorting for deterministic updates
 * - Lazy pull + eager push hybrid evaluation
 * - Priority queue for batched effects
 * - Minimal memory allocations
 * - Efficient batching with deduplication
 * - Early bailout on unchanged values
 */
export const PerfectReactivity = {
  signal: createSignal,
  computed: createComputed,
  effect: createEffect,
  batch: withBatch,
};

export default PerfectReactivity;
