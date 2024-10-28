import type { BatchManager } from '../batch-manager';
import type { ReactiveContext } from '../reactive-context';

export const createEffect = (
  fn: () => void,
  context: ReactiveContext,
  batchManager: BatchManager,
) => {
  const update = () => {
    Promise.resolve().then(() => {
      batchManager.addTask(() => {
        context.track(fn);
      });
    });
  };

  update();
};
