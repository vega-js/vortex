import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { styled } from 'styled-components';

type ActionPayload<T> = {
  action: string;
  newData: T;
  oldData: T;
  storeName: string;
  timestamp: string;
};

const WidgetIcon = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: #3b82f6;
  color: #ffffff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 10001;
  transition: background 0.3s;

  &:hover {
    background: #2563eb;
  }
`;

const Root = styled.div<{ height: number }>`
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 10000;
  width: 100%;
  height: ${({ height }) => height}px;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  overflow: auto;
  resize: vertical;
  font-family: 'Inter', sans-serif;
  display: ${({ height }) => (height === 0 ? 'none' : 'block')};

  user-select: none;
`;

const ResizeHandle = styled.div`
  height: 3px;
  background: #ccc;
  cursor: ns-resize;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  transition: background 0.3s;
  &:hover {
    background: #262323;
  }
`;

const Container = styled.div`
  display: flex;
  height: 100%;
  overflow-x: hidden;
  background: #f0f4f8;
`;

const Sidebar = styled.div`
  width: 35%;
  background: #1e293b;
  color: #e2e8f0;
  padding: 0 16px 16px 16px;
  overflow-y: auto;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  scrollbar-width: none;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  background: #1e293b;
  z-index: 1;
  padding: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #60a5fa;
`;

const ClearButton = styled.button`
  background: #3b82f6;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #2563eb;
  }
`;

const FilterContainer = styled.div``;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  background: #334155;
  border: 1px solid #4a5568;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #60a5fa;
  }
`;

const ActionItem = styled.div`
  border-bottom: 1px solid #4a5568;
  padding: 12px;
  cursor: pointer;
  border-radius: 4px;
  background: #334155;
  margin-bottom: 8px;
  transition: background 0.3s;

  &:hover {
    background: #475569;
  }
`;

const ActionDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const ActionInfo = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const StoreName = styled.strong`
  color: #60a5fa;
`;

const ActionType = styled.span<{ $actionType: string }>`
  background-color: ${(props) =>
    props.$actionType === 'init' ? '#046c14' : '#fbbf24'};
  padding: 4px 8px;
  color: #fff;
  border-radius: 4px;
  font-weight: bold;
`;

const Timestamp = styled.span`
  font-size: 0.875rem;
  color: #cbd5e1;
`;

const ActionKeys = styled.div`
  font-size: 0.875rem;
  color: #cbd5e1;
  margin-top: 4px;
`;

const DetailsContainer = styled.div.attrs<{ $isVisible: boolean }>(
  ({ $isVisible }) => ({
    style: { display: $isVisible ? 'block' : 'none' },
  }),
)`
  flex: 1;
  background: #ffffff;
  padding-left: 8px;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  transform: ${({ $isVisible }) =>
    $isVisible ? 'translateX(0)' : 'translateX(100%)'};
  transition: transform 0.3s ease-in-out;
`;

const DetailsHeader = styled.header`
  padding: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const DetailTitle = styled.h3`
  font-size: 1.25rem;
  color: #334155;
  margin-bottom: 16px;
`;

const DataSection = styled.div`
  flex: 1;
`;

const DataContainer = styled.div`
  display: flex;
  gap: 16px;
`;

const DataTitle = styled.h4`
  font-weight: 600;
  color: #1e293b;
`;

const DataContent = styled.pre`
  background: #1e293b;
  color: #fff;
  padding: 16px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const WIDGET_HEIGHT_KEY = 'vortexDevToolsHeight';
const WIDGET_OPEN_KEY = 'vortexDevToolsOpen';

const DevTools = () => {
  const [actions, setActions] = useState<ActionPayload<unknown>[]>([]);
  const [selectedAction, setSelectedAction] =
    useState<ActionPayload<unknown> | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('All');
  const [storeNames, setStoreNames] = useState<string[]>([]);

  const [height, setHeight] = useState<number>(() =>
    parseInt(localStorage.getItem(WIDGET_HEIGHT_KEY) || '300', 10),
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
      setActions(events);
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
                key={`${action.timestamp}-${action.storeName}`}
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
                  {action.action !== 'init' &&
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
                  {selectedAction.action === 'update' ? (
                    <>
                      <DataSection>
                        <DataTitle>Old Data</DataTitle>
                        <DataContent>
                          {JSON.stringify(selectedAction.oldData, null, 2)}
                        </DataContent>
                      </DataSection>
                      <DataSection>
                        <DataTitle>New Data</DataTitle>
                        <DataContent>
                          {JSON.stringify(selectedAction.newData, null, 2)}
                        </DataContent>
                      </DataSection>
                    </>
                  ) : (
                    <DataSection>
                      <DataTitle>Data</DataTitle>
                      <DataContent>
                        {JSON.stringify(selectedAction.newData, null, 2)}
                      </DataContent>
                    </DataSection>
                  )}
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
