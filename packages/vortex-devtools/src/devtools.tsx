import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ActionDetails,
  ActionInfo,
  ActionItem,
  ActionKeys,
  ActionType,
  ClearButton,
  Container,
  DataContainer,
  DetailTitle,
  DetailsContainer,
  DetailsHeader,
  FilterContainer,
  Header,
  HeaderActions,
  HighlightedText,
  KeyValueContainer,
  ObjectContainer,
  ResizeHandle,
  Root,
  Select,
  Sidebar,
  StoreName,
  Timestamp,
  Title,
  Title2,
  WidgetIcon,
} from './styles';
type Action =
  | 'update'
  | 'subscribe'
  | 'unsubscribe'
  | 'reset'
  | 'error'
  | 'init';

type ActionPayload<T> = {
  action: Action;
  newData: T;
  oldData: T;
  storeName: string;
  timestamp: string;
};

const renderData = (
  data: Record<string, unknown>,
  changes: Record<string, boolean>,
  color: string,
) => {
  return Object.keys(data).map((key) => {
    const value = data[key];
    const isChanged = changes[key];

    return (
      <KeyValueContainer key={key}>
        <strong>{key}:</strong>{' '}
        {isChanged ? (
          <HighlightedText color={color}>
            {JSON.stringify(value, null, 2)}
          </HighlightedText>
        ) : (
          JSON.stringify(value, null, 2)
        )}
      </KeyValueContainer>
    );
  });
};

const compareData = (
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
) => {
  const changes: Record<string, boolean> = {};

  Object.keys({ ...oldData, ...newData }).forEach((key) => {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = true;
    }
  });

  return (
    <>
      <ObjectContainer>
        <Title2>Old Data</Title2>
        {renderData(oldData, changes, 'red')}
      </ObjectContainer>
      <ObjectContainer>
        <Title2>New Data</Title2>
        {renderData(newData, changes, 'green')}
      </ObjectContainer>
    </>
  );
};

const WIDGET_HEIGHT_KEY = 'vortexDevToolsHeight';
const WIDGET_OPEN_KEY = 'vortexDevToolsOpen';

