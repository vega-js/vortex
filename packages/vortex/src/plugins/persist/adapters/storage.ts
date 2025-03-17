import { type PersistStorage } from '../types';

export class StorageAdapter implements PersistStorage {
  private adapter: PersistStorage;

  constructor(adapter: PersistStorage) {
    this.adapter = adapter;
  }

  public getItem<T = unknown>(key: string) {
    return this.adapter.getItem<T>(key);
  }

  public setItem<T = unknown>(key: string, value: T) {
    return this.adapter.setItem<T>(key, value);
  }

  public removeItem(key: string) {
    return this.adapter.removeItem(key);
  }
}
