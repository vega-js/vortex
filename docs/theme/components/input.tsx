import styled from 'styled-components';

export const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 122, 255, 0.3);
  background: #f9f9fb;
  font-size: 16px;
  color: #333;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:focus {
    border-color: #007aff;
    box-shadow: 0 4px 10px rgba(0, 122, 255, 0.15);
    outline: none;
  }

  &::placeholder {
    color: #aaa;
  }
`;
