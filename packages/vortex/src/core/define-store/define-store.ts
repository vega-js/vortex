import type {
  DefineApi,
  DefineStore,
  QueryOptions,
  Reactive,
  StoreOptions,
  UnwrappedState,
  WatchCallback,
} from '../../types';
import { isReactiveUnit, shallowEqual, toObjectKeys } from '../../utils';
import { BatchManager } from '../batch-manager';
import { createComputed } from '../create-computed';
import { createEffect } from '../create-effect';
import { createQuery } from '../create-query';
import { createReactive } from '../create-reactive';
import { ReactiveContext } from '../reactive-context';
import { initDevtoolsStore, observeStore } from './devtools-connection';

const defineStore = <
  T extends Record<string, unknown>,
  DIDeps extends Record<string, unknown> | undefined = undefined,
>(
  setup: (args: DefineApi<DIDeps>) => T,
  options: StoreOptions<T, DIDeps> = {},
): DefineStore<T> => {
  const batchManager = new BatchManager();
  const localContext = new ReactiveContext();
  const listeners: Record<number, WatchCallback<UnwrappedState<T>>> = {};
  let listenerCounter = 0;

  let memoizedSnapshot: UnwrappedState<T> | null = null;

  const { plugins = [], DI, name = `unknown_${Date.now()}` } = options;

  const reactive = <Value>(initialValue: Value) =>
    createReactive(initialValue, localContext);

  const computed = <Value>(fn: () => Value) => createComputed(fn, localContext);

  const effect = (fn: () => void) =>
    createEffect(fn, localContext, batchManager);

  const query = <Data, TError, TOptions>(
    cb: (options: TOptions) => Promise<Data>,
    queryOptions?: QueryOptions<Data, TError>,
  ) => createQuery<Data, TError, TOptions>(cb, localContext, queryOptions);

  const state = setup({
    reactive,
    computed,
    effect,
    query,
    DI,
  } as DefineApi<DIDeps>);

  const stateKeys = toObjectKeys(state);

  const getSnapshot = () => {
    const newSnapshot: Partial<UnwrappedState<T>> = {};

    for (let i = 0; i < stateKeys.length; i++) {
      const key = stateKeys[i];
      const reactiveUnit = state[key];

      newSnapshot[key] = isReactiveUnit(reactiveUnit)
        ? (reactiveUnit.get() as UnwrappedState<T>[typeof key])
        : (reactiveUnit as UnwrappedState<T>[typeof key]);
    }

    if (memoizedSnapshot && shallowEqual(newSnapshot, memoizedSnapshot)) {
      return memoizedSnapshot;
    }

    memoizedSnapshot = newSnapshot as UnwrappedState<T>;

    return memoizedSnapshot;
  };

  let prevState = getSnapshot();

  const triggerWatchers = (
    newState: UnwrappedState<T>,
    oldState: UnwrappedState<T>,
  ) => {
    observeStore(newState, oldState, name);

    Object.values(listeners).forEach((listener) =>
      listener(newState, oldState),
    );
  };

  const observeReactivity = () => {
    const unsubscribeFunctions: (() => void)[] = [];
    const reactiveUnits = stateKeys.filter((key) => isReactiveUnit(state[key]));

    let batchedState: UnwrappedState<T> | null = null;
    let isBatchScheduled = false;

    const triggerBatchUpdate = () => {
      if (!isBatchScheduled) {
        isBatchScheduled = true;

        batchManager.addTask(() => {
          if (batchedState) {
            triggerWatchers(batchedState, prevState);
            prevState = batchedState;
            batchedState = null;
          }

          isBatchScheduled = false;
        });
      }
    };

    for (let i = 0; i < reactiveUnits.length; i++) {
      const key = reactiveUnits[i];
      const reactiveUnit = state[key] as Reactive<unknown>;

      const unsubscribe = reactiveUnit.subscribe((value) => {
        if (!batchedState) {
          batchedState = { ...prevState };
        }

        batchedState[key] = value as UnwrappedState<T>[typeof key];
        triggerBatchUpdate();
      });

      unsubscribeFunctions.push(unsubscribe);
    }

    return () => {
      for (let i = 0; i < unsubscribeFunctions.length; i++) {
        unsubscribeFunctions[i]();
      }
    };
  };

  const action = (cb: (state: T) => unknown) => {
    cb(state);
  };

  const cleanupAll = observeReactivity();

  const subscribe = (callback: WatchCallback<UnwrappedState<T>>) => {
    const id = listenerCounter++;

    listeners[id] = callback;

    return () => {
      delete listeners[id];
    };
  };

  Promise.resolve().then(() => {
    initDevtoolsStore(name, prevState);
  });

  const store: DefineStore<T> = {
    state,
    getSnapshot,
    action,
    subscribe,
    cleanupAll,
  };

  plugins.forEach((plugin) => plugin(store));

  return store;
};

export { defineStore };
