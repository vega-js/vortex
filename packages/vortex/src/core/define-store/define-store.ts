import type {
  DefineApi,
  DefineStore,
  QueryOptions,
  Reactive,
  StoreOptions,
  UnwrappedState,
  WatchCallback,
} from '../../types';
import { isReactiveUnit, toObjectKeys } from '../../utils';
import { BatchManager } from '../batch-manager';
import { ComputedValue } from '../create-computed';
import { Effect } from '../create-effect';
import { QueryHandler } from '../create-query';
import { ReactiveValue } from '../create-reactive';
import { ReactiveContext } from '../reactive-context';
import { initDevtoolsStore, observeStore } from './devtools-connection';

class Store<
  T extends Record<string, unknown>,
  DIDeps extends Record<string, unknown> | undefined = undefined,
> {
  private localContext = new ReactiveContext();

  private batchManager = new BatchManager();

  private listeners = new Map<number, WatchCallback<UnwrappedState<T>>>();

  private listenerCounter = 0;

  private readonly state: T;

  private readonly reactiveUnits: (keyof T)[];

  private prevState: UnwrappedState<T>;

  private readonly stateKeys: (keyof T)[] = [];

  private readonly name: string;

  constructor(
    setup: (args: DefineApi<DIDeps>) => T,
    options: StoreOptions<T, DIDeps> = {},
  ) {
    const { plugins = [], DI, name = `unknown_${Date.now()}` } = options;

    this.name = name;

    this.state = setup({
      reactive: this.createReactive.bind(this),
      computed: this.createComputed.bind(this),
      effect: this.createEffect.bind(this),
      query: this.createQuery.bind(this),
      batch: this.batchManager.batch.bind(this.batchManager),
      DI,
    } as unknown as DefineApi<DIDeps>);

    const stateKeys = toObjectKeys(this.state);

    this.stateKeys = stateKeys;

    this.reactiveUnits = stateKeys.filter((key) =>
      isReactiveUnit(this.state[key]),
    );

    this.prevState = this.getSnapshot();
    this.cleanupAll = this.observeReactivity();
    plugins.forEach((plugin) => plugin(this.getStore()));

    Promise.resolve().then(() => {
      initDevtoolsStore(this.name, this.prevState);
    });
  }

  private createReactive<Value>(initialValue: Value): Reactive<Value> {
    return new ReactiveValue(
      initialValue,
      this.localContext,
      this.batchManager,
    );
  }

  private createComputed<Value>(fn: () => Value) {
    return new ComputedValue(fn, this.localContext, this.batchManager);
  }

  private createEffect(fn: () => void) {
    const effect = new Effect(fn, this.localContext, this.batchManager);

    return effect.stop.bind(effect);
  }

  private createQuery<Data, TError, TOptions>(
    cb: (options: TOptions) => Promise<Data>,
    queryOptions?: QueryOptions<Data, TError>,
  ) {
    return new QueryHandler<Data, TError, TOptions>(
      cb,
      this.localContext,
      queryOptions,
    );
  }

  private getSnapshot(): UnwrappedState<T> {
    const newSnapshot = {} as UnwrappedState<T>;

    for (let i = 0; i < this.stateKeys.length; i++) {
      const key = this.stateKeys[i];
      const reactiveUnit = this.state[key];

      newSnapshot[key] = isReactiveUnit(reactiveUnit)
        ? (reactiveUnit.value as UnwrappedState<T>[typeof key])
        : (reactiveUnit as UnwrappedState<T>[typeof key]);
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

  public cleanupAll(): void {}

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

export const defineStore = <
  T extends Record<string, unknown>,
  DIDeps extends Record<string, unknown> | undefined = undefined,
>(
  setup: (args: DefineApi<DIDeps>) => T,
  options: StoreOptions<T, DIDeps> = {},
): DefineStore<T> => {
  const storeInstance = new Store(setup, options);

  return storeInstance.getStore();
};
