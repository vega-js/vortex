import type { Reactive } from '../../types';
import type { ReactiveContext } from '../reactive-context';

export const createReactive = <Value>(
  initialValue: Value,
  context: ReactiveContext,
): Reactive<Value> => {
  const callbacks: ((value: Value) => void)[] = [];
  let currentValue = initialValue;

  const notifySubscribers = () => {
    callbacks.forEach((callback) => callback(currentValue));
  };

  return {
    type: 'reactive',

    get() {
      const activeReactive = context.getActive();

      if (activeReactive) {
        callbacks.push(activeReactive);
      }

      return currentValue;
    },

    set(value) {
      const newValue =
        typeof value === 'function'
          ? (value as (prev: Value) => Value)(currentValue)
          : value;

      if (newValue !== currentValue) {
        currentValue = newValue;
        notifySubscribers();
      }
    },

    subscribe(callback) {
      callbacks.push(callback);

      return () => {
        const index = callbacks.indexOf(callback);

        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      };
    },

    reset() {
      currentValue = initialValue;
      notifySubscribers();
    },
  };
};
