import type { Computed } from '../../types';
import type { ReactiveContext } from '../../utils';
import { isEqual } from '../../utils';
import { createReactive } from '../create-reactive';

export const createComputed = <T>(
  fn: () => T,
  context: ReactiveContext,
): Computed<T> => {
  let cachedValue = fn();
  const result = createReactive(cachedValue, context);

  const update = () => {
    const newValue = fn();

    if (!isEqual(cachedValue, newValue)) {
      cachedValue = newValue;
      result.set(newValue);
    }
  };

  context.track(update);

  return {
    type: 'computed',
    get: result.get.bind(result),
    subscribe: result.subscribe.bind(result),
  };
};
