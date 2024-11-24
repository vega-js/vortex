import { styled } from 'styled-components';

const colors = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  backgroundLight: '#f7f9fc',
  backgroundDark: '#1e293b',
  backgroundDarker: '#334155',
  backgroundGray: '#f0f4f8',
  borderGray: '#ddd',
  textLight: '#e2e8f0',
  textGray: '#cbd5e1',
  highlightPositive: '#046c14',
  highlightWarning: '#fbbf24',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.2)',
};

const commonStyles = {
  borderRadius: '4px',
  boxShadow: `0px 0px 10px ${colors.shadowLight}`,
  padding: '8px 12px',
  transition: '0.3s',
};

export const WidgetIcon = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: ${colors.primary};
  color: #ffffff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: ${commonStyles.boxShadow};
  cursor: pointer;
  z-index: 10001;
  transition: background ${commonStyles.transition};
  user-select: none;

  &:hover {
    background: ${colors.primaryHover};
  }
`;

export const Root = styled.div<{ height: number }>`
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 10000;
  width: 100%;
  height: ${({ height }) => height}px;
  background: white;
  border: 1px solid ${colors.borderGray};
  box-shadow: ${commonStyles.boxShadow};
  overflow: auto;
  resize: vertical;
  font-family: 'Inter', sans-serif;
  display: ${({ height }) => (height === 0 ? 'none' : 'block')};
  user-select: none;
`;

export const ResizeHandle = styled.div`
  height: 3px;
  background: #ccc;
  cursor: ns-resize;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  transition: background ${commonStyles.transition};

  &:hover {
    background: ${colors.shadowDark};
  }
`;

export const Container = styled.div`
  display: flex;
  height: 100%;
  overflow-x: hidden;
  background: ${colors.backgroundGray};
`;

export const Sidebar = styled.div`
  width: 35%;
  background: ${colors.backgroundDark};
  color: ${colors.textLight};
  padding: 0 16px 16px 16px;
  overflow-y: auto;
  box-shadow: 2px 0 8px ${colors.shadowDark};
  scrollbar-width: none;
`;

export const Header = styled.header`
  position: sticky;
  top: 0;
  background: ${colors.backgroundDark};
  z-index: 1;
  padding: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

export const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${colors.primary};
`;

export const ClearButton = styled.button`
  background: ${colors.primary};
  color: white;
  padding: ${commonStyles.padding};
  border: none;
  border-radius: ${commonStyles.borderRadius};
  cursor: pointer;
  transition: background ${commonStyles.transition};

  &:hover {
    background: ${colors.primaryHover};
  }
`;

export const FilterContainer = styled.div``;

export const Select = styled.select`
  width: 100%;
  padding: 8px;
  background: ${colors.backgroundDarker};
  border: 1px solid ${colors.borderGray};
  border-radius: ${commonStyles.borderRadius};
  color: ${colors.textLight};
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

export const ActionItem = styled.div`
  border-bottom: 1px solid ${colors.borderGray};
  padding: 12px;
  cursor: pointer;
  border-radius: ${commonStyles.borderRadius};
  background: ${colors.backgroundDarker};
  margin-bottom: 8px;
  transition: background ${commonStyles.transition};

  &:hover {
    background: #475569;
  }
`;

export const ActionDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

export const ActionInfo = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const StoreName = styled.strong`
  color: ${colors.primary};
`;

export const ActionType = styled.span<{ $actionType: string }>`
  background-color: ${(props) =>
    props.$actionType === 'init'
      ? colors.highlightPositive
      : colors.highlightWarning};
  padding: 4px 8px;
  color: #fff;
  border-radius: ${commonStyles.borderRadius};
  font-weight: bold;
`;

export const Timestamp = styled.span`
  font-size: 0.875rem;
  color: ${colors.textGray};
`;

export const ActionKeys = styled.div`
  font-size: 0.875rem;
  color: ${colors.textGray};
  margin-top: 4px;
`;

export const DetailsContainer = styled.div.attrs<{ $isVisible: boolean }>(
  ({ $isVisible }) => ({
    style: { display: $isVisible ? 'block' : 'none' },
  }),
)`
  flex: 1;
  background-color: ${colors.backgroundLight};
  padding-left: 8px;
  overflow: auto;
  scrollbar-width: none;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  box-shadow: -2px 0 8px ${colors.shadowDark};
  transform: ${({ $isVisible }) =>
    $isVisible ? 'translateX(0)' : 'translateX(100%)'};
  transition: transform ${commonStyles.transition} ease-in-out;
`;

export const DetailsHeader = styled.header`
  padding: 16px;
  display: flex;
  position: sticky;
  top: 0;
  background-color: #ffffff;
  border-bottom: 1px solid ${colors.borderGray};
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const DetailTitle = styled.h3`
  font-size: 1.25rem;
  color: ${colors.backgroundDarker};
  margin-bottom: 16px;
`;

export const DataContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 2rem;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
`;

export const ObjectContainer = styled.pre`
  flex: 1;
  background-color: #ffffff;
  padding: 1rem;
  border: 1px solid ${colors.borderGray};
  border-radius: 8px;
  box-shadow: 0px 2px 4px ${colors.shadowDark};
`;

export const Title2 = styled.h4`
  font-size: 1rem;
  font-weight: bold;
  color: ${colors.backgroundDark};
  margin-bottom: 0.5rem;
  border-bottom: 1px solid ${colors.borderGray};
  padding-bottom: 0.5rem;
`;

export const KeyValueContainer = styled.div`
  margin-bottom: 0.2rem;
  line-height: 1.5;
`;

export const HighlightedText = styled.span<{ color: string }>`
  color: ${(props) => props.color};
`;
