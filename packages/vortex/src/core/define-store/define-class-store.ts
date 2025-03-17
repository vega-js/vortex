import type { DefineStore, StoreOptions } from '../../types';
import { defineStore } from './define-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClass = new (...args: any[]) => any;

// eslint-disable-next-line max-lines-per-function
export function defineClassStore<T extends AnyClass>(
  StoreClass: T,
  options: StoreOptions<InstanceType<T>> = {},
): new (
  ...args: ConstructorParameters<T>
) => DefineStore<InstanceType<T>> & InstanceType<T> {
  let store: DefineStore<InstanceType<T>>;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return class StoreWrapper extends StoreClass {
    constructor(...args: ConstructorParameters<T>) {
      super(...args);

      store = defineStore(
        ({ reactive, computed }) => {
          const state: Record<string, unknown> = {};

          const prototype = Object.getPrototypeOf(this);
          const instanceProperties = Object.getOwnPropertyNames(this);
          const prototypeProperties = Object.getOwnPropertyNames(
            prototype,
          ).filter((prop) => prop !== 'constructor');

          instanceProperties.forEach((key) => {
            const descriptor = Object.getOwnPropertyDescriptor(this, key);

            if (descriptor && 'value' in descriptor) {
              state[key] = reactive(this[key as keyof typeof this]);

              Object.defineProperty(this, key, {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                get: () => state[key].value,
                set: (value) => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  state[key].value = value;
                },
                enumerable: true,
                configurable: true,
              });
            }
          });

          prototypeProperties.forEach((key) => {
            const descriptor = Object.getOwnPropertyDescriptor(prototype, key);

            if (descriptor) {
              if (descriptor.get) {
                state[key] = computed(() => descriptor.get!.call(this));
              } else if (typeof descriptor.value === 'function') {
                this[key] = descriptor.value.bind(this);
              }
            }
          });

          return state as InstanceType<T>;
        },
        {
          ...options,
          name: StoreClass.name,
        },
      );

      Object.defineProperties(this, {
        getSnapshot: {
          value: store.getSnapshot.bind(store),
          enumerable: false,
        },
        subscribe: {
          value: store.subscribe.bind(store),
          enumerable: false,
        },
        cleanupAll: {
          value: store.cleanupAll.bind(store),
          enumerable: false,
        },
      });
    }
  };
}
