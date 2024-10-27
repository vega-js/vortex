import type { ReactiveContext } from '../../utils';
import type { BatchManager } from '../batch-manager';

export const createEffect = (
  fn: () => void,
  context: ReactiveContext,
  batchManager: BatchManager,
) => {
  const update = () => {
    batchManager.addTask(() => {
      context.track(fn);
    });
  };

  update();
};
