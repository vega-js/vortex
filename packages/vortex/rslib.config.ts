// import { defineConfig, moduleTools } from '@modern-js/module-tools';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  // plugins: [moduleTools()],
  source: {
    tsconfigPath: './tsconfig.build.json',
    entry: {
      index: [
        'src/**/*.ts',
        'src/**/*.tsx',

        '!src/**/*.spec.ts',
        '!src/**/*.spec.tsx',
        '!src/**/*.test.ts',
        '!src/**/*.test.tsx',
      ],
    },
  },
  output: {
    minify: true,
    target: 'web',
  },
  lib: [
    {
      bundle: false,
      dts: true,
      format: 'esm',
    },
    {
      bundle: false,
      dts: true,
      format: 'cjs',
    },
  ],
});
