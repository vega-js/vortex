/// <reference types="vitest" />
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

type Options = { useJsDOM: boolean };

export const createVitestConfig = (options?: Options) => {
  const { useJsDOM } = options || {};

  return defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: useJsDOM ? 'jsdom' : 'node',
      setupFiles: useJsDOM
        ? resolve(__dirname, 'tests', 'vitest.setup.js')
        : undefined,
      testTimeout: 3000,
    },
  });
};

export default createVitestConfig();
