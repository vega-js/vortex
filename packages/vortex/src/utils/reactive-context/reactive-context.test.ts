import { describe, expect, it, vi } from 'vitest';
import { ReactiveContext } from './reactive-context';

describe('ReactiveContext', () => {
  it('should track and execute the function', () => {
    const context = new ReactiveContext();
    const fn = vi.fn();

    context.track(fn);
    expect(fn).toHaveBeenCalled();
  });

  it('should push and pop functions correctly', () => {
    const context = new ReactiveContext();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    context.track(fn1);
    context.track(fn2);
    expect(context.getActive()).toBeUndefined();
  });
});
