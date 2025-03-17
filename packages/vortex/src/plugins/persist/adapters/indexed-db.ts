import type { PersistStorage } from '../types';

export class IndexedDBAdapter implements PersistStorage {
  private readonly dbName: string;

  private readonly storeName: string;

  private db: IDBDatabase | null = null;

  constructor(dbName = 'PersistDB', storeName = 'PersistStore') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(this.dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName);
      }
    };

    request.onsuccess = () => {
      this.db = request.result;
    };

    request.onerror = () => {
      throw new Error('IndexedDB: Failed to initialize');
    };
  }

  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
      } else {
        const request = indexedDB.open(this.dbName);

        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };

        request.onerror = () => {
          reject(new Error('IndexedDB: Failed to open database'));
        };
      }
    });
  }

  public async getItem<T = unknown>(key: string): Promise<T | null> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ?? null);
      };

      request.onerror = () => {
        reject(new Error('IndexedDB: getItem failed'));
      };
    });
  }

  public async setItem<T = unknown>(key: string, value: T): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('IndexedDB: setItem failed'));
    });
  }

  public async removeItem(key: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('IndexedDB: removeItem failed'));
    });
  }
}
