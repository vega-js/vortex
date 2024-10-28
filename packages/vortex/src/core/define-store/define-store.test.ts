import { describe, expect, it, vi } from 'vitest';
import { defineStore } from './define-store';

describe('defineStore', () => {
  it('should initialize state correctly', () => {
    const store = defineStore(() => ({
      count: 0,
      name: 'Test',
    }));

    expect(store.getSnapshot()).toEqual({
      count: 0,
      name: 'Test',
    });
  });

  it('should allow subscribing and trigger on state change', async () => {
    const store = defineStore(({ reactive }) => {
      return {
        count: reactive(0),
      };
    });

    const oldState = store.getSnapshot();

    const subscriber = vi.fn();

    store.subscribe((newState, prevState) => {
      subscriber(newState, prevState);
    });

    store.action((state) => {
      state.count.set(10);
    });

    await new Promise((resolve) => setImmediate(resolve));

    const newState = store.getSnapshot();

    expect(subscriber).toHaveBeenCalledWith(newState, oldState);
  });

  it('should allow unsubscribing from state changes', () => {
    const store = defineStore(() => ({
      count: 0,
    }));

    const subscriber = vi.fn();

    const unsubscribe = store.subscribe(subscriber);

    unsubscribe();

    store.action((state) => {
      state.count = 5;
    });

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should reactively update computed values and notify subscribers', async () => {
    const store = defineStore(({ reactive, computed }) => {
      const count = reactive(1);
      const doubleCount = computed(() => count.get() * 2);

      return {
        count,
        doubleCount,
      };
    });

    const subscriber = vi.fn();

    // Подписываемся на обновления
    store.subscribe(subscriber);

    expect(store.getSnapshot()).toEqual({
      count: 1,
      doubleCount: 2,
    });

    store.action((state) => {
      state.count.set(2);
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(store.getSnapshot()).toEqual({
      count: 2,
      doubleCount: 4,
    });

    // Проверяем, что подписчик был вызван с правильными аргументами
    expect(subscriber).toHaveBeenCalledWith(
      { count: 2, doubleCount: 4 },
      { count: 1, doubleCount: 2 },
    );
  });

  it('should run plugins when store is initialized', () => {
    const plugin = vi.fn();

    defineStore(
      () => ({
        count: 0,
      }),
      {
        plugins: [plugin],
      },
    );

    expect(plugin).toHaveBeenCalled();
  });
});
