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
  options?: StoreOptions<T, DIDeps>,
): DefineStore<T> => {
  const batchManager = new BatchManager();

  const listeners: WatchCallback<UnwrappedState<T>>[] = [];

  const {
    plugins = [],
    DI,
    name = `unknown_${new Date().toISOString()}`,
  } = options || {};

  const localContext = new ReactiveContext();

  let memoizedSnapshot: UnwrappedState<T> | null = null;

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

  const action = (cb: (state: T) => unknown) => {
    cb(state);
  };

  const getSnapshot = () => {
    const newSnapshot = stateKeys.reduce((acc, key) => {
      const reactiveUnit = state[key];

      acc[key] = isReactiveUnit(reactiveUnit)
        ? (reactiveUnit.get() as UnwrappedState<T>[typeof key])
        : (reactiveUnit as UnwrappedState<T>[typeof key]);

      return acc;
    }, {} as UnwrappedState<T>);

    if (memoizedSnapshot && shallowEqual(newSnapshot, memoizedSnapshot)) {
      return memoizedSnapshot;
    }

    memoizedSnapshot = newSnapshot;

    return newSnapshot;
  };

  let prevState = getSnapshot();

  const triggerWatchers = (
    newState: UnwrappedState<T>,
    oldState: UnwrappedState<T>,
  ) => {
    observeStore(newState, oldState, name);
    listeners.forEach((listener) => listener(newState, oldState));
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

    reactiveUnits.forEach((key) => {
      const reactiveUnit = state[key] as Reactive<unknown>;

      const unsubscribe = reactiveUnit.subscribe((value) => {
        if (!batchedState) {
          batchedState = { ...prevState };
        }

        batchedState[key] = value as UnwrappedState<T>[typeof key];
        triggerBatchUpdate();
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
      unsubscribeFunctions.length = 0;
    };
  };

  const cleanupAll = observeReactivity();

  const subscribe = (callback: WatchCallback<UnwrappedState<T>>) => {
    if (!listeners.includes(callback)) {
      listeners.push(callback);
    }

    return () => {
      const index = listeners.indexOf(callback);

      if (index > -1) {
        listeners.splice(index, 1);
      }
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
