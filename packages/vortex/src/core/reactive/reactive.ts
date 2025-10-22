import {
  computed as alienComputed,
  effect as alienEffect,
  signal as alienSignal,
  endBatch,
  getCurrentSub,
  setCurrentSub,
  startBatch
} from 'alien-signals';
import type {
  Mutation,
  MutationOptions,
  MutationState,
  Query,
  QueryData,
  QueryOptions,
} from '../../types';
import { type RetryOptions, retry } from '../../utils';

export class Effect<T = unknown> {
  private stopFn: (() => void) | undefined;

  constructor(public fn: () => T) {}

  run(): T {
    const prevSub = getCurrentSub();
    setCurrentSub(this as any);
    
    try {
      return this.fn();
    } finally {
      setCurrentSub(prevSub);
    }
  }

  start(): T {
    this.stopFn = alienEffect(() => this.fn());
    return this.run();
  }

  stop(): void {
    if (this.stopFn) {
      this.stopFn();
      this.stopFn = undefined;
    }
  }
}

export class Reactive<T = unknown> {
  public type = '$$reactive';
  private signal: () => T;
  private setter: (value: T) => void;

  constructor(public currentValue: T) {
    const signalFn = alienSignal(currentValue);
    this.signal = signalFn;
    this.setter = signalFn;
  }

  get value(): T {
    return this.signal();
  }

  set value(value: T) {
    this.setter(value);
    this.currentValue = value;
  }

  subscribe(callback: (value: T) => void) {
    return alienEffect(() => callback(this.value));
  }
}

export class Computed<T = unknown> {
  public type = '$$computed';
  private computed: () => T;

  constructor(public getter: () => T) {
    this.computed = alienComputed(this.getter);
  }

  get value(): T {
    return this.computed();
  }

  subscribe(callback: (value: T) => void) {
    return alienEffect(() => callback(this.value));
  }
}

const createInitial = <Data, TError>() => ({
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null as TError | null,
  data: undefined as Data | undefined,
  isIdle: false,
});

function isDataUpdater<Data>(value: unknown): value is (v: Data) => Data {
  return typeof value === 'function';
}

export class QueryHandler<Data, TError = unknown, TOptions = void>
  implements Query<Data, TError, TOptions>
{
  public type = '$$query' as const;

  #lastOptions: TOptions | undefined;

  #isFirstRun = true;

  private pollingTimer: ReturnType<typeof setTimeout> | null = null;

  private unifiedPromise?: Promise<Data>;

  readonly #onError?: (error: TError) => void;

  readonly #onSuccess?: (data: Data) => void;

  readonly #state: Reactive<QueryData<Data, TError>>;

  constructor(
    private readonly asyncFn: (options: TOptions) => Promise<Data>,
    private readonly options?: QueryOptions<Data, TError> & {
      retry?: RetryOptions;
    },
  ) {
    this.#state = new Reactive(createInitial<Data, TError>());
    this.#lastOptions = undefined;
    this.#onError = this.options?.onError;
    this.#onSuccess = this.options?.onSuccess;
  }

  public get value() {
    if (this.#isFirstRun && this.options?.isAutorun) {
      const enabled =
        typeof this.options.enable === 'function'
          ? this.options?.enable?.()
          : true;

      if (enabled) {
        this.#isFirstRun = false;
        this.run(undefined as TOptions);
      }
    }

    return this.#state.value;
  }

  public set value(value: QueryData<Data, TError>) {
    this.#state.value = value;
  }

  public subscribe = (callback: (value: QueryData<Data, TError>) => void) =>
    this.#state.subscribe(callback);

  public run = async (runOptions: TOptions) => {
    if (this.unifiedPromise) {
      return this.unifiedPromise;
    }

    this.#lastOptions = runOptions;
    this.setLoading();

    const execute = () => this.asyncFn(runOptions);

    const execWithRetry = this.options?.retry
      ? () => retry(execute, this.options?.retry)
      : execute;

    this.unifiedPromise = execWithRetry()
      .then((result) => {
        this.setSuccess(result);
        this.#onSuccess?.(result);
        this.unifiedPromise = undefined;

        return result;
      })
      .catch((err: TError) => {
        this.setError(err);
        this.#onError?.(err);
        this.unifiedPromise = undefined;

        if (this.options?.stopPollingOnError) {
          this.stopPolling();
        }

        throw err;
      }) as Promise<Data>;

    return this.unifiedPromise;
  };

  public reset = () => {
    this.#state.value = createInitial<Data, TError>();
    this.#lastOptions = undefined;
    this.unifiedPromise = undefined;
    this.stopPolling();
    this.#isFirstRun = true;
  };

  public update = (value: Data | ((value: Data | undefined) => Data)) => {
    this.#state.value = {
      ...this.#state.value,
      data: isDataUpdater<Data>(value) ? value(this.#state.value.data) : value,
    };
  };

  public refetch = () => {
    return this.run(this.#lastOptions as TOptions);
  };

  public startPolling(interval: number, immediately = false) {
    if (this.pollingTimer) {
      return;
    }

    if (immediately) {
      this.refetch();
    }

    this.pollingTimer = setInterval(() => {
      this.refetch();
    }, interval);
  }

  public stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private setLoading = () => {
    this.#state.value = {
      ...this.#state.value,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      isIdle: true,
    };
  };

  private setSuccess = (data: Data) => {
    this.#state.value = {
      ...this.#state.value,
      isLoading: false,
      isSuccess: true,
      data,
    };
  };

  private setError = (error: TError) => {
    this.#state.value = {
      ...this.#state.value,
      data: this.options?.keepDataOnError ? this.#state.value.data : undefined,
      isLoading: false,
      isError: true,
      error,
    };
  };
}

