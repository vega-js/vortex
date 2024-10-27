import { describe, expect, it, vi } from 'vitest';

import { EventEmitter } from './event-emitter';

describe('EventEmitter tests', () => {
  it('should subscribe and receive an event', () => {
    const emitter = new EventEmitter<string>();
    const mockListener = vi.fn();

    emitter.subscribe(mockListener);
    emitter.emit('test_event');
    expect(mockListener).toHaveBeenCalledWith('test_event');
  });

  it('should unsubscribe from the event', () => {
    const emitter = new EventEmitter<string>();
    const mockListener = vi.fn();

    emitter.subscribe(mockListener);
    emitter.unsubscribe(mockListener);
    emitter.emit('test_event');
    expect(mockListener).not.toHaveBeenCalled();
  });

  it('should subscribe and unsubscribe using the unsubscribe function', () => {
    const emitter = new EventEmitter<string>();
    const mockListener = vi.fn();

    const unsubscribe = emitter.subscribe(mockListener);

    unsubscribe();
    emitter.emit('test_event');
    expect(mockListener).not.toHaveBeenCalled();
  });

  it('should handle multiple subscriptions', () => {
    const emitter = new EventEmitter<string>();
    const mockListener1 = vi.fn();
    const mockListener2 = vi.fn();

    emitter.subscribe(mockListener1);
    emitter.subscribe(mockListener2);
    emitter.emit('test_event');
    expect(mockListener1).toHaveBeenCalledWith('test_event');
    expect(mockListener2).toHaveBeenCalledWith('test_event');
  });
});
