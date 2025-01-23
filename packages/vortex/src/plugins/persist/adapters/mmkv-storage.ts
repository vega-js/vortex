import { MMKV } from 'react-native-mmkv';
import type { PersistStorage } from '../types';

export class MmkvStorageAdapter implements PersistStorage {
  private readonly storage = new MMKV();

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
      return this.safeParse(this.storage!.getString(key) || null);
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  public setItem<T = unknown>(key: string, value: T) {
    this.assertStorageAvailable();

    const serializedValue = this.safeStringify(value);

    try {
      this.storage!.set(key, serializedValue);
    } catch {
      throw new Error('setItem: error');
    }
  }

  public removeItem(key: string) {
    this.assertStorageAvailable();
    this.storage!.delete(key);
  }
}
