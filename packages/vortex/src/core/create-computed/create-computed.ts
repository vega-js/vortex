import type { Computed } from '../../types';
import { ReactiveContext, shallowEqual } from '../../utils';
import { createReactive } from '../create-reactive';

export const createComputed = <T>(
  fn: () => T,
  context: ReactiveContext,
): Computed<T> => {
  let cachedValue = fn();
  const result = createReactive(cachedValue, context);

  const update = () => {
    const newValue = fn();

    if (!shallowEqual(cachedValue, newValue)) {
      cachedValue = newValue;
      result.set(newValue);
    }
  };

  context.track(update);

  return {
    type: 'computed',
    get: result.get,
    subscribe: result.subscribe,
  };
};
