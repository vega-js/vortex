import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { DefineStore, UnwrappedState } from '../types';
import { shallowEqual } from '../utils';

export const useStore = <T extends Record<string, unknown>>(
  store: DefineStore<T>,
): UnwrappedState<T> => {
  const usedDependencies = useRef<Set<keyof UnwrappedState<T>>>(new Set());
  const snapshotProxyRef = useRef<UnwrappedState<T> | null>(null);

  // create proxy one time
  if (!snapshotProxyRef.current) {
    const proxyHandler: ProxyHandler<UnwrappedState<T>> = {
      get(target, key) {
        usedDependencies.current.add(key as keyof UnwrappedState<T>);

        return target[key as keyof UnwrappedState<T>];
      },
    };

    const createProxySnapshot = () => {
      const snapshot = store.getSnapshot();

      return new Proxy(snapshot, proxyHandler);
    };

    snapshotProxyRef.current = createProxySnapshot();
  }

  const cachedSnapshot = useRef(snapshotProxyRef.current);

  useEffect(() => {
    return () => {
      usedDependencies.current.clear();
    };
  }, []);

  return useSyncExternalStore(
    (onStoreChange) => {
      return store.subscribe((newState, oldState) => {
        const newSelectedState = {} as UnwrappedState<T>;
        const oldSelectedState = {} as UnwrappedState<T>;

        usedDependencies.current.forEach((dep) => {
          newSelectedState[dep] = newState[dep];
          oldSelectedState[dep] = oldState[dep];
        });

        if (!shallowEqual(newSelectedState, oldSelectedState)) {
          cachedSnapshot.current = newSelectedState;
          onStoreChange();
        }
      });
    },
    () => cachedSnapshot.current,
    () => cachedSnapshot.current,
  );
};