const createMutationInitial = <TError>() => ({
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null as TError | null,
  isIdle: false,
});

export class MutationHandler<Data, TError = unknown, TOptions = void>
  implements Mutation<Data, TError, TOptions>
{
  public type = '$$mutation' as const;

  readonly #onError?: (error: TError, options: TOptions) => void;

  readonly #onSuccess?: (data: Data, options: TOptions) => void;

  readonly #state: Reactive<MutationState<TError>>;

  constructor(
    private readonly asyncFn: (options: TOptions) => Promise<Data>,
    private readonly options?: MutationOptions<Data, TError, TOptions>,
  ) {
    this.#state = new Reactive(createMutationInitial<TError>());
    this.#onError = this.options?.onError;
    this.#onSuccess = this.options?.onSuccess;
  }

  get state() {
    return this.#state.value;
  }

  public get value() {
    return this.#state.value;
  }

  public subscribe = (callback: (value: MutationState<TError>) => void) =>
    this.#state.subscribe(callback);

  public runSync = (options: TOptions) => {
    this.runAsync(options);
  };

  // @ts-ignore
  public runAsync = async (options: TOptions) => {
    this.setLoading();

    try {
      const result = await this.asyncFn(options);

      this.setSuccess();
      this.#onSuccess?.(result, options);

      return result;
    } catch (err) {
      this.setError(err as TError);
      this.#onError?.(err as TError, options);
    }
  };

  public reset = () => {
    this.#state.value = createMutationInitial<TError>();
  };

  private setLoading = () => {
    this.#state.value = {
      ...this.#state.value,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      isIdle: true,
    };
  };

  private setSuccess = () => {
    this.#state.value = {
      ...this.#state.value,
      isLoading: false,
      isSuccess: true,
    };
  };

  private setError = (error: TError) => {
    this.#state.value = {
      ...this.#state.value,
      isLoading: false,
      isError: true,
      error,
    };
  };
}

const arrayMethodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
] as const;

const updateArrayMethods = ['push', 'unshift'];

const spliceArrayMethods = 'splice';

type UnknownReactivity = object | unknown[];
type ArrayMethod = (typeof arrayMethodsToPatch)[number];

class ReactiveArray<T> {
  private readonly reactiveArray: T[];

  constructor(
    array: T[],
    private readonly makeReactive: (value: T) => T,
    private readonly updateCallback: () => void,
  ) {
    this.reactiveArray = array.map(makeReactive);
    this.makeReactive = makeReactive;
    this.updateCallback = updateCallback;
  }

  public createReactive() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return new Proxy(this.reactiveArray, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (
          typeof value === 'function' &&
          arrayMethodsToPatch.includes(prop as ArrayMethod)
        ) {
          return (...args: unknown[]) => {
            const result = value.apply(target, args);

            if (updateArrayMethods.includes(prop as string)) {
              args.forEach((arg, index) => {
                target[target.length - args.length + index] = self.makeReactive(
                  arg as T,
                );
              });
            } else if (prop === spliceArrayMethods && args.length > 2) {
              for (let i = 2; i < args.length; i++) {
                args[i] = self.makeReactive(args[i] as T);
              }
            }

            self.updateCallback();

            return result;
          };
        }

        return value;
      },

      set(target, prop, value, receiver) {
        const index = Number(prop);
        let reactiveValue = value;

        if (!Number.isNaN(index)) {
          reactiveValue = self.makeReactive(value as T);
        }

        const result = Reflect.set(target, prop, reactiveValue, receiver);

        self.updateCallback();

        return result;
      },

      deleteProperty(target, prop) {
        const result = Reflect.deleteProperty(target, prop);

        self.updateCallback();

        return result;
      },
    });
  }
}

class DeepReactive<T = unknown | UnknownReactivity> {
  public readonly type = '$$reactive';

  private reactive: Reactive<{ inner: T }>;

  private reactiveCache = new WeakMap<object, object>();

  constructor(initialValue: T) {
    this.reactive = new Reactive({
      inner: this.makeReactive(initialValue),
    });
  }

  private makeReactive(value: T): T {
    if (this.isPrimitive(value)) {
      return value;
    }

    if (this.reactiveCache.has(value as object)) {
      return this.reactiveCache.get(value as object) as T;
    }

    const reactiveValue = Array.isArray(value)
      ? new ReactiveArray(
          value,
          this.makeReactive.bind(this),
          this.update.bind(this),
        ).createReactive()
      : this.defineReactiveObject(value as T & object);

    this.reactiveCache.set(value as object, reactiveValue);

    return reactiveValue as T;
  }

