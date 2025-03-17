import type { RetryOptions } from './utils';

export type UnknownState = Record<string, unknown>;

export type Reactive<Value> = {
  get value(): Value;
  set value(value: Value | ((prevValue: Value) => Value));
  subscribe: (callback: (value: Value) => void) => () => void;
  reset: () => void;
  type: 'reactive';
};

export type Computed<Value> = {
  get value(): Value;
  subscribe: (callback: (value: Value) => void) => () => void;
  type: 'computed';
};

export type QueryData<Data, TError> = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: TError | null;
  data: Data | undefined;
  isIdle: boolean;
};

export type MutationState<TError> = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: TError | null;
  isIdle: boolean;
};

export type QueryOptions<TData, TError> = {
  isAutorun?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  enable?: () => boolean;
  retry?: RetryOptions;
  stopPollingOnError?: boolean;
  keepDataOnError?: boolean;
};

export type MutationOptions<
  TData = unknown,
  TError = unknown,
  TOptions = unknown,
> = {
  onSuccess?: (data: TData, options: TOptions) => void;
  onError?: (error: TError, options: TOptions) => void;
};

export type Mutation<Data, TError, TOptions> = {
  state: MutationState<TError>;
  type: '$$mutation';
  reset(): void;
  runSync: (options: TOptions) => void;
  runAsync: (options: TOptions) => Promise<Data | undefined>;
};

export type Query<Data, TError = unknown, TOptions = void> = {
  get value(): QueryData<Data, TError>;
  set value(value: QueryData<Data, TError>);
  subscribe: (callback: (value: QueryData<Data, TError>) => void) => () => void;
  type: '$$query';
  reset(): void;
  update(value: Data | ((value: Data | undefined) => Data)): void;
  refetch(): Promise<Data>;
  startPolling(interval: number, immediately?: boolean): void;
  stopPolling(): void;
  run: (options: TOptions) => Promise<Data>;
};

export type UnwrappedState<T = UnknownState> = {
  [K in keyof T]: T[K] extends Reactive<infer V>
    ? V
    : T[K] extends Computed<infer V>
      ? V
      : // Query
        T[K] extends Query<infer D, infer E, infer O>
        ? QueryData<D, E> & Record<never, O>
        : // Mutation
          T[K] extends Mutation<infer D, infer E, infer O>
          ? Pick<Mutation<D, E, O>, 'reset' | 'runAsync' | 'runSync'> &
              MutationState<E>
          : T[K];
};

export type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type WatchCallback<T> = (newState: T, oldState: T) => void;

export type DefineStore<T extends UnknownState> = {
  state: T;
  subscribe(callback: WatchCallback<UnwrappedState<T>>): () => void;
  getSnapshot(): UnwrappedState<T>;
  action(cb: (state: T) => void): void;
  cleanupAll(): void;
};

export type DefineApi = {
  reactive: <Value>(initialValue: Value) => Reactive<Value>;
  computed: <T>(fn: () => T) => Computed<T>;
  effect: (fn: () => void) => () => void;
  batch: (task: () => void) => void;
  query: <Data, TError = unknown, TOptions = void>(
    cb: (options: TOptions) => Promise<Data>,
    options?: QueryOptions<Data, TError>,
  ) => Query<Data, TError, TOptions>;

  mutation: <Data, TError, TOptions = void>(
    cb: (options: TOptions) => Promise<Data>,
    options?: MutationOptions<Data, TError, TOptions>,
  ) => Mutation<Data, TError, TOptions>;
};

export type Plugin<T extends UnknownState> = ((
  store: DefineStore<T>,
) => void) & {
  pluginName?: string;
};

export type StoreOptions<T extends UnknownState> = {
  plugins?: Plugin<T>[];
  name?: string;
};
