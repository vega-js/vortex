type MaybePromiseLike<T> = T | Promise<T>;

export type PersistStorage = {
  getItem<T>(key: string): MaybePromiseLike<T | null>;
  setItem<T>(key: string, value: T): MaybePromiseLike<void>;
  removeItem(key: string): void | MaybePromiseLike<void>;
};
