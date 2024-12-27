const States = {
  Running: 1 << 0,
  Notified: 1 << 1,
  Outdated: 1 << 2,
  Disposed: 1 << 3,
  HasError: 1 << 4,
  Tracking: 1 << 5,
} as const;

type DependencyNode = {
  source: Reactive | Computed;
  previousSource?: DependencyNode;
  nextSource?: DependencyNode;

  target: Computed | EffectExecutor;
  previousTarget?: DependencyNode;
  nextTarget?: DependencyNode;

  version: number;

  rollbackNode?: DependencyNode;
};

type EqualCb = (a: unknown, b: unknown) => boolean;

const FLAGS_NOTIFY = States.Outdated | States.Notified;

class ExecutionContext {
  static currentContext: Computed | EffectExecutor | undefined = undefined;

  static clearDependencies(target: Computed | EffectExecutor) {
    let currentNode = target.sources;
    let lastValidNode: DependencyNode | undefined = undefined;

    while (currentNode !== undefined) {
      const prev = currentNode.previousSource;

      if (currentNode.version === -1) {
        currentNode.source.unsubscribe(currentNode);
        ExecutionContext.unlinkNode(currentNode);
      } else {
        lastValidNode = currentNode;
      }

      if (currentNode.rollbackNode !== undefined) {
        currentNode.source.dependencyNode = currentNode.rollbackNode;
        currentNode.rollbackNode = undefined;
      }

      currentNode = prev;
    }

    target.sources = lastValidNode;
  }

  private static unlinkNode(node: DependencyNode) {
    if (node.previousSource) {
      node.previousSource.nextSource = node.nextSource;
    }

    if (node.nextSource) {
      node.nextSource.previousSource = node.previousSource;
    }

    node.previousSource = node.nextSource = undefined;
  }

  static setupDependencies(target: Computed | EffectExecutor) {
    let currentNode = target.sources;

    while (currentNode !== undefined) {
      const rollbackNode = currentNode.source.dependencyNode;

      if (rollbackNode !== undefined) {
        currentNode.rollbackNode = rollbackNode;
      }

      currentNode.source.dependencyNode = currentNode;
      currentNode.version = -1;

      if (currentNode.nextSource === undefined) {
        target.sources = currentNode;

        break;
      }

      currentNode = currentNode.nextSource;
    }
  }

  static trackDependency(
    signal: Reactive | Computed,
  ): DependencyNode | undefined {
    if (ExecutionContext.currentContext === undefined) {
      return undefined;
    }

    let dependencyNode = signal.dependencyNode;

    if (
      dependencyNode === undefined ||
      dependencyNode.target !== ExecutionContext.currentContext
    ) {
      dependencyNode = {
        version: 0,
        source: signal,
        previousSource: ExecutionContext.currentContext.sources,
        nextSource: undefined,
        target: ExecutionContext.currentContext,
        previousTarget: undefined,
        nextTarget: undefined,
        rollbackNode: dependencyNode,
      };

      if (ExecutionContext.currentContext.sources !== undefined) {
        ExecutionContext.currentContext.sources.nextSource = dependencyNode;
      }

      ExecutionContext.currentContext.sources = dependencyNode;
      signal.dependencyNode = dependencyNode;

      if (ExecutionContext.currentContext.flags & States.Tracking) {
        signal.subscribeToNode(dependencyNode);
      }

      return dependencyNode;
    }
    if (dependencyNode.version === -1) {
      dependencyNode.version = 0;

      if (dependencyNode.nextSource !== undefined) {
        dependencyNode.nextSource.previousSource =
          dependencyNode.previousSource;

        if (dependencyNode.previousSource !== undefined) {
          dependencyNode.previousSource.nextSource = dependencyNode.nextSource;
        }

        dependencyNode.previousSource = ExecutionContext.currentContext.sources;
        dependencyNode.nextSource = undefined;
        ExecutionContext.currentContext.sources!.nextSource = dependencyNode;
        ExecutionContext.currentContext.sources = dependencyNode;
      }

      return dependencyNode;
    }

    return undefined;
  }
}

class BatchProcessor {
  static maxUpdates = 100;

