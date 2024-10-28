import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchManager } from './batch-manager';

describe('BatchManager', () => {
  let batchManager: BatchManager;

  beforeEach(() => {
    batchManager = new BatchManager();
  });

  it('should add a task and trigger it asynchronously', () => {
    const mockTask = vi.fn();

    batchManager.addTask(mockTask);
    expect(mockTask).not.toHaveBeenCalled();

    setImmediate(() => {
      expect(mockTask).toHaveBeenCalledTimes(1);
    });
  });

  it('should batch multiple tasks and trigger them together', () => {
    const mockTask1 = vi.fn();
    const mockTask2 = vi.fn();

    // Добавляем несколько задач
    batchManager.addTask(mockTask1);
    batchManager.addTask(mockTask2);
    expect(mockTask1).not.toHaveBeenCalled();
    expect(mockTask2).not.toHaveBeenCalled();

    setImmediate(() => {
      expect(mockTask1).toHaveBeenCalledTimes(1);
      expect(mockTask2).toHaveBeenCalledTimes(1);
    });
  });

  it('should clear tasks after they are triggered', () => {
    const mockTask = vi.fn();

    batchManager.addTask(mockTask);

    setImmediate(() => {
      expect(mockTask).toHaveBeenCalledTimes(1);
      batchManager.addTask(mockTask);

      setImmediate(() => {
        expect(mockTask).toHaveBeenCalledTimes(2);
      });
    });
  });

  it('should handle tasks added during a batch', () => {
    const task1 = vi.fn();
    const task2 = vi.fn();

    batchManager.addTask(() => {
      task1();
      task2();
    });

    setImmediate(() => {
      expect(task1).toHaveBeenCalledTimes(1);
      expect(task2).toHaveBeenCalledTimes(1);
    });
  });
});