  private isPrimitive(value: unknown): value is Exclude<T, UnknownReactivity> {
    return typeof value !== 'object' || value === null;
  }

  private defineReactiveObject(obj: T & object): object {
    const proxy = new Proxy(obj, {
      set: (target, prop: keyof T, value) => {
        const isNewProperty = !(prop in target);

        target[prop] = value;

        if (isNewProperty) {
          this.makeReactiveProperty(target, prop);
        }

        this.update();

        return true;
      },
      deleteProperty: (target, prop: keyof T) => {
        if (prop in target) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete target[prop];
          this.update();
        }

        return true;
      },
    } as ProxyHandler<T & object>);

    Object.keys(obj).forEach((key) =>
      this.makeReactiveProperty(obj, key as keyof T),
    );

    return proxy;
  }

  private makeReactiveProperty(target: T & object, prop: keyof T) {
    let reactiveValue = this.makeReactive(target[prop] as T);

    Object.defineProperty(target, prop, {
      get: () => reactiveValue,
      set: (newValue) => {
        if (newValue !== reactiveValue) {
          reactiveValue = this.makeReactive(newValue);
        }
      },
      configurable: true,
      enumerable: true,
    });
  }

  private update() {
    this.reactive.value = { inner: this.reactive.value.inner };
  }

  public get value() {
    return this.reactive.value.inner;
  }

  public set value(newValue: T) {
    this.reactive.value = { inner: this.makeReactive(newValue) };
  }

  public subscribe(callback: (value: T) => void) {
    return this.reactive.subscribe(({ inner }) => callback(inner));
  }
}

/**
 * Creates a computed reactive value that updates when dependencies change.
 * @template T
 * @param {() => T} getter - Function that computes the value.
 * @returns {Computed<T>} A computed reactive value.
 */
export function computed<T>(getter: () => T): Computed<T> {
  return new Computed<T>(getter);
}

/**
 * Batches multiple state updates to optimize reactivity processing.
 * @param {() => void} cb - Callback function containing batched updates.
 */
export function batch(cb: () => void) {
  startBatch();

  try {
    cb();
  } finally {
    endBatch();
  }
}

/**
 * Creates a reactive state container.
 * @template T
 * @param {T} [oldValue] - Initial value for the reactive state.
 * @returns {Reactive<T | undefined>} A reactive object.
 */
export function reactive<T>(): Reactive<T | undefined>;
export function reactive<T>(oldValue: T): Reactive<T>;
export function reactive<T>(oldValue?: T): Reactive<T | undefined> {
  return new Reactive(oldValue);
}

/**
 * Runs an effect function that reacts to changes in reactive dependencies.
 * @template T
 * @param {() => T} fn - Effect function that runs reactively.
 * @returns {() => void} A function to stop the effect.
 */
export function effect<T>(fn: () => T) {
  return alienEffect(fn);
}

export function deepReactive<T>(): DeepReactive<T | undefined>;

export function deepReactive<T>(oldValue: T): DeepReactive<T>;

/**
 * Creates a deeply reactive state container that tracks nested changes.
 * @template T
 * @param {T} [oldValue] - Initial value for the deep reactive state.
 * @returns {DeepReactive<T | undefined>} A deep reactive object.
 */
export function deepReactive<T>(oldValue?: T): DeepReactive<T | undefined> {
  return new DeepReactive(oldValue);
}

/**
 * Creates a reactive query that fetches data asynchronously and tracks its state.
 * @template Data
 * @template TError
 * @template TOptions
 * @param {(options: TOptions) => Promise<Data>} asyncFn - Async function that fetches data.
 * @param {QueryOptions<Data, TError> & { retry?: RetryOptions }} [options] - Query options.
 * @returns {QueryHandler<Data, TError, TOptions>} A reactive query handler.
 */
export function query<Data, TError = unknown, TOptions = void>(
  asyncFn: (options: TOptions) => Promise<Data>,
  options?: QueryOptions<Data, TError> & {
    retry?: RetryOptions;
  },
) {
  return new QueryHandler<Data, TError, TOptions>(asyncFn, options);
}

/**
 * Creates a reactive mutation handler for managing async state changes.
 * @template Data
 * @template TError
 * @template TOptions
 * @param {(options: TOptions) => Promise<Data>} asyncFn - Async function that performs the mutation.
 * @param {MutationOptions<Data, TError, TOptions>} [options] - Mutation options.
 * @returns {MutationHandler<Data, TError, TOptions>} A reactive mutation handler.
 */
export function mutation<Data, TError = unknown, TOptions = void>(
  asyncFn: (options: TOptions) => Promise<Data>,
  options?: MutationOptions<Data, TError, TOptions>,
) {
  return new MutationHandler<Data, TError, TOptions>(asyncFn, options);
}
