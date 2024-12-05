import { BatchManager } from './core/batch-manager';
import { ComputedValue } from './core/create-computed';
import { Effect } from './core/create-effect';
import { ReactiveValue } from './core/create-reactive';
import { ReactiveContext } from './core/reactive-context';
import type { Reactive } from './types';

const context = new ReactiveContext();
const batchM = new BatchManager();

const reactive = <Value>(initialValue: Value): Reactive<Value> => {
  return new ReactiveValue(initialValue, context, batchM);
};

const computed = <Value>(fn: () => Value) => {
  return new ComputedValue(fn, context, batchM);
};

const effect = (fn: () => void) => {
  const instanceEffect = new Effect(fn, context, batchM);

  return instanceEffect.stop.bind(effect);
};

const batch = batchM.batch.bind(batchM);

export { reactive, computed, effect, batch };
