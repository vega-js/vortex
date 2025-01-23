import type { DefineStore, NonFunctionKeys, UnwrappedState } from '../../types';
import { isQuery, isReactive, toObjectKeys } from '../../utils';
import { LocalStorageAdapter } from './adapters';
import type { PersistStorage } from './types';

export interface PersistOptions<T> {
  key: string;
  properties?: Array<NonFunctionKeys<T>>;
  storage?: PersistStorage;
}

const createMapStorage = () => {
  const storage = new Map<string, string>();

  return {
    getItem: <T = unknown>(key: string): T | null => {
      try {
        const item = storage.get(key);

        return item !== undefined ? (JSON.parse(item) as T) : null;
      } catch {
        throw new Error('getItem');
      }
    },
    setItem: <T = unknown>(key: string, value: T) => {
      try {
        const serializedValue =
          value === undefined ? 'undefined' : JSON.stringify(value);

        storage.set(key, serializedValue);
      } catch {
        throw new Error('setItem');
      }
    },
    removeItem: (key: string) => storage.delete(key),
  };
};

const getDefaultStorage = () =>
  typeof window === 'undefined'
    ? createMapStorage()
    : new LocalStorageAdapter();

export const persistPlugin =
  <T extends Record<string, unknown>>(options: PersistOptions<T>) =>
  (store: DefineStore<T>) => {
    const { key, properties, storage = getDefaultStorage() } = options;
    const state = store.getSnapshot();
    const fields: Array<keyof T> = properties
      ? Array.from(new Set(properties))
      : toObjectKeys(state).filter(
          (field_key) =>
            !['function', 'undefined'].includes(typeof state[field_key]),
        );

    const toNewState = (s: UnwrappedState<T>) =>
      fields.reduce(
        (acc, fieldKey) => {
          const fieldValue = s[fieldKey];

          if (fieldValue !== undefined) {
            acc[fieldKey] = isQuery(store.state[fieldKey])
              ? (store.state[fieldKey].value
                  .data as UnwrappedState<T>[typeof fieldKey])
              : fieldValue;
          }

          return acc;
        },
        {} as Partial<UnwrappedState<T>>,
      );

    try {
      const parsedState = storage.getItem<UnwrappedState<T>>(key);

      if (parsedState) {
        store.action((s) => {
          toObjectKeys(parsedState).forEach((el) => {
            const parsedValue = parsedState[el];

            if (isReactive(s[el])) {
              s[el].value = () => parsedValue;
            }

            if (isQuery(s[el])) {
              s[el].value = (prev) => ({ ...prev, data: parsedValue });
            }
          });
        });
      } else {
        storage.setItem(key, toNewState(state));
      }
    } catch {
      storage.removeItem(key);
    }

    let isSaving = false;

    return store.subscribe((newState) => {
      if (!isSaving) {
        isSaving = true;

        Promise.resolve().then(() => {
          storage.setItem(key, toNewState(newState));
          isSaving = false;
        });
      }
    });
  };
