import { describe, expect, it, vi } from 'vitest';
import { createReactive } from '../create-reactive';
import { ReactiveContext } from '../reactive-context';
import { createComputed } from './create-computed';

describe('createComputed', () => {
  it('should return the initial computed value', () => {
    const context = new ReactiveContext();
    const computed = createComputed(() => 42, context);

    expect(computed.get()).toBe(42);
  });

  it('should update computed value when a dependency changes', () => {
    const context = new ReactiveContext();
    const dep = createReactive(10, context);
    const computed = createComputed(() => dep.get() * 2, context);

    expect(computed.get()).toBe(20);
    dep.set(15);
    expect(computed.get()).toBe(30);
  });

  it('should not update if the computed value remains the same after dependency changes', () => {
    const context = new ReactiveContext();
    const dep = createReactive(10, context);
    const computed = createComputed(() => dep.get() * 2, context);

    const subscriber = vi.fn();

    computed.subscribe(subscriber);
    dep.set(10);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should notify subscribers when computed value changes', () => {
    const context = new ReactiveContext();
    const dep = createReactive(10, context);
    const computed = createComputed(() => dep.get() * 2, context);

    const subscriber = vi.fn();

    computed.subscribe(subscriber);
    dep.set(15);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(30);
  });

  it('should not notify subscribers if computed value does not change', () => {
    const context = new ReactiveContext();
    const dep = createReactive(10, context);
    const computed = createComputed(() => dep.get() * 2, context);

    const subscriber = vi.fn();

    computed.subscribe(subscriber);
    dep.set(10);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should update correctly with multiple dependencies', () => {
    const context = new ReactiveContext();
    const dep1 = createReactive(10, context);
    const dep2 = createReactive(5, context);
    const computed = createComputed(() => dep1.get() + dep2.get(), context);

    expect(computed.get()).toBe(15);
    dep1.set(20);
    expect(computed.get()).toBe(25);
    dep2.set(10);
    expect(computed.get()).toBe(30);
  });

  it('should correctly handle removal of subscriptions', () => {
    const context = new ReactiveContext();
    const dep = createReactive(10, context);
    const computed = createComputed(() => dep.get() * 2, context);

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
    const dep1 = createReactive(10, context);
    const dep2 = createReactive(5, context);
    const computed = createComputed(() => dep1.get() * 2, context);

    const subscriber = vi.fn();

    computed.subscribe(subscriber);
    dep2.set(10);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should handle delayed updates in chained dependencies', () => {
    const context = new ReactiveContext();
    const dep = createReactive(1, context);
    const computed1 = createComputed(() => dep.get() + 1, context);
    const computed2 = createComputed(() => computed1.get() + 2, context);

    const subscriber = vi.fn();

    computed2.subscribe(subscriber);
    dep.set(2);
    expect(computed2.get()).toBe(5);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should work correctly without an active context', () => {
    const context = new ReactiveContext();
    const dep = createReactive(10, context);
    const computed = createComputed(() => dep.get() * 2, context);

    expect(computed.get()).toBe(20);
    dep.set(15);
    expect(computed.get()).toBe(30);
  });

  it('should handle circular dependencies gracefully', () => {
    const context = new ReactiveContext();
    const dep = createReactive(2, context);
    const computed1 = createComputed(() => dep.get() * 2, context);
    const computed2 = createComputed(() => computed1.get() + 1, context);

    const subscriber = vi.fn();

    computed2.subscribe(subscriber);
    dep.set(3);
    expect(computed2.get()).toBe(7); // (3 * 2) + 1
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should handle null and undefined values correctly', () => {
    const context = new ReactiveContext();
    const dep = createReactive<number | null>(null, context);
    const computed = createComputed(
      () => (dep.get() !== null ? dep.get()! * 2 : 0),
      context,
    );

    expect(computed.get()).toBe(0);
    dep.set(5);
    expect(computed.get()).toBe(10);
    dep.set(null);
    expect(computed.get()).toBe(0);
  });
});
