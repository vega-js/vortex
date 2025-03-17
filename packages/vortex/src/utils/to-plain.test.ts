import { describe, expect, it } from 'vitest';
import { toPlain } from './to-plain';

describe('toPlain', () => {
  it('should return the same value for primitive types', () => {
    expect(toPlain(42)).toBe(42);
    expect(toPlain('hello')).toBe('hello');
    expect(toPlain(true)).toBe(true);
    expect(toPlain(null)).toBe(null);
    expect(toPlain(undefined)).toBe(undefined);
  });

  it('should correctly convert an array of primitives', () => {
    const reactiveArray = new Proxy([1, 2, 3], {});

    expect(toPlain(reactiveArray)).toEqual([1, 2, 3]);
  });

  it('should correctly convert a nested array', () => {
    const reactiveArray = [[1, 2], [3, 4], 5];

    expect(toPlain(reactiveArray)).toEqual([[1, 2], [3, 4], 5]);
  });

  it('should correctly convert a simple object', () => {
    const reactiveObject = new Proxy({ a: 1, b: 'hello' }, {});

    expect(toPlain(reactiveObject)).toEqual({ a: 1, b: 'hello' });
  });

  it('should correctly convert a nested object', () => {
    const reactiveObject = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 'nested',
        },
      },
    };

    expect(toPlain(reactiveObject)).toEqual({
      a: 1,
      b: {
        c: 2,
        d: {
          e: 'nested',
        },
      },
    });
  });

  it('should correctly convert an object containing arrays', () => {
    const reactiveObject = {
      a: [1, 2],
      b: {
        c: [3, 4],
      },
    };

    expect(toPlain(reactiveObject)).toEqual({
      a: [1, 2],
      b: {
        c: [3, 4],
      },
    });
  });

  it('should correctly convert an array containing objects', () => {
    const reactiveArray = [
      { a: 1, b: 2 },
      { c: 3, d: 4 },
    ];

    expect(toPlain(reactiveArray)).toEqual([
      { a: 1, b: 2 },
      { c: 3, d: 4 },
    ]);
  });

  it('should handle deeply nested structures', () => {
    const nestedStructure = {
      a: [1, { b: 2, c: [3, { d: 4 }] }],
      e: {
        f: { g: [5, 6] },
      },
    };

    expect(toPlain(nestedStructure)).toEqual({
      a: [1, { b: 2, c: [3, { d: 4 }] }],
      e: {
        f: { g: [5, 6] },
      },
    });
  });

  it('should handle mixed data types', () => {
    const mixedStructure = {
      a: [1, 'two', true],
      b: { c: null, d: undefined },
      e: 42,
    };

    expect(toPlain(mixedStructure)).toEqual({
      a: [1, 'two', true],
      b: { c: null, d: undefined },
      e: 42,
    });
  });

  it('should return empty object for an empty object', () => {
    const reactiveObject = {};

    expect(toPlain(reactiveObject)).toEqual({});
  });

  it('should return empty array for an empty array', () => {
    const reactiveArray: unknown[] = [];

    expect(toPlain(reactiveArray)).toEqual([]);
  });
});
