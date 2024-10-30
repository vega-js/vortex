import React from 'react';
import { Button } from '@components/button';
import { Card } from '@components/card';
import { RenderCount } from '@components/render-count';
import { Text } from '@components/text';
import { defineStore, useStore } from '@vegajs/vortex';

const counterStore = defineStore(({ reactive }) => {
  const count = reactive(0);
  const increment = () => count.set((prev) => prev + 1);

  return { count, increment };
});

const SimpleStore = () => {
  const { count, increment } = useStore(counterStore);

  return (
    <Card>
      <RenderCount />
      <Text>count: {count}</Text>
      <Button onClick={increment}>Increment</Button>
    </Card>
  );
};

export default SimpleStore;
