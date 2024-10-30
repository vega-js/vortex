import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

export function useRenderCount() {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
  });

  return renderCount.current;
}

const RenderCountContainer = styled.span`
  position: absolute;
  right: 16px;
  top: 16px;
  background: linear-gradient(135deg, #007aff, #00d4ff);
  color: white;
  border-radius: 12px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

export const RenderCount = () => {
  const renderCount = useRenderCount();

  return <RenderCountContainer>render: {renderCount}</RenderCountContainer>;
};
