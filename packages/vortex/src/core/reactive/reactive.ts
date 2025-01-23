import {
  type Dependency,
  type Link,
  type Subscriber,
  SubscriberFlags,
  createReactiveSystem,
} from 'alien-signals';
import type { Query, QueryData, QueryOptions } from '../../types';

const {
  link,
  propagate,
  endTracking,
  startTracking,
  updateDirtyFlag,
  processComputedUpdate,
  processEffectNotifications,
} = createReactiveSystem({
  updateComputed(computed: Computed) {
    return computed.update();
  },
  notifyEffect(effect: Effect) {
    effect.notify();

    return true;
  },
});

let activeSub: Subscriber | undefined = undefined;
let batchDepth = 0;

export class Effect<T = any> implements Subscriber {
  // Subscriber fields
  deps: Link | undefined = undefined;

  depsTail: Link | undefined = undefined;

  flags: SubscriberFlags = SubscriberFlags.Effect;

  constructor(public fn: () => T) {}

  notify(): void {
    const flags = this.flags;

    if (
      flags & SubscriberFlags.Dirty ||
      (flags & SubscriberFlags.PendingComputed && updateDirtyFlag(this, flags))
    ) {
      this.run();
    }
  }

  run(): T {
    const prevSub = activeSub;

    activeSub = this;
    startTracking(this);

    try {
      return this.fn();
    } finally {
      activeSub = prevSub;
      endTracking(this);
    }
  }

  stop(): void {
    startTracking(this);
    endTracking(this);
  }
}

export function effect<T>(fn: () => T) {
  const e = new Effect(fn);

  const cb = e.run();

  return () => {
    if (cb !== undefined && typeof cb === 'function') {
      cb();
    }

    e.stop();
  };
}

export function startBatch(): void {
  ++batchDepth;
}

export function endBatch(): void {
  if (!--batchDepth) {
    processEffectNotifications();
  }
}

export function batch(cb: () => void) {
  startBatch();

  try {
    cb();
  } finally {
    endBatch();
  }
}

export function reactive<T>(): Reactive<T | undefined>;

export function reactive<T>(oldValue: T): Reactive<T>;

export function reactive<T>(oldValue?: T): Reactive<T | undefined> {
  return new Reactive(oldValue);
}

export class Reactive<T = any> implements Dependency {
  public type = '$$reactive';

  // Dependency fields
  subs: Link | undefined = undefined;

  subsTail: Link | undefined = undefined;

  constructor(public currentValue: T) {}

  get value(): T {
    if (activeSub !== undefined) {
      link(this, activeSub);
    }

    return this.currentValue;
  }

  set value(value: T) {
    if (this.currentValue !== value) {
      this.currentValue = value;

      const subs = this.subs;

      if (subs !== undefined) {
        propagate(subs);

        if (!batchDepth) {
          processEffectNotifications();
        }
      }
    }
  }

  subscribe(callback: (value: T) => void) {
    const effectInst = new Effect(() => callback(this.value));

    effectInst.run();

    return () => effectInst.stop();
  }
}

export function computed<T>(getter: () => T): Computed<T> {
  return new Computed<T>(getter);
}

export class Computed<T = any> implements Subscriber, Dependency {
  public type = '$$computed';

  currentValue: T | undefined = undefined;

  // Dependency fields
  subs: Link | undefined = undefined;

  subsTail: Link | undefined = undefined;

  // Subscriber fields
  deps: Link | undefined = undefined;

  depsTail: Link | undefined = undefined;

  flags: SubscriberFlags = SubscriberFlags.Computed | SubscriberFlags.Dirty;

  constructor(public getter: () => T) {}

  get value(): T {
    const flags = this.flags;

    if (flags & (SubscriberFlags.PendingComputed | SubscriberFlags.Dirty)) {
      processComputedUpdate(this, flags);
    }

    if (activeSub !== undefined) {
      link(this, activeSub);
    }

    return this.currentValue!;
  }

  update(): boolean {
    const prevSub = activeSub;

    activeSub = this;
    startTracking(this);

    try {
      const oldValue = this.currentValue;
      const newValue = this.getter();

      if (oldValue !== newValue) {
        this.currentValue = newValue;

        return true;
      }

      return false;
    } finally {
      activeSub = prevSub;
      endTracking(this);
    }
  }

  subscribe(callback: (value: T) => void) {
    const effectInst = new Effect(() => callback(this.value));

    effectInst.run();

    return () => effectInst.stop();
  }
}

const createInitial = <Data, TError>() => ({
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null as TError | null,
  data: undefined as Data | undefined,
});

export class QueryHandler<Data, TError, TOptions>
  implements Query<Data, TError, TOptions>
{
  public type = '$$query' as const;

  #lastOptions: TOptions | undefined;

  readonly #onError?: (error: TError) => void;

  readonly #onSuccess?: (data: Data) => void;

  readonly #state: Reactive<QueryData<Data, TError>>;

  constructor(
    private readonly asyncFn: (options: TOptions) => Promise<Data>,
    private readonly options?: QueryOptions<Data, TError>,
  ) {
    this.#state = new Reactive(createInitial<Data, TError>());
    this.#lastOptions = undefined;
    this.#onError = this.options?.onError;
    this.#onSuccess = this.options?.onSuccess;

    if (options?.isAutorun) {
      this.run(undefined as TOptions);
    }
  }

  public get value() {
    return this.#state.value;
  }

  public set = (
    value:
      | QueryData<Data, TError>
      | ((prevValue: QueryData<Data, TError>) => QueryData<Data, TError>),
  ) => {
    const newValue = typeof value === 'function' ? value(this.value) : value;

    this.#state.value = newValue;
  };

  public subscribe = (callback: (value: QueryData<Data, TError>) => void) =>
    this.#state.subscribe(callback);

  public run = async (runOptions: TOptions) => {
    this.#lastOptions = runOptions;
    this.setLoading();

    try {
      const result = await this.asyncFn(runOptions);

      this.setSuccess(result);
      this.#onSuccess?.(result);
    } catch (err) {
      this.setError(err as TError);
      this.#onError?.(err as TError);
    }
  };

  public reset = () => {
    this.#state.value = createInitial<Data, TError>();
    this.#lastOptions = undefined;
  };

  public refetch = () => {
    return this.run(this.#lastOptions as TOptions);
  };

  private setLoading = () => {
    this.#state.value = {
      ...this.#state.value,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
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
      data: undefined,
      isLoading: false,
      isError: true,
      error,
    };
  };
}
