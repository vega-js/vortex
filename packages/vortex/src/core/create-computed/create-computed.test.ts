import { describe, expect, it, vi } from 'vitest';
import { ReactiveContext } from '../../utils';
import { createComputed } from './create-computed';

describe('createComputed', () => {
  it('should return the initial computed value', () => {
    const context = new ReactiveContext();
    const computed = createComputed(() => 42, context);

    expect(computed.get()).toBe(42);
  });

  it('should update computed value when dependency changes', () => {
    const context = new ReactiveContext();
    const dep = 10;
    const computed = createComputed(() => dep * 2, context);

    expect(computed.get()).toBe(20);
  });

  it('should not update if the value is the same (isEqual)', () => {
    const context = new ReactiveContext();
    let dep = 10;
    const computed = createComputed(() => dep * 2, context);

    const spy = vi.spyOn(computed, 'subscribe');

    expect(computed.get()).toBe(20);
    dep = 10;
    context.track(() => computed.get());
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not call subscribers if the value does not change', () => {
    const context = new ReactiveContext();
    let dep = 10;
    const computed = createComputed(() => dep * 2, context);

    const subscriber = vi.fn();

    computed.subscribe(subscriber);
    // Устанавливаем ту же зависимость
    dep = 10;
    context.track(() => computed.get());
    // Подписчик не должен быть вызван, так как значение не изменилось
    expect(subscriber).not.toHaveBeenCalled();
  });
});
