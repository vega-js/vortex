import type { PersistStorage } from '../types';

export class LocalStorageAdapter implements PersistStorage {
  private readonly storage?: Storage;

  constructor() {
    this.storage =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : undefined;
  }

  private assertStorageAvailable(): void {
    if (!this.storage) {
      throw new Error('localStorage is not supported');
    }
  }

  private safeStringify(value: unknown): string {
    if (value === undefined) {
      return 'undefined';
    }

    return JSON.stringify(value);
  }

  private safeParse<T>(item: string | null): T | null {
    if (item === 'undefined') {
      return undefined as T;
    }

    if (item === null) {
      return null;
    }

    try {
      return JSON.parse(item) as T;
    } catch {
      throw new Error('setItem: safeParse');
    }
  }

  public getItem<T = unknown>(key: string): T | null {
    this.assertStorageAvailable();

    try {
      return this.safeParse(this.storage!.getItem(key));
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  public setItem<T = unknown>(key: string, value: T) {
    this.assertStorageAvailable();

    const serializedValue = this.safeStringify(value);

    try {
      this.storage!.setItem(key, serializedValue);
    } catch {
      throw new Error('setItem: error');
    }
  }

  public removeItem(key: string) {
    this.assertStorageAvailable();
    this.storage!.removeItem(key);
  }
}
