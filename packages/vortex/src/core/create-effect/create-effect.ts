import type { BatchManager } from '../batch-manager';
import type { ReactiveContext } from '../reactive-context';

export const createEffect = (
  fn: () => (() => void) | void,
  context: ReactiveContext,
  batchManager: BatchManager,
) => {
  let cleanup: (() => void) | undefined;
  let isActive = true;

  const runEffect = () => {
    if (!isActive) {
      return;
    }

    if (cleanup) {
      cleanup();
    }

    context.track(() => {
      if (!isActive) {
        return;
      }

      cleanup = fn() as (() => void) | undefined;
    });
  };

  Promise.resolve().then(() => {
    batchManager.addTask(runEffect);
  });

  return () => {
    if (cleanup) {
      cleanup();
    }

    isActive = false;
  };
};