  static globalVersion = 0;

  static pendingEffect: EffectExecutor | undefined = undefined;

  static depth = 0;

  static iteration = 0;

  static start() {
    BatchProcessor.depth = (BatchProcessor.depth + 1) | 0;
  }

  static finish() {
    if (BatchProcessor.depth > 1) {
      BatchProcessor.depth--;

      return;
    }

    let error: unknown;
    let hasError = false;

    while (BatchProcessor.pendingEffect !== undefined) {
      let effect: EffectExecutor | undefined = BatchProcessor.pendingEffect;

      BatchProcessor.pendingEffect = undefined;
      BatchProcessor.iteration++;

      while (effect !== undefined) {
        const nextEffect: EffectExecutor | undefined = effect.nextPendingEffect;

        effect.nextPendingEffect = undefined;
        effect.flags &= ~States.Notified;

        if (
          !(effect.flags & States.Disposed) &&
          BatchProcessor.shouldRecompute(effect)
        ) {
          try {
            effect.execute();
          } catch (err) {
            if (!hasError) {
              error = err;
              hasError = true;
            }
          }
        }

        effect = nextEffect;
      }
    }

    BatchProcessor.iteration = 0;
    BatchProcessor.depth--;

    if (hasError) {
      throw error;
    }
  }

  static batch<T>(callback: () => T): T {
    if (BatchProcessor.depth > 0) {
      return callback();
    }

    BatchProcessor.start();

    try {
      return callback();
    } finally {
      BatchProcessor.finish();
    }
  }

  static shouldRecompute(target: Computed | EffectExecutor): boolean {
    let currentNode = target.sources;

    while (currentNode !== undefined) {
      if (
        currentNode.source.version !== currentNode.version ||
        !currentNode.source.refresh() ||
        currentNode.source.version !== currentNode.version
      ) {
        return true;
      }

      currentNode = currentNode.nextSource;
    }

    return false;
  }
}

type EffectCallback = () => void | (() => void);

class EffectExecutor {
  callback?: EffectCallback;

  cleanupCallback?: () => void = undefined;

  sources?: DependencyNode = undefined;

  nextPendingEffect?: EffectExecutor = undefined;

  flags = States.Tracking;

  constructor(callback: EffectCallback) {
    this.callback = callback;
  }

  execute() {
    const finishExecution = this.startExecution();

    try {
      if (this.flags & States.Disposed) {
        return;
      }

      if (this.callback === undefined) {
        return;
      }

      const cleanup = this.callback();

      if (typeof cleanup === 'function') {
        this.cleanupCallback = cleanup;
      }
    } finally {
      finishExecution();
    }
  }

  cleanup() {
    const cleanup = this.cleanupCallback;

    this.cleanupCallback = undefined;

    if (typeof cleanup === 'function') {
      BatchProcessor.start();

      const previousContext = ExecutionContext.currentContext;

      ExecutionContext.currentContext = undefined;

      try {
        cleanup();
      } catch (err) {
        this.flags &= ~States.Running;
        this.flags |= States.Disposed;
        this.dispose();
        throw err;
      } finally {
        ExecutionContext.currentContext = previousContext;
        BatchProcessor.finish();
      }
    }
  }

  dispose() {
    let currentNode = this.sources;

    while (currentNode !== undefined) {
      currentNode.source.unsubscribe(currentNode);
      currentNode = currentNode.nextSource;
    }

    this.callback = undefined;
    this.sources = undefined;
    this.cleanup();
  }

  private startExecution() {
    if (this.flags & States.Running) {
      throw new Error('Cycle detected');
    }

    this.flags |= States.Running;
    this.flags &= ~States.Disposed;

    if (this.sources) {
      this.cleanup();
    }

    ExecutionContext.setupDependencies(this);
    BatchProcessor.start();

    const previousContext = ExecutionContext.currentContext;

    ExecutionContext.currentContext = this;

    return this.finishExecution.bind(this, previousContext);
  }

