import { RenderCount } from '@components/render-count';
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
    <div style={{ position: 'relative' }}>
      <RenderCount />
      <h2>{name}</h2>
    </div>
  );
};

const CountComponent = () => {
  const { count, increment } = useStore(appStore);

  return (
    <div style={{ position: 'relative' }}>
      <RenderCount />
      <p>count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};

const AppComponent = () => {
  const { updateName } = useStore(appStore);

  return (
    <>
      <button onClick={updateName}>update name</button>
      <br />
      <NameComponent />
      <br />
      <CountComponent />
    </>
  );
};

export default AppComponent;
