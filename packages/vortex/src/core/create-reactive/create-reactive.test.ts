import { describe, expect, it, vi } from 'vitest';
import { BatchManager } from '../batch-manager';
import { ReactiveContext } from '../reactive-context';
import { ReactiveValue } from './create-reactive';

describe('createReactive', () => {
  it('should return the initial value from get', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    expect(reactive.value).toBe(10);
  });

  it('should update the value with set and reflect it in get', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    reactive.set(20);
    expect(reactive.value).toBe(20);
  });

  it('should call subscribers when value is updated', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    const subscriber1 = vi.fn();
    const subscriber2 = vi.fn();

    reactive.subscribe(subscriber1);
    reactive.subscribe(subscriber2);
    reactive.set(30);
    expect(subscriber1).toHaveBeenCalledWith(30);
    expect(subscriber2).toHaveBeenCalledWith(30);
  });

  it('should not call unsubscribed subscribers', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    const subscriber = vi.fn();
    const unsubscribe = reactive.subscribe(subscriber);

    unsubscribe();
    reactive.set(20);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should not notify subscribers if the value remains the same', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    const subscriber = vi.fn();

    reactive.subscribe(subscriber);
    reactive.set(10);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should reset the value to the initial value', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    reactive.set(50);
    expect(reactive.value).toBe(50);
    reactive.reset();
    expect(reactive.value).toBe(10);
  });

  it('should allow setting the value with a function', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    reactive.set((prev) => prev + 5);
    expect(reactive.value).toBe(15);
  });

  it('should track active functions via context', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    const tracker = vi.fn();

    context.track(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      reactive.value;
      tracker();
    });

    expect(tracker).toHaveBeenCalled();
  });

  it('should not add duplicate subscribers', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    const subscriber = vi.fn();

    reactive.subscribe(subscriber);
    reactive.subscribe(subscriber);
    reactive.set(20);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(20);
  });

  it('should correctly handle multiple independent reactives', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive1 = new ReactiveValue(10, context, batch);
    const reactive2 = new ReactiveValue(20, context, batch);

    expect(reactive1.value).toBe(10);
    expect(reactive2.value).toBe(20);
    reactive1.set(15);
    expect(reactive1.value).toBe(15);
    expect(reactive2.value).toBe(20);
  });

  it('should notify only relevant subscribers', () => {
    const context = new ReactiveContext();
    const batch = new BatchManager();

    const reactive = new ReactiveValue(10, context, batch);

    const subscriber1 = vi.fn();
    const subscriber2 = vi.fn();

    const unsubscribe1 = reactive.subscribe(subscriber1);

    reactive.subscribe(subscriber2);
    reactive.set(20);
    expect(subscriber1).toHaveBeenCalledTimes(1);
    expect(subscriber2).toHaveBeenCalledTimes(1);
    unsubscribe1();
    reactive.set(30);
    expect(subscriber1).toHaveBeenCalledTimes(1);
    expect(subscriber2).toHaveBeenCalledTimes(2);
  });
});