  private finishExecution(previousContext?: Computed | EffectExecutor) {
    if (ExecutionContext.currentContext !== this) {
      throw new Error('Out-of-order effect');
    }

    ExecutionContext.clearDependencies(this);
    ExecutionContext.currentContext = previousContext;
    this.flags &= ~States.Running;

    if (this.flags & States.Disposed) {
      this.dispose();
    }

    BatchProcessor.finish();
  }

  notify() {
    if ((this.flags & States.Notified) === 0) {
      this.flags |= States.Notified;
      this.nextPendingEffect = BatchProcessor.pendingEffect;
      BatchProcessor.pendingEffect = this;
    }
  }

  markDisposed() {
    this.flags |= States.Disposed;

    if (!(this.flags & States.Running)) {
      this.dispose();
    }
  }
}

function effect(callback: EffectCallback): () => void {
  const effect = new EffectExecutor(callback);

  try {
    effect.execute();
  } catch (err) {
    effect.markDisposed();
    throw err;
  }

  return effect.markDisposed.bind(effect);
}

class Reactive<T = unknown> {
  internalValue: T;

  public readonly type = '$$reactive';

  public version = 0;

  public dependencyNode?: DependencyNode = undefined;

  public targets?: DependencyNode = undefined;

  constructor(initialValue: T) {
    this.internalValue = initialValue;
  }

  refresh(): boolean {
    return true;
  }

  subscribeToNode(node: DependencyNode) {
    if (this.targets !== node && node.previousTarget === undefined) {
      node.nextTarget = this.targets;

      if (this.targets !== undefined) {
        this.targets.previousTarget = node;
      }

      this.targets = node;
    }
  }

  unsubscribe(node: DependencyNode) {
    if (this.targets !== undefined) {
      const prev = node.previousTarget;
      const next = node.nextTarget;

      if (prev !== undefined) {
        prev.nextTarget = next;
        node.previousTarget = undefined;
      }

      if (next !== undefined) {
        next.previousTarget = prev;
        node.nextTarget = undefined;
      }

      if (node === this.targets) {
        this.targets = next;
      }
    }
  }

  subscribe(callback: (value: T) => void): () => void {
    return effect(() => {
      const value = this.value;

      const previousContext = ExecutionContext.currentContext;

      ExecutionContext.currentContext = undefined;

      try {
        callback(value);
      } finally {
        ExecutionContext.currentContext = previousContext;
      }
    });
  }

  peek(): T {
    const previousContext = ExecutionContext.currentContext;

    ExecutionContext.currentContext = undefined;

    try {
      return this.value;
    } finally {
      ExecutionContext.currentContext = previousContext;
    }
  }

  get value(): T {
    const node = ExecutionContext.trackDependency(this);

    if (node && node.version !== this.version) {
      node.version = this.version;
    }

    return this.internalValue;
  }

  set value(newValue: T | ((current: T) => T)) {
    if (newValue !== this.internalValue) {
      if (BatchProcessor.iteration > BatchProcessor.maxUpdates) {
        throw new Error('Cycle detected');
      }

      const resolvedValue =
        typeof newValue === 'function'
          ? (newValue as (current: T) => T)(this.internalValue)
          : newValue;

      this.internalValue = resolvedValue;
      this.version = (this.version + 1) | 0;
      BatchProcessor.globalVersion = (BatchProcessor.globalVersion + 1) | 0;
      BatchProcessor.start();

      try {
        let currentNode = this.targets;

        while (currentNode !== undefined) {
          currentNode.target.notify();
          currentNode = currentNode.nextTarget;
        }
      } finally {
        BatchProcessor.finish();
      }
    }
  }

  public valueOf(): T {
    return this.value;
  }

  toJSON(): T {
    return this.value;
  }

  toString() {
    return String(this.value);
  }
}

class Computed<T = unknown> extends Reactive<T> {
  private readonly computeFunction: () => T;

  // @ts-ignore
  public readonly type = '$$computed';

  public sources?: DependencyNode = undefined;

  public flags = States.Outdated;

  private lastGlobalVersion = BatchProcessor.globalVersion - 1;

  private readonly equalCb: EqualCb = (a, b) => a === b;

