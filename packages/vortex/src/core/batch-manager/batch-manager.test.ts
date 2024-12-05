import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Effect } from '../create-effect';
import { BatchManager } from './batch-manager';

describe('BatchManager', () => {
  let batchManager: BatchManager;

  beforeEach(() => {
    batchManager = new BatchManager();
  });

  it('should run a function in a batch', () => {
    const mockFn = vi.fn();

    batchManager.batch(() => {
      mockFn();
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle nested batches correctly', () => {
    const mockFn = vi.fn();

    batchManager.batch(() => {
      mockFn();

      batchManager.batch(() => {
        mockFn();
      });
    });

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should correctly manage batch depth during nested batches', () => {
    expect(batchManager.batchDepth).toBe(0);
    batchManager.startBatch();
    expect(batchManager.batchDepth).toBe(1);
    batchManager.startBatch();
    expect(batchManager.batchDepth).toBe(2);
    batchManager.endBatch();
    expect(batchManager.batchDepth).toBe(1);
    batchManager.endBatch();
    expect(batchManager.batchDepth).toBe(0);
  });

  it('should correctly manage batch depth with a depth of 100', () => {
    expect(batchManager.batchDepth).toBe(0);

    for (let i = 0; i < 100; i++) {
      batchManager.startBatch();
      expect(batchManager.batchDepth).toBe(i + 1);
    }

    expect(batchManager.batchDepth).toBe(100);

    for (let i = 100; i > 0; i--) {
      batchManager.endBatch();
      expect(batchManager.batchDepth).toBe(i - 1);
    }

    expect(batchManager.batchDepth).toBe(0);
  });

  it('should execute queued effects', () => {
    const effectMock = { run: vi.fn() } as unknown as Effect;

    batchManager.queueEffect(effectMock);
    batchManager.endBatch();
    expect(effectMock.run).toHaveBeenCalledTimes(1);
  });

  it('should handle errors in effects correctly', () => {
    const effectMock = {
      run: vi.fn(() => {
        throw new Error('Effect error');
      }),
    } as unknown as Effect;

    batchManager.queueEffect(effectMock);
    expect(() => batchManager.endBatch()).toThrow('Effect error');
  });

  it('should process effects added during batch execution', () => {
    const effectMock1 = { run: vi.fn() } as unknown as Effect;
    const effectMock2 = { run: vi.fn() } as unknown as Effect;

    batchManager.queueEffect({
      run: () => {
        batchManager.queueEffect(effectMock2);
      },
    } as Effect);

    batchManager.queueEffect(effectMock1);
    batchManager.endBatch();
    expect(effectMock1.run).toHaveBeenCalledTimes(1);
    expect(effectMock2.run).toHaveBeenCalledTimes(0);
  });

  it('should not process effects if no effects are queued', () => {
    expect(() => batchManager.endBatch()).not.toThrow();
  });

  it('should handle multiple independent batches', () => {
    const mockFn1 = vi.fn();
    const mockFn2 = vi.fn();

    batchManager.batch(() => {
      mockFn1();
    });

    batchManager.batch(() => {
      mockFn2();
    });

    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });

  it('should correctly decrement batchDepth after nested batches', () => {
    batchManager.startBatch();
    batchManager.startBatch();
    batchManager.endBatch();
    expect(batchManager.batchDepth).toBe(1);
    batchManager.endBatch();
    expect(batchManager.batchDepth).toBe(0);
  });

  it('should not execute effects if batchDepth > 1', () => {
    const effectMock = { run: vi.fn() } as unknown as Effect;

    batchManager.startBatch();
    batchManager.queueEffect(effectMock);
    batchManager.endBatch();
    expect(effectMock.run).toHaveBeenCalledTimes(1);
  });
});
