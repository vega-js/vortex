import styled from 'styled-components';

export const Button = styled.button`
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #007aff, #00d4ff);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(0, 122, 255, 0.4);
  display: inline-block;

  &:hover {
    background: linear-gradient(135deg, #005bb5, #0090ff);
    box-shadow: 0 6px 16px rgba(0, 144, 255, 0.5);
  }

  &:active {
    background: linear-gradient(135deg, #004080, #007aff);
    transform: scale(0.98);
  }
`;
