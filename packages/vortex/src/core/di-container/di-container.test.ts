import { describe, expect, it } from 'vitest';
import { DIContainer } from './di-container';

interface Dependencies {
  logger: Console;
  config: { apiUrl: string };
  service: () => string;
}

describe('DIContainer', () => {
  it('should register and retrieve a dependency', () => {
    const container = new DIContainer<Dependencies>();

    const logger = console;

    container.register('logger', logger);
    expect(container.get('logger')).toBe(logger);
  });

  it('should throw an error if the dependency is not found', () => {
    const container = new DIContainer<Dependencies>();

    expect(() => container.get('config')).toThrowError(
      'Dependency config not found',
    );
  });

  it('should allow registering multiple dependencies and retrieving them', () => {
    const container = new DIContainer<Dependencies>();

    const logger = console;
    const config = { apiUrl: 'https://api.example.com' };
    const service = () => 'service';

    container.register('logger', logger);
    container.register('config', config);
    container.register('service', service);
    expect(container.get('logger')).toBe(logger);
    expect(container.get('config')).toBe(config);
    expect(container.get('service')).toBe(service);
  });

  it('should override a dependency when registered again', () => {
    const container = new DIContainer<Dependencies>();

    const oldLogger = { log: () => {} } as Console;
    const newLogger = console;

    container.register('logger', oldLogger);
    container.register('logger', newLogger);
    expect(container.get('logger')).toBe(newLogger);
  });
});
