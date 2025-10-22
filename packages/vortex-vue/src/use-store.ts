import type { DefineStore, UnwrappedState } from '@vegajs/vortex';
import {
  effectScope,
  getCurrentScope,
  isRef,
  markRaw,
  onScopeDispose,
  onUnmounted,
  reactive,
  unref,
} from 'vue';
import { shallowEqual } from './utils';

const isServer = typeof window === 'undefined';

/**
 * Vue composable for integrating vortex store
 * @param instance - Store instance or factory function
 * @returns Reactive store state
 */
export const useStore = <T extends Record<string, unknown>>(
  instance: (() => DefineStore<T>) | DefineStore<T>,
): UnwrappedState<T> => {
  const scope = effectScope(true);

  const store = scope.run(() => {
    const storeInstance =
      typeof instance === 'function' ? instance() : instance;

    return markRaw(storeInstance);
  });

  if (!store) {
    throw new Error('[useStore] failed to create store');
  }

  const initialState = isServer
    ? store.getSnapshot()
    : unref(store.getSnapshot());

  const state = reactive(initialState) as UnwrappedState<T>;

  if (!isServer) {
    let isMounted = true;

    const unsubscribe = store.subscribe((newState, oldState) => {
      if (!isMounted) return;

      if (!shallowEqual(newState, oldState)) {
        const resolvedNewState = Object.keys(newState).reduce(
          (acc, key) => {
            acc[key] = isRef(newState[key])
              ? unref(newState[key])
              : newState[key];
            return acc;
          },
          {} as Record<string, unknown>,
        );

        Object.assign(state, resolvedNewState);
      }
    });

    const cleanup = () => {
      isMounted = false;
      unsubscribe();
      scope.stop();
    };

    if (getCurrentScope()) {
      onScopeDispose(cleanup);
    } else {
      onUnmounted(cleanup);
    }
  }

  return state;
};
