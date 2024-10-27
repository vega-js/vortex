export class DIContainer<TDependencies = Record<string, unknown>> {
  private readonly dependencies: Partial<TDependencies> = {};

  public register<K extends keyof TDependencies>(
    key: K,
    dependency: TDependencies[K],
  ) {
    this.dependencies[key] = dependency;
  }

  public get<K extends keyof TDependencies>(key: K): TDependencies[K] {
    const dependency = this.dependencies[key];

    if (!dependency) {
      throw new Error(`Dependency ${String(key)} not found`);
    }

    return dependency;
  }
}
