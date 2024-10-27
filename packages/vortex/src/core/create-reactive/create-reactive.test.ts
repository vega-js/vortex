import { describe, expect, it, vi } from 'vitest';
import { ReactiveContext } from '../../utils';
import { createReactive } from './create-reactive';

describe('createReactive', () => {
  it('should return the initial value from get', () => {
    const context = new ReactiveContext();
    const reactive = createReactive(10, context);

    expect(reactive.get()).toBe(10);
  });

  it('should update the value with set', () => {
    const context = new ReactiveContext();
    const reactive = createReactive(10, context);

    reactive.set(20);
    expect(reactive.get()).toBe(20);
  });

  it('should call subscribers when value is updated', () => {
    const context = new ReactiveContext();
    const reactive = createReactive(10, context);

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
    const reactive = createReactive(10, context);

    const subscriber = vi.fn();
    const unsubscribe = reactive.subscribe(subscriber);

    unsubscribe();
    reactive.set(20);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should reset the value to initial', () => {
    const context = new ReactiveContext();
    const reactive = createReactive(10, context);

    reactive.set(50);
    expect(reactive.get()).toBe(50);
    reactive.reset();
    expect(reactive.get()).toBe(10);
  });

  it('should track active functions via context', () => {
    const context = new ReactiveContext();
    const reactive = createReactive(10, context);

    const tracker = vi.fn();

    context.track(() => {
      reactive.get();
      tracker();
    });

    expect(tracker).toHaveBeenCalled();
  });
});
