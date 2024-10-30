import { Button } from '@components/button.tsx';
import { Card } from '@components/card.tsx';
import { DIContainer, defineStore, useStore } from '@vegajs/vortex';

type Container = {
  alert: (message?: string) => void;
};

const container = new DIContainer<Container>();

const alert =
  globalThis !== undefined && globalThis.alert ? globalThis.alert : () => {};

container.register('alert', alert);

export const DIStore = defineStore(
  ({ DI }) => {
    const alert = DI.get('alert');
    const showAlert = () => alert(`The Vortex is power`);

    return { showAlert };
  },
  {
    DI: container,
  },
);

const DiComponent = () => {
  const { showAlert } = useStore(DIStore);

  return (
    <Card>
      <Button onClick={showAlert}>show alert</Button>
    </Card>
  );
};

export default DiComponent;
