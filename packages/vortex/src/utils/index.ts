import type { Computed, Mutation, Query, Reactive } from '../types';

export * from './retry';

export * from './shallow-equal';

export const toObjectKeys = <Obj extends Record<string, unknown>>(
  obj: Obj,
): (keyof Obj)[] => {
  return Object.keys(obj) as (keyof Obj)[];
};

export const isReactive = (value: unknown): value is Reactive<unknown> => {
  return (value as { type?: unknown })?.type === '$$reactive';
};

export const isComputed = (value: unknown): value is Computed<unknown> => {
  return (value as { type?: unknown })?.type === '$$computed';
};

export const isQuery = (
  value: unknown,
): value is Query<unknown, unknown, unknown> => {
  return (value as { type?: unknown })?.type === '$$query';
};

export const isMutation = (
  value: unknown,
): value is Mutation<unknown, unknown, unknown> => {
  return (value as { type?: unknown })?.type === '$$mutation';
};

export const isReactiveUnit = (
  unit: unknown,
): unit is
  | Computed<unknown>
  | Query<unknown, unknown, unknown>
  | Reactive<unknown> => isReactive(unit) || isComputed(unit) || isQuery(unit);
