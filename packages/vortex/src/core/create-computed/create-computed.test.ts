import { describe, expect, it, vi } from 'vitest';
import { BatchManager } from '../batch-manager';
import { ReactiveValue } from '../create-reactive';
import { ReactiveContext } from '../reactive-context';
import { ComputedValue } from './create-computed';

describe('createComputed', () => {
  it('should return the initial computed value', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const computed = new ComputedValue(() => 42, context, batch);

    expect(computed.value).toBe(42);
  });

  it('should update computed value when a dependency changes', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep = new ReactiveValue(10, context, batch);
    const computed = new ComputedValue(() => dep.value * 2, context, batch);

    expect(computed.value).toBe(20);
    dep.set(15);
    expect(computed.value).toBe(30);
  });

  it('should not update if the computed value remains the same after dependency changes', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep = new ReactiveValue(10, context, batch);
    const computed = new ComputedValue(() => dep.value * 2, context, batch);

    const subscriber = vi.fn();

    computed.subscribe(subscriber);
    dep.set(10);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should notify subscribers when computed value changes', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep = new ReactiveValue(10, context, batch);
    const computed = new ComputedValue(() => dep.value * 2, context, batch);

    const subscriber = vi.fn();

    computed.subscribe(subscriber);
    dep.set(15);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(30);
  });

  it('should not notify subscribers if computed value does not change', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep = new ReactiveValue(10, context, batch);
    const computed = new ComputedValue(() => dep.value * 2, context, batch);

    const subscriber = vi.fn();

    computed.subscribe(subscriber);
    dep.set(10);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should update correctly with multiple dependencies', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep1 = new ReactiveValue(10, context, batch);
    const dep2 = new ReactiveValue(5, context, batch);
    const computed = new ComputedValue(
      () => dep1.value + dep2.value,
      context,
      batch,
    );

    expect(computed.value).toBe(15);
    dep1.set(20);
    expect(computed.value).toBe(25);
    dep2.set(10);
    expect(computed.value).toBe(30);
  });

  it('should correctly handle removal of subscriptions', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep = new ReactiveValue(10, context, batch);
    const computed = new ComputedValue(() => dep.value * 2, context, batch);

    const subscriber = vi.fn();
    const unsubscribe = computed.subscribe(subscriber);

    dep.set(15);
    expect(subscriber).toHaveBeenCalledTimes(1);
    unsubscribe();
    dep.set(20);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should not react to unused dependencies', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep1 = new ReactiveValue(10, context, batch);
    const dep2 = new ReactiveValue(5, context, batch);
    const computed = new ComputedValue(() => dep1.value * 2, context, batch);

    const subscriber = vi.fn();

    computed.subscribe(subscriber);
    dep2.set(10);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should handle delayed updates in chained dependencies', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep = new ReactiveValue(1, context, batch);
    const computed1 = new ComputedValue(() => dep.value + 1, context, batch);
    const computed2 = new ComputedValue(
      () => computed1.value + 2,
      context,
      batch,
    );

    const subscriber = vi.fn();

    computed2.subscribe(subscriber);
    dep.set(2);
    expect(computed2.value).toBe(5);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should work correctly without an active context', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep = new ReactiveValue(10, context, batch);
    const computed = new ComputedValue(() => dep.value * 2, context, batch);

    expect(computed.value).toBe(20);
    dep.set(15);
    expect(computed.value).toBe(30);
  });

  it('should handle circular dependencies gracefully', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep = new ReactiveValue(2, context, batch);
    const computed1 = new ComputedValue(() => dep.value * 2, context, batch);
    const computed2 = new ComputedValue(
      () => computed1.value + 1,
      context,
      batch,
    );

    const subscriber = vi.fn();

    computed2.subscribe(subscriber);
    dep.set(3);
    expect(computed2.value).toBe(7); // (3 * 2) + 1
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should handle null and undefined values correctly', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const dep = new ReactiveValue<number | null>(null, context, batch);
    const computed = new ComputedValue(
      () => (dep.value !== null ? dep.value! * 2 : 0),
      context,
      batch,
    );

    expect(computed.value).toBe(0);
    dep.set(5);
    expect(computed.value).toBe(10);
    dep.set(null);
    expect(computed.value).toBe(0);
  });
});
