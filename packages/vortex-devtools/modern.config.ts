import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: {
    platform: 'browser',
    target: 'esnext',
    minify: 'terser',
    jsx: 'automatic',
    splitting: true,
    shims: true,
    format: 'esm',
    buildType: 'bundle',
    input: [
      'src/**/*.ts',
      'src/**/*.tsx',
      '!src/types.ts',
      '!src/**/*.spec.ts',
      '!src/**/*.spec.tsx',
      '!src/**/*.test.ts',
      '!src/**/*.test.tsx',
    ],
    tsconfig: './tsconfig.build.json',
  },
});
