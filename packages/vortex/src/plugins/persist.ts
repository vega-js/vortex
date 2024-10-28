import type { DefineStore, NonFunctionKeys, UnwrappedState } from '../types';
import { isQuery, isReactive, toObjectKeys } from '../utils';

type PersistOptions<T> = {
  key: string;
  properties?: Array<NonFunctionKeys<T>>;
};

export const persistPlugin =
  <T extends Record<string, unknown>>(options: PersistOptions<T>) =>
  (store: DefineStore<T>) => {
    const state = store.getSnapshot();

    const fields: Array<keyof T> = [];

    const reactiveUnits = toObjectKeys(state).filter(
      (key) => !['function', 'undefined'].includes(typeof state[key]),
    );

    const { key, properties } = options;

    if (properties) {
      const uniqueProperties = new Set(properties);
      const intersectionFields = reactiveUnits.filter((item) =>
        uniqueProperties.has(item as NonFunctionKeys<T>),
      );

      fields.push(...intersectionFields);
    } else {
      fields.push(...reactiveUnits);
    }

    const toNewState = (s: UnwrappedState<T>) => {
      return fields.reduce(
        (acc, fieldKey) => {
          if (s[fieldKey] !== undefined && s[fieldKey] !== null) {
            if (isQuery(store.state[fieldKey])) {
              acc[fieldKey] = store.state[fieldKey].get()
                .data as UnwrappedState<T>[typeof fieldKey];
            } else {
              acc[fieldKey] = s[fieldKey];
            }
          }

          return acc;
        },
        {} as Partial<UnwrappedState<T>>,
      );
    };

    const savedState = localStorage.getItem(key);

    try {
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState) as UnwrappedState<T>;

          store.action((s) => {
            toObjectKeys(parsedState).forEach((el) => {
              if (isReactive(s[el])) {
                s[el].set(() => parsedState[el]);
              }

              if (isQuery(s[el])) {
                s[el].set((prev) => ({ ...prev, data: parsedState[el] }));
              }
            });
          });
        } catch (error) {
          console.error('Error parsing saved state:', error);
          localStorage.removeItem(key);
        }
      } else {
        localStorage.setItem(key, JSON.stringify(toNewState(state)));
      }
    } finally {
    }

    return store.subscribe((newState) => {
      localStorage.setItem(key, JSON.stringify(toNewState(newState)));
    });
  };
