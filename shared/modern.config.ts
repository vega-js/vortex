import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: {
    target: 'esnext',
    minify: 'terser',
    jsx: 'automatic',
    buildType: 'bundleless',
    input: [
      'src/**/*.ts',
      'src/**/*.tsx',
      '!src/**/*.spec.ts',
      '!src/**/*.spec.tsx',
      '!src/**/*.test.ts',
      '!src/**/*.test.tsx',
    ],
    platform: 'browser',
    tsconfig: './tsconfig.build.json',
  },
  buildPreset: 'npm-library',
});
