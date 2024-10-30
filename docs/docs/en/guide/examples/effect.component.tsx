import React from 'react';
import { Button } from '@components/button';
import { Card } from '@components/card';
import { RenderCount } from '@components/render-count';
import { Text } from '@components/text';
import { defineStore, useStore } from '@vegajs/vortex';

const effectStore = defineStore(({ reactive, effect }) => {
  const count = reactive(0);
  const logEffect = reactive<string | undefined>(undefined);

  effect(() => {
    logEffect.set(`effect was called with count: ${count.get()}`);
  });

  const increment = () => count.set((prev) => prev + 1);

  return { count, logEffect, increment };
});

const EffectStore = () => {
  const { logEffect, increment } = useStore(effectStore);

  return (
    <Card>
      <RenderCount />
      <Text>count: {logEffect}</Text>
      <Button onClick={increment}>Increment</Button>
    </Card>
  );
};

export default EffectStore;
