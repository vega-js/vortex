import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: {
    platform: 'browser',
    target: 'es2018',
    minify: 'terser',
    jsx: 'automatic',
    splitting: true,
    shims: false,
    format: 'esm',
    buildType: 'bundleless',
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
