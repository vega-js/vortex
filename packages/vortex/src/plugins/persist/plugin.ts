import { PERSIST_NAME } from '../../constants';
import type {
  DefineStore,
  NonFunctionKeys,
  UnknownState,
  UnwrappedState,
} from '../../types';
import { isQuery, isReactive, toObjectKeys } from '../../utils';
import { MemoryStorage, StorageAdapter } from './adapters';
import type { PersistStorage } from './types';

export interface PersistOptions<T> {
  key: string;
  version?: number;
  migrations?: Record<number, (state: UnwrappedState<T>) => UnwrappedState<T>>;
  properties?: NonFunctionKeys<T>[];
  storage?: PersistStorage;
  onBeforeHydration?: () => void;
  onHydrated?: (state: UnwrappedState<T>) => void;
  onHydrationError?: (error: unknown) => void;
}

interface PersistedData<T> {
  version: number;
  data: Partial<UnwrappedState<T>>;
}

export interface PersistPlugin<T extends UnknownState> {
  remove: () => void;
  apply: (store: DefineStore<T>) => () => void;
}

type GlobalPersistSetting = {
  isReady: boolean;
  globalStorage?: PersistStorage | null;
};

const persistPluginGlobalSetting: GlobalPersistSetting = {
  isReady: false,
  globalStorage: null,
};

export const configurePersistPlugin = ({
  globalStorage = new MemoryStorage(),
}: Omit<GlobalPersistSetting, 'isReady'>) => {
  if (persistPluginGlobalSetting.isReady) {
    throw new Error('Persist plugin is already configured');
  }

  persistPluginGlobalSetting.globalStorage = globalStorage;
  persistPluginGlobalSetting.isReady = true;
};

export const persistPlugin = <T extends UnknownState>(
  options: PersistOptions<T>,
): PersistPlugin<T> => {
  const {
    key,
    properties,
    onBeforeHydration,
    onHydrated,
    onHydrationError,
    migrations,
    version = 0,
    storage = new StorageAdapter(persistPluginGlobalSetting.globalStorage!),
  } = options;

  const remove = () => storage.removeItem(key);

  const apply = (store: DefineStore<T>) => {
    const state = store.getSnapshot();
    const fields: (keyof T)[] = properties
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

    (async () => {
      try {
        onBeforeHydration?.();

        const persisted = await storage.getItem<PersistedData<T>>(key);

        let stateToHydrate: Partial<UnwrappedState<T>> | undefined = undefined;

        if (persisted) {
          const persistedVersion = persisted.version;

          stateToHydrate = persisted.data;

          if (migrations && persistedVersion < version) {
            for (let v = persistedVersion; v < version; v++) {
              const migrate = migrations[v];

              if (migrate) {
                stateToHydrate = migrate(stateToHydrate as UnwrappedState<T>);
              }
            }

            storage.setItem(key, {
              version,
              data: stateToHydrate,
            });
          }

          store.action((s) => {
            toObjectKeys(stateToHydrate!).forEach((el) => {
              const parsedValue = stateToHydrate![el];

              if (isReactive(s[el])) {
                s[el].value = parsedValue;
              }

              const query = s[el];

              if (isQuery(query)) {
                query.update(parsedValue);
              }
            });
          });

          onHydrated?.(stateToHydrate as UnwrappedState<T>);
        } else {
          storage.setItem(key, { version, data: toNewState(state) });
        }
      } catch (error) {
        onHydrationError?.(error);
        storage.removeItem(key);
      }
    })();

    let isSaving = false;

    return store.subscribe((newState) => {
      if (!isSaving) {
        isSaving = true;

        Promise.resolve().then(() => {
          storage.setItem(key, { version, data: toNewState(newState) });
          isSaving = false;
        });
      }
    });
  };

  apply.pluginName = PERSIST_NAME;

  return { remove, apply };
};
