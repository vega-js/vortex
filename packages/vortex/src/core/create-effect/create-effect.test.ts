import { describe, expect, it, vi } from 'vitest';
import { ReactiveContext } from '../../utils';
import { BatchManager } from '../batch-manager';
import { createEffect } from './create-effect';

describe('createEffect with batching', () => {
  let batchManager: BatchManager;

  beforeEach(() => {
    batchManager = new BatchManager();
  });

  it('should call the provided function immediately', async () => {
    const context = new ReactiveContext();
    const fn = vi.fn();

    createEffect(fn, context, batchManager);
    await new Promise((resolve) => setImmediate(resolve));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should track the function with the context', async () => {
    const context = new ReactiveContext();
    const trackSpy = vi.spyOn(context, 'track');
    const fn = vi.fn();

    createEffect(fn, context, batchManager);
    await new Promise((resolve) => setImmediate(resolve));
    expect(trackSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should batch updates using BatchManager', async () => {
    const context = new ReactiveContext();
    const fn = vi.fn();
    const batchSpy = vi.spyOn(batchManager, 'addTask');

    createEffect(fn, context, batchManager);
    expect(batchSpy).toHaveBeenCalled();
    await new Promise((resolve) => setImmediate(resolve));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple effects to be batched together', async () => {
    const context = new ReactiveContext();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    createEffect(fn1, context, batchManager);
    createEffect(fn2, context, batchManager);
    await new Promise((resolve) => setImmediate(resolve));
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('should trigger updates when dependencies change', async () => {
    const context = new ReactiveContext();
    const fn = vi.fn();

    createEffect(fn, context, batchManager);
    await new Promise((resolve) => setImmediate(resolve));
    expect(fn).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setImmediate(resolve));
    context.track(fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
