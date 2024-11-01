import type { Computed, Query, Reactive } from '../types';

export * from './is-equal';

export * from './shallow-equal';

export const toObjectKeys = <Obj extends Record<string, unknown>>(
  obj: Obj,
): (keyof Obj)[] => {
  return Object.keys(obj) as (keyof Obj)[];
};

export const isReactive = (value: unknown): value is Reactive<unknown> => {
  return !!(
    value &&
    typeof value === 'object' &&
    Object.hasOwn(value, 'get') &&
    Object.hasOwn(value, 'set') &&
    Object.hasOwn(value, 'subscribe') &&
    Object.hasOwn(value, 'reset') &&
    Object.hasOwn(value, 'type') &&
    (value as { type?: unknown }).type === 'reactive'
  );
};

export const isComputed = (value: unknown): value is Computed<unknown> => {
  return !!(
    value &&
    typeof value === 'object' &&
    Object.hasOwn(value, 'type') &&
    Object.hasOwn(value, 'get') &&
    (value as { type?: unknown }).type === 'computed'
  );
};

export const isQuery = (
  value: unknown,
): value is Query<unknown, unknown, unknown> => {
  return !!(
    value &&
    typeof value === 'object' &&
    Object.hasOwn(value, 'type') &&
    Object.hasOwn(value, 'set') &&
    Object.hasOwn(value, 'get') &&
    (value as { type?: unknown }).type === 'query'
  );
};

export const isReactiveUnit = (
  unit: unknown,
): unit is
  | Computed<unknown>
  | Query<unknown, unknown, unknown>
  | Reactive<unknown> => isReactive(unit) || isComputed(unit) || isQuery(unit);
