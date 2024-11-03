import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchManager } from '../batch-manager';
import { ReactiveContext } from '../reactive-context';
import { createEffect } from './create-effect';

const waitMacro = async () => Promise.resolve();

describe('createEffect with batching', () => {
  let batchManager: BatchManager;

  beforeEach(() => {
    batchManager = new BatchManager();
  });

  it('should call the provided function immediately', async () => {
    const context = new ReactiveContext();
    const fn = vi.fn();

    createEffect(fn, context, batchManager);
    await waitMacro();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should track the function with the context', async () => {
    const context = new ReactiveContext();
    const trackSpy = vi.spyOn(context, 'track');
    const fn = vi.fn();

    createEffect(fn, context, batchManager);
    await waitMacro();
    expect(trackSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should batch updates using BatchManager', async () => {
    const context = new ReactiveContext();
    const fn = vi.fn();
    const batchSpy = vi.spyOn(batchManager, 'addTask');

    createEffect(fn, context, batchManager);
    await waitMacro();
    expect(batchSpy).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple effects to be batched together', async () => {
    const context = new ReactiveContext();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    createEffect(fn1, context, batchManager);
    createEffect(fn2, context, batchManager);
    await waitMacro();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('should trigger updates when dependencies change', async () => {
    const context = new ReactiveContext();
    const fn = vi.fn();

    createEffect(fn, context, batchManager);
    await waitMacro();
    expect(fn).toHaveBeenCalledTimes(1);
    // Simulate dependency change
    context.track(fn);
    await waitMacro();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should trigger effect only once when multiple dependencies change in batch', async () => {
    const context = new ReactiveContext();
    const fn = vi.fn();

    createEffect(fn, context, batchManager);
    await waitMacro();
    expect(fn).toHaveBeenCalledTimes(1);
    context.track(fn);
    context.track(fn);
    await waitMacro();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should not trigger effect again if dependencies do not change', async () => {
    const context = new ReactiveContext();
    const fn = vi.fn();

    createEffect(fn, context, batchManager);
    await waitMacro();
    expect(fn).toHaveBeenCalledTimes(1);
    await waitMacro();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should handle asynchronous updates in effect function', async () => {
    const context = new ReactiveContext();
    const fn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    createEffect(fn, context, batchManager);
    await waitMacro();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should handle complex batched updates correctly', async () => {
    const context = new ReactiveContext();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    createEffect(fn1, context, batchManager);
    createEffect(fn2, context, batchManager);
    await waitMacro();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    // Trigger updates and batch them
    context.track(fn1);
    context.track(fn2);
    await waitMacro();
    expect(fn1).toHaveBeenCalledTimes(2);
    expect(fn2).toHaveBeenCalledTimes(2);
  });
});
