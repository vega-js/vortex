import { PERSIST_NAME } from '../../constants';
import type {
  DefineApi,
  DefineStore,
  MutationOptions,
  QueryOptions,
  Reactive,
  StoreOptions,
  UnwrappedState,
  WatchCallback,
} from '../../types';
import { isMutation, isReactiveUnit, toObjectKeys } from '../../utils';
import {
  MutationHandler,
  QueryHandler,
  batch,
  computed,
  effect,
  reactive,
} from '../reactive';
import { initDevtoolsStore, observeStore } from './devtools-connection';

class Store<
  T extends Record<string, unknown>,
  DIDeps extends Record<string, unknown> | undefined = undefined,
> {
  private listeners = new Map<number, WatchCallback<UnwrappedState<T>>>();

  private listenerCounter = 0;

  private readonly state: T;

  private readonly reactiveUnits: (keyof T)[];

  private prevState: UnwrappedState<T>;

  private readonly stateKeys: (keyof T)[] = [];

  private readonly name: string;

  public isPersist = false;

  constructor(
    setup: (args: DefineApi<DIDeps>) => T,
    private readonly options: StoreOptions<T, DIDeps> = {},
  ) {
    const { plugins = [], DI, name = `unknown_${Date.now()}` } = options;

    this.name = name;

    this.state = setup({
      reactive: reactive,
      computed: computed,
      effect: effect,
      query: this.createQuery.bind(this),
      mutation: this.createMutation.bind(this),
      batch: batch,
      DI,
    } as unknown as DefineApi<DIDeps>);

    const stateKeys = toObjectKeys(this.state);

    this.stateKeys = stateKeys;

    this.reactiveUnits = stateKeys.filter(
      (key) => isReactiveUnit(this.state[key]) || isMutation(this.state[key]),
    );

    this.prevState = this.getSnapshot();
    this.cleanupAll = this.observeReactivity();

    for (const plugin of plugins) {
      plugin(this.getStore());

      if (plugin.pluginName === PERSIST_NAME) {
        this.isPersist = true;
      }
    }

    Promise.resolve().then(() => {
      initDevtoolsStore(this.name, this.prevState);
    });
  }

  private createQuery<Data, TError, TOptions>(
    cb: (options: TOptions) => Promise<Data>,
    queryOptions?: QueryOptions<Data, TError>,
  ) {
    return new QueryHandler<Data, TError, TOptions>(cb, queryOptions);
  }

  private createMutation<Data, TError, TOptions>(
    cb: (options: TOptions) => Promise<Data>,
    mutationOptions?: MutationOptions<Data, TError, TOptions>,
  ) {
    return new MutationHandler<Data, TError, TOptions>(cb, mutationOptions);
  }

  private getSnapshot(): UnwrappedState<T> {
    const newSnapshot = {} as UnwrappedState<T>;

    for (let i = 0; i < this.stateKeys.length; i++) {
      const key = this.stateKeys[i];
      const reactiveUnit = this.state[key];

      newSnapshot[key] = isReactiveUnit(reactiveUnit)
        ? (reactiveUnit.value as UnwrappedState<T>[typeof key])
        : (reactiveUnit as UnwrappedState<T>[typeof key]);

      if (isMutation(reactiveUnit)) {
        newSnapshot[key] = {
          ...reactiveUnit.state,
          runSync: reactiveUnit.runSync,
          runAsync: reactiveUnit.runAsync,
          reset: reactiveUnit.reset,
        } as UnwrappedState<T>[typeof key];
      }
    }

    return newSnapshot;
  }

  private triggerWatchers(
    newState: UnwrappedState<T>,
    oldState: UnwrappedState<T>,
  ) {
    this.listeners.forEach((listener) => listener(newState, oldState));
    Promise.resolve().then(() => observeStore(newState, oldState, this.name));
  }

  private isBatchScheduled = false;

  private observeReactivity(): () => void {
    const unsubscribeFunctions: (() => void)[] = [];

    let batchedState: UnwrappedState<T> | null = null;

    const triggerBatchUpdate = () => {
      if (!this.isBatchScheduled) {
        this.isBatchScheduled = true;

        Promise.resolve().then(() => {
          if (batchedState) {
            this.triggerWatchers(batchedState, this.prevState);
            this.prevState = batchedState;
            batchedState = null;
          }

          this.isBatchScheduled = false;
        });
      }
    };

    for (let i = 0; i < this.reactiveUnits.length; i++) {
      const key = this.reactiveUnits[i];
      const reactiveUnit = this.state[key] as Reactive<unknown>;

      const unsubscribe = reactiveUnit.subscribe((value) => {
        if (!batchedState) {
          batchedState = { ...this.prevState };
        }

        if (isMutation(this.state[key])) {
          batchedState[key] = {
            ...(value || {}),
            runSync: this.state[key].runSync,
            runAsync: this.state[key].runAsync,
            reset: this.state[key].reset,
          } as UnwrappedState<T>[typeof key];
        } else {
          batchedState[key] = value as UnwrappedState<T>[typeof key];
        }

        triggerBatchUpdate();
      });

      unsubscribeFunctions.push(unsubscribe);
    }

    return () => {
      for (let i = 0; i < unsubscribeFunctions.length; i++) {
        unsubscribeFunctions[i]();
      }
    };
  }

  public action(cb: (state: T) => unknown): void {
    cb(this.state);
  }

  public subscribe(callback: WatchCallback<UnwrappedState<T>>): () => void {
    const id = this.listenerCounter++;

    this.listeners.set(id, callback);

    return () => {
      this.listeners.delete(id);
    };
  }

  public cleanupAll(): void {
    this.options?.DI?.destroy?.();
  }

  public getStore(): DefineStore<T> {
    return {
      state: this.state,
      getSnapshot: this.getSnapshot.bind(this),
      action: this.action.bind(this),
      subscribe: this.subscribe.bind(this),
      cleanupAll: this.cleanupAll.bind(this),
    };
  }
}

function getLazy<T>(factory: () => T): () => T {
  let instance: T | null = null;

  return () => {
    if (instance === null) {
      instance = factory();
    }

    return instance;
  };
}

export function defineStore<
  T extends Record<string, unknown>,
  DIDeps extends Record<string, unknown> | undefined = undefined,
>(
  setup: (args: DefineApi<DIDeps>) => T,
  options?: StoreOptions<T, DIDeps>,
): DefineStore<T> {
  return new Store(setup, options).getStore();
}

export function defineLazyStore<
  T extends Record<string, unknown>,
  DIDeps extends Record<string, unknown> | undefined = undefined,
>(
  setup: (args: DefineApi<DIDeps>) => T,
  options?: StoreOptions<T, DIDeps> & {
    singleton?: boolean;
  },
): () => DefineStore<T> {
  let storeInstance: DefineStore<T> | null;

  return getLazy(() => {
    if (options?.singleton) {
      if (!storeInstance) {
        storeInstance = new Store(setup, options).getStore();
      }

      return storeInstance;
    }

    return new Store(setup, options).getStore();
  });
}
