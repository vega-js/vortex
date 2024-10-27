import type { DIContainer } from './core';

type UnknownState = Record<string, unknown>;

export type Reactive<Value> = {
  get: () => Value;
  set: (value: Value | ((prevValue: Value) => Value)) => void;
  subscribe: (callback: (value: Value) => void) => () => void;
  reset: () => void;
  type: 'reactive';
};

export type Computed<Value> = {
  get: () => Value;
  subscribe: (callback: (value: Value) => void) => () => void;
  type: 'computed';
};

export type UnwrappedState<T = UnknownState> = {
  [K in keyof T]: T[K] extends Reactive<infer V>
    ? V
    : T[K] extends Computed<infer V>
      ? V
      : T[K];
};

export type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type StateWithoutActions<T extends UnknownState> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

export type WatchCallback<T> = (newState: T, oldState: T) => void;

export type DefineStore<T extends UnknownState> = {
  state: T;
  subscribe(callback: WatchCallback<UnwrappedState<T>>): () => void;
  getSnapshot(): UnwrappedState<T>;
  action(cb: (state: T) => void): void;
};

export type DefineApi<Deps = Record<string, unknown> | undefined> = {
  reactive: <Value>(initialValue: Value) => Reactive<Value>;
  computed: <T>(fn: () => T) => Computed<T>;
  effect: (fn: () => void) => void;
  DI: Deps extends undefined ? never : DIContainer<Deps>;
};

export type DefineLocalApi<DIDeps> = Omit<DefineApi, 'DI'> & {
  DI?: DIContainer<DIDeps>;
};

export type Plugin<T extends UnknownState> = (store: DefineStore<T>) => void;

export type StoreOptions<
  T extends UnknownState,
  Deps = Record<string, unknown> | undefined,
> = {
  plugins?: Plugin<T>[];
  DI?: DIContainer<Deps>;
  name?: string;
};
