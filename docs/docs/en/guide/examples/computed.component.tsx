import React from 'react';
import { Button } from '@components/button';
import { Card } from '@components/card';
import { RenderCount } from '@components/render-count';
import { Text } from '@components/text';
import { defineStore, useStore } from '@vegajs/vortex';

const store = defineStore(({ reactive, computed }) => {
  const count = reactive(0);
  const doubleCount = computed(() => count.get() * 2);
  const increment = () => count.set((prev) => prev + 1);

  return { count, doubleCount, increment };
});

const ComputedComponent = () => {
  const { count, doubleCount, increment } = useStore(store);

  return (
    <Card>
      <RenderCount />
      <Text>count: {count}</Text>
      <Text>double count: {doubleCount}</Text>
      <Button onClick={increment}>Increment</Button>
    </Card>
  );
};

export default ComputedComponent;
