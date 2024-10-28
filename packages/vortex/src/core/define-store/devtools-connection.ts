type DevToolsGlobal = {
  initializedStores: string[];
  events: ActionPayload<unknown>[];
  initialized: boolean;
  enable: boolean;
};

type ActionPayload<T> = {
  action: string;
  newData: T;
  oldData?: T;
  storeName: string;
  timestamp: string;
};

declare global {
  interface Window {
    __VORTEX_DEVTOOLS__: DevToolsGlobal;
  }
}

export const initDevtoolsStore = <T>(storeName: string, newData: T) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window.__VORTEX_DEVTOOLS__?.enable) {
    return;
  }

  const payload = {
    action: 'init',
    storeName,
    newData,
  } as ActionPayload<T>;

  if (!window.__VORTEX_DEVTOOLS__.initialized) {
    window.__VORTEX_DEVTOOLS__.initializedStores.push(storeName);

    window.__VORTEX_DEVTOOLS__.events.push({
      ...payload,
      timestamp: new Date().toISOString(),
    });
  } else {
    window.postMessage(
      { type: 'VORTEX_DEVTOOLS_INIT', payload: JSON.stringify(payload) },
      '*',
    );
  }
};

export const observeStore = <T>(newData: T, oldData: T, storeName: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window.__VORTEX_DEVTOOLS__?.enable) {
    return;
  }

  const payload = {
    action: 'update',
    storeName,
    newData,
    oldData,
    timestamp: new Date().toISOString(),
  };

  if (!window.__VORTEX_DEVTOOLS__.initialized) {
    window.__VORTEX_DEVTOOLS__.events.push(payload);
  } else {
    window.postMessage(
      { type: 'VORTEX_DEVTOOLS', payload: JSON.stringify(payload) },
      '*',
    );
  }
};
