import type { Reactive } from '../../types';
import type { ReactiveContext } from '../reactive-context';

export const createReactive = <Value>(
  initialValue: Value,
  context: ReactiveContext,
): Reactive<Value> => {
  const callbacks = new Set<(value: Value) => void>();
  let currentValue = initialValue;

  const notifySubscribers = () => {
    callbacks.forEach((callback) => {
      callback(currentValue);
    });
  };

  return {
    type: 'reactive',

    get() {
      const activeReactive = context.getActive();

      if (activeReactive && !callbacks.has(activeReactive)) {
        callbacks.add(activeReactive);
      }

      return currentValue;
    },

    set(value) {
      const newValue =
        typeof value === 'function'
          ? (value as (prevValue: Value) => Value)(currentValue)
          : value;

      if (newValue !== currentValue) {
        currentValue = newValue;
        notifySubscribers();
      }
    },

    subscribe(callback) {
      if (!callbacks.has(callback)) {
        callbacks.add(callback);
      }

      return () => {
        callbacks.delete(callback);
      };
    },

    reset() {
      if (currentValue !== initialValue) {
        currentValue = initialValue;
        notifySubscribers();
      }
    },
  };
};
