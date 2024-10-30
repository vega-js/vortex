import styled from 'styled-components';

export const Card = styled.div`
  width: 100%;

  padding: 32px;
  border-radius: 24px;
  background: linear-gradient(145deg, #f4f6f9, #ffffff);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.12),
    0 6px 10px rgba(0, 0, 0, 0.08);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.15),
      0 8px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;