  constructor(computeFunction: () => T, equalCb?: EqualCb) {
    super(undefined as unknown as T);
    this.computeFunction = computeFunction;

    if (equalCb) {
      this.equalCb = equalCb;
    }
  }

  get value(): T {
    if (this.flags & States.Running) {
      throw new Error('Cycle detected');
    }

    const node = ExecutionContext.trackDependency(this);

    this.refresh();

    if (node !== undefined) {
      node.version = this.version;
    }

    if (this.flags & States.HasError) {
      throw this.internalValue;
    }

    return this.internalValue;
  }

  refresh() {
    this.flags &= ~States.Notified;

    if (this.flags & States.Running) {
      return false;
    }

    if (
      (this.flags & (States.Outdated | States.Tracking)) ===
      States.Tracking
    ) {
      return true;
    }

    this.flags &= ~States.Outdated;

    if (this.lastGlobalVersion === BatchProcessor.globalVersion) {
      return true;
    }

    this.lastGlobalVersion = BatchProcessor.globalVersion;
    this.flags |= States.Running;

    if (this.version > 0 && !BatchProcessor.shouldRecompute(this)) {
      this.flags &= ~States.Running;

      return true;
    }

    const previousContext = ExecutionContext.currentContext;

    try {
      ExecutionContext.setupDependencies(this);
      ExecutionContext.currentContext = this;

      const newValue = this.computeFunction();

      if (
        this.flags & States.HasError ||
        !this.equalCb(this.internalValue, newValue) ||
        this.version === 0
      ) {
        this.internalValue = newValue;
        this.flags &= ~States.HasError;
        this.version++;
      }
    } catch (error) {
      this.internalValue = error as T;
      this.flags |= States.HasError;
      this.version++;
    }

    ExecutionContext.currentContext = previousContext;
    ExecutionContext.clearDependencies(this);
    this.flags &= ~States.Running;

    return true;
  }

  subscribeToNode(node: DependencyNode) {
    if (this.targets === undefined) {
      this.flags |= States.Outdated | States.Tracking;

      let currentNode = this.sources;

      while (currentNode !== undefined) {
        currentNode.source.subscribeToNode(currentNode);
        currentNode = currentNode.nextSource;
      }
    }

    super.subscribeToNode(node);
  }

  unsubscribe(node: DependencyNode) {
    super.unsubscribe(node);

    if (this.targets === undefined) {
      this.flags &= ~States.Tracking;

      let currentNode = this.sources;

      while (currentNode !== undefined) {
        currentNode.source.unsubscribe(currentNode);
        currentNode = currentNode.nextSource;
      }
    }
  }

  notify() {
    if ((this.flags & States.Notified) === 0) {
      this.flags |= FLAGS_NOTIFY;

      let currentNode = this.targets;

      while (currentNode !== undefined) {
        currentNode.target.notify();
        currentNode = currentNode.nextTarget;
      }
    }
  }
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

  createReactive() {
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

        if (!Number.isNaN(index)) {
          value = self.makeReactive(value as T);
        }

        const result = Reflect.set(target, prop, value, receiver);

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
    }) as Reactive<{ inner: T }>;
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
    let value = target[prop] as T;

    value = this.makeReactive(value);

    Object.defineProperty(target, prop, {
      get: () => value,
      set: (newValue) => {
        if (newValue !== value) {
          value = this.makeReactive(newValue);
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

  public valueOf() {
    return this.reactive.valueOf().inner;
  }

  public toJSON() {
    return this.reactive.toJSON().inner;
  }

  public peek() {
    return this.reactive.peek().inner;
  }

  public subscribe(callback: (value: T) => void) {
    return this.reactive.subscribe(({ inner }) => callback(inner));
  }
}

function reactive<T>(value: T): Reactive<T> {
  return new Reactive(value);
}

function computed<T>(computeFunction: () => T, equalCb?: EqualCb): Computed<T> {
  return new Computed(computeFunction, equalCb);
}

function batch<T>(callback: () => T): T {
  return BatchProcessor.batch(callback);
}

function deepReactive<T>(value: T): DeepReactive<T> {
  return new DeepReactive(value);
}
export { reactive, computed, batch, deepReactive, effect };
