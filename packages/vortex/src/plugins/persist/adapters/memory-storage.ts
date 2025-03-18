import type { PersistStorage } from '../types';

export class MemoryStorage implements PersistStorage {
  private store = new Map<string, unknown>();

  public async getItem<T = unknown>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null;
  }

  public async setItem<T = unknown>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}
