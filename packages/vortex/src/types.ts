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

export type QueryData<Data, TError> = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: TError | null;
  data: Data | undefined;
};

export type QueryOptions = {
  isAutorun?: boolean;
};

export type Query<Data, TError, TOptions> = {
  get: () => QueryData<Data, TError>;
  set: (
    value:
      | QueryData<Data, TError>
      | ((prevValue: QueryData<Data, TError>) => QueryData<Data, TError>),
  ) => void;
  subscribe: (callback: (value: QueryData<Data, TError>) => void) => () => void;
  type: 'query';
  reset(): void;
  refetch(): Promise<void>;
  run: (options: TOptions) => Promise<void>;
};

export type UnwrappedState<T = UnknownState> = {
  [K in keyof T]: T[K] extends Reactive<infer V>
    ? V
    : T[K] extends Computed<infer V>
      ? V
      : T[K] extends Query<infer D, infer E, infer O>
        ? QueryData<D, E> & Record<never, O>
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

  query: <Data, TError, TOptions = void>(
    cb: (options: TOptions) => Promise<Data>,
    options?: QueryOptions,
  ) => Query<Data, TError, TOptions>;
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
