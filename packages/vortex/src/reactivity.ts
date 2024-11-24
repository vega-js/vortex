import { ComputedValue } from './core/create-computed';
import { Effect } from './core/create-effect';
import { ReactiveValue } from './core/create-reactive';
import { ReactiveContext } from './core/reactive-context';
import type { Reactive } from './types';

const reactiveContext = new ReactiveContext();

const reactive = <Value>(initialValue: Value): Reactive<Value> => {
  return new ReactiveValue(initialValue, reactiveContext);
};

const computed = <Value>(fn: () => Value) => {
  return new ComputedValue(fn, reactiveContext);
};

const effect = (fn: () => void) => {
  const instanceEffect = new Effect(fn, reactiveContext);

  return instanceEffect.stop.bind(effect);
};

export { reactive, computed, effect };
