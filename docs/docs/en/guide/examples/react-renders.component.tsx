import { Button } from '@components/button.tsx';
import { Card } from '@components/card';
import { RenderCount } from '@components/render-count';
import { Text } from '@components/text';
import { defineStore, useStore } from '@vegajs/vortex';

const appStore = defineStore(({ reactive }) => {
  const count = reactive(0);

  const name = reactive('John');

  const increment = () => count.set((prev) => prev + 1);

  const updateName = () => name.set('Alex');

  return { count, name, updateName, increment };
});

const NameComponent = () => {
  const { name } = useStore(appStore); // no renders when count changed

  return (
    <Card>
      <Text>Child 1</Text>
      <RenderCount />
      <Text>{name}</Text>
    </Card>
  );
};

const CountComponent = () => {
  const { count, increment } = useStore(appStore);

  return (
    <Card style={{ position: 'relative' }}>
      <Text>Child 2</Text>
      <RenderCount />
      <Text>count: {count}</Text>
      <Button onClick={increment}>Increment</Button>
    </Card>
  );
};

const AppComponent = () => {
  const { updateName } = useStore(appStore);

  return (
    <Card>
      <Text>Parent component</Text>
      <br />
      <Button onClick={updateName}>update name</Button>
      <br />
      <br />
      <NameComponent />
      <br />
      <CountComponent />
    </Card>
  );
};

export default AppComponent;
