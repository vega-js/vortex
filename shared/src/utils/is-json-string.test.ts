import { describe, expect, it } from 'vitest';

import { isJsonString } from './is-json-string';

describe('isJsonString', () => {
  it('should return true for a valid JSON string', () => {
    const validJson = '{"name":"John", "age":30, "city":"New York"}';

    expect(isJsonString(validJson)).toBe(true);
  });

  it('should return false for an invalid JSON string', () => {
    const invalidJson = 'Hello, world!';

    expect(isJsonString(invalidJson)).toBe(false);
  });

  it('should return false for a string that looks like JSON but is not', () => {
    const notJson = '{name:"John", age:30, city:"New York"}'; // Ошибка в синтаксисе

    expect(isJsonString(notJson)).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isJsonString('')).toBe(false);
  });

  it('should return false for a string with only whitespace', () => {
    expect(isJsonString('   ')).toBe(false);
  });
});