const DevTools = () => {
  const [actions, setActions] = useState<ActionPayload<unknown>[]>([]);
  const [selectedAction, setSelectedAction] =
    useState<ActionPayload<unknown> | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('All');
  const [storeNames, setStoreNames] = useState<string[]>([]);

  const [height, setHeight] = useState<number>(() =>
    Number.parseInt(localStorage.getItem(WIDGET_HEIGHT_KEY) || '300', 10),
  );
  const [isResizing, setIsResizing] = useState(false);
  const [isOpen, setIsOpen] = useState(
    () => localStorage.getItem(WIDGET_OPEN_KEY) === 'true',
  );

  const timelineRef = useRef<HTMLDivElement>(null);

  const toggleDevTools = () => {
    const newIsOpen = !isOpen;

    setIsOpen(newIsOpen);
    localStorage.setItem(WIDGET_OPEN_KEY, String(newIsOpen));
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTo({
        top: timelineRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [actions]);

  const handleMouseMove = (event: MouseEvent) => {
    if (isResizing) {
      const newHeight = window.innerHeight - event.clientY;
      const adjustedHeight = Math.max(100, newHeight); // Set minimum height

      setHeight(adjustedHeight);
      localStorage.setItem(WIDGET_HEIGHT_KEY, String(adjustedHeight));
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (!window.__VORTEX_DEVTOOLS__.initialized) {
      const { initializedStores, events } = window.__VORTEX_DEVTOOLS__;

      setStoreNames(initializedStores);
      setActions(() => events);
      window.__VORTEX_DEVTOOLS__.initialized = true;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'VORTEX_DEVTOOLS') {
        const payload = JSON.parse(event.data.payload);

        setActions((prevActions) => [...prevActions, payload]);
      }

      if (event.data.type === 'VORTEX_DEVTOOLS_INIT') {
        const payload = JSON.parse(event.data.payload);

        setStoreNames((prev) =>
          Array.from(new Set([...prev, payload.storeName])),
        );
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleClear = () => {
    if (selectedStore !== 'All') {
      setActions((prevActions) =>
        prevActions.filter((action) => action.storeName !== selectedStore),
      );
    } else {
      setActions([]);
    }
  };

  const handleSelectAction = (action: ActionPayload<unknown>) =>
    setSelectedAction(action);

  const handleStoreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStore(event.target.value);
  };

  const filteredActions =
    selectedStore === 'All'
      ? actions
      : actions.filter((action) => action.storeName === selectedStore);

  return (
    <>
      <WidgetIcon title="Vortex devtools" onClick={toggleDevTools}>
        ⚙️
      </WidgetIcon>
      <Root height={isOpen ? height : 0}>
        <ResizeHandle onMouseDown={handleMouseDown} />
        <Container>
          <Sidebar ref={timelineRef}>
            <Header>
              <Title>Timeline</Title>
              <HeaderActions>
                <ClearButton onClick={handleClear}>CLEAR</ClearButton>
                <FilterContainer>
                  <Select value={selectedStore} onChange={handleStoreChange}>
                    <option value="All">All Stores</option>
                    {storeNames.map((storeName) => (
                      <option key={storeName} value={storeName}>
                        {storeName}
                      </option>
                    ))}
                  </Select>
                </FilterContainer>
              </HeaderActions>
            </Header>

            {filteredActions.map((action) => (
              <ActionItem
                key={`${action.timestamp}-${action.action}-${action.storeName}`}
                onClick={() => handleSelectAction(action)}
              >
                <ActionDetails>
                  <ActionInfo>
                    <StoreName>{action.storeName}</StoreName>
                    <ActionType $actionType={action.action}>
                      {action.action}
                    </ActionType>
                  </ActionInfo>
                  <Timestamp>{action.timestamp}</Timestamp>
                </ActionDetails>
                <ActionKeys>
                  {action.action === 'update' &&
                    Object.keys(action.newData as Record<string, unknown>).join(
                      ', ',
                    )}
                </ActionKeys>
              </ActionItem>
            ))}
          </Sidebar>

          <DetailsContainer $isVisible={!!selectedAction}>
            <DetailsHeader>
              <Title>Details</Title>
              <ClearButton onClick={() => setSelectedAction(null)}>
                X
              </ClearButton>
            </DetailsHeader>

            {selectedAction && (
              <>
                <DetailTitle>{selectedAction.action}</DetailTitle>
                <DataContainer>
                  {
                    selectedAction.action === 'update' ? (
                      compareData(
                        selectedAction.oldData as Record<string, unknown>,
                        selectedAction.newData as Record<string, unknown>,
                      )
                    ) : (
                      <ObjectContainer>
                        {renderData(
                          JSON.parse(
                            JSON.stringify(selectedAction.newData),
                          ) as Record<string, unknown>,
                          {},
                          'red',
                        )}
                      </ObjectContainer>
                    )
                    // <pre>{JSON.stringify(selectedAction.newData, null, 2)}</pre>
                  }
                </DataContainer>
              </>
            )}
          </DetailsContainer>
        </Container>
      </Root>
    </>
  );
};

type DevToolsGlobal = {
  initializedStores: string[];
  events: ActionPayload<unknown>[];
  initialized: boolean;
  enable: boolean;
};

declare global {
  interface Window {
    __VORTEX_DEVTOOLS__: DevToolsGlobal;
    myFunction(): boolean;
    myVariable: number;
  }
}

export function initDevtools({
  enableDevTools = (typeof import.meta !== 'undefined' &&
    // @ts-ignore
    import.meta.env?.MODE === 'development') ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'),
} = {}) {
  if (
    !enableDevTools ||
    typeof window === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return;
  }

  if (!window.__VORTEX_DEVTOOLS__) {
    window.__VORTEX_DEVTOOLS__ = {
      initializedStores: [],
      events: [],
      initialized: false,
      enable: true,
    };
  }

  const id = 'vortex-devtools-container';

  if (document.getElementById(id)) {
    return;
  }

  const devtoolsContainer = document.createElement('div');

  devtoolsContainer.id = id;
  document.body.appendChild(devtoolsContainer);
  createRoot(devtoolsContainer).render(<DevTools />);
}
