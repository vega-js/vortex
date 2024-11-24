import { describe, expect, it, vi } from 'vitest';
import { defineStore } from './define-store';

const waitMacro = async () => Promise.resolve();

describe('defineStore', () => {
  it('should initialize state with correct default values', () => {
    const store = defineStore(() => ({
      count: 0,
      name: 'Test',
    }));

    expect(store.getSnapshot()).toEqual({
      count: 0,
      name: 'Test',
    });
  });

  it('should support reactive state and trigger updates after all changes', async () => {
    const store = defineStore(({ reactive }) => ({
      count: reactive(0),
    }));

    const subscriber = vi.fn();

    store.subscribe(subscriber);
    store.action((state) => state.count.set(5));
    await waitMacro();
    expect(store.getSnapshot()).toEqual({ count: 5 });
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith({ count: 5 }, { count: 0 });
  });

  it('should not trigger updates if state remains unchanged', async () => {
    const store = defineStore(({ reactive }) => ({
      count: reactive(0),
    }));

    const subscriber = vi.fn();

    store.subscribe(subscriber);
    store.action((state) => state.count.set(0));
    await waitMacro();
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should allow unsubscribing from updates', () => {
    const store = defineStore(({ reactive }) => ({
      count: reactive(0),
    }));

    const subscriber = vi.fn();
    const unsubscribe = store.subscribe(subscriber);

    unsubscribe();
    store.action((state) => state.count.set(5));
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should batch multiple async updates correctly', async () => {
    const store = defineStore(({ reactive }) => ({
      count: reactive(0),
    }));

    const subscriber = vi.fn();

    store.subscribe(subscriber);

    store.action(async (state) => {
      state.count.set(1);
      await waitMacro();
      state.count.set(2);
      await waitMacro();
      state.count.set(3);
    });

    await waitMacro();
    expect(subscriber).toHaveBeenCalledTimes(1);
    await waitMacro();
    expect(subscriber).toHaveBeenCalledTimes(2);
    await waitMacro();
    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(subscriber).toHaveBeenCalledWith({ count: 3 }, { count: 2 });
  });

  it('should execute effects with computed dependencies correctly', async () => {
    const effectCallback = vi.fn();

    const store = defineStore(({ reactive, computed, effect }) => {
      const count = reactive(1);
      const doubleCount = computed(() => count.value * 2);

      effect(() => {
        effectCallback(doubleCount.value);
      });

      return { count, doubleCount };
    });

    store.action((state) => state.count.set(3));
    await waitMacro();
    expect(effectCallback).toHaveBeenCalledWith(6);
  });

  it('should trigger watchers in batch for nested object updates', async () => {
    const store = defineStore(({ reactive }) => ({
      nested: reactive({ level1: { level2: { value: 1 } } }),
    }));

    const subscriber = vi.fn();

    store.subscribe(subscriber);

    store.action((state) => {
      state.nested.set((prev) => ({
        ...prev,
        level1: { level2: { value: 2 } },
      }));
    });

    await waitMacro();

    expect(store.getSnapshot()).toEqual({
      nested: { level1: { level2: { value: 2 } } },
    });

    expect(subscriber).toHaveBeenCalledTimes(1);

    expect(subscriber).toHaveBeenCalledWith(
      { nested: { level1: { level2: { value: 2 } } } },
      { nested: { level1: { level2: { value: 1 } } } },
    );
  });

  it('should initialize plugins on store creation', () => {
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

  it('should only trigger once for batched updates with BatchManager', async () => {
    const store = defineStore(({ reactive }) => ({
      count: reactive(1),
      name: reactive('Test'),
    }));

    const subscriber = vi.fn();

    store.subscribe(subscriber);

    store.action((state) => {
      state.count.set(2);
      state.name.set('Updated');
    });

    await waitMacro();
    expect(subscriber).toHaveBeenCalledTimes(1);

    expect(subscriber).toHaveBeenCalledWith(
      { count: 2, name: 'Updated' },
      { count: 1, name: 'Test' },
    );
  });

  it('should execute effects and react to state changes', async () => {
    const effectCallback = vi.fn();

    const store = defineStore(({ reactive, effect }) => {
      const count = reactive(0);

      effect(() => {
        effectCallback(count.value);
      });

      return { count };
    });

    store.action((state) => state.count.set(5));
    await waitMacro();
    expect(effectCallback).toHaveBeenCalledWith(5);
  });

  it('should handle asynchronous updates in reactive values', async () => {
    const store = defineStore(({ reactive }) => ({
      count: reactive(0),
    }));

    const subscriber = vi.fn();

    store.subscribe(subscriber);

    store.action(async (state) => {
      state.count.set(1);
      await waitMacro();
      state.count.set(2);
    });

    await waitMacro();
    expect(subscriber).toHaveBeenCalledTimes(1);
    await waitMacro();
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenCalledWith({ count: 2 }, { count: 1 });
  });
});
