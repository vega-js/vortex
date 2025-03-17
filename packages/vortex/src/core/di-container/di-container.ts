export class DIContainer<TDependencies = Record<string, unknown>> {
  readonly #dependencies: Map<
    keyof TDependencies,
    TDependencies[keyof TDependencies]
  > = new Map();

  constructor(
    defaultDeps?: Record<
      keyof TDependencies,
      TDependencies[keyof TDependencies]
    >,
  ) {
    if (defaultDeps) {
      this.registerMany(defaultDeps);
    }
  }

  public register<K extends keyof TDependencies>(
    key: K,
    dependency: TDependencies[K],
  ) {
    this.#dependencies.set(key, dependency);
  }

  public registerMany<K extends keyof TDependencies>(
    deps: Record<K, TDependencies[K]>,
  ) {
    (Object.keys(deps) as K[]).forEach((dep) => {
      this.#dependencies.set(dep, deps[dep]);
    });
  }

  public get<K extends keyof TDependencies>(key: K): TDependencies[K] {
    const dependency = this.#dependencies.get(key) as TDependencies[K];

    if (!dependency) {
      throw new Error(`Dependency ${String(key)} not found`);
    }

    return dependency;
  }

  public destroy() {
    this.#dependencies.clear();
  }

  public clear<K extends keyof TDependencies>(key: K) {
    this.#dependencies.delete(key);
  }
}
