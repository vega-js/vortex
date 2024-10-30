import path from 'node:path';
import { defineConfig } from 'rspress/config';
import { pluginFontOpenSans } from 'rspress-plugin-font-open-sans';

export default defineConfig({
  plugins: [pluginFontOpenSans()],
  root: path.join(__dirname, 'docs'),
  lang: 'en',
  base: '/',
  title: 'Vortex',
  icon: 'https://raw.githubusercontent.com/vega-js/vortex/main/packages/vortex/docs/static/preview.svg',
  logo: {
    light:
      'https://raw.githubusercontent.com/vega-js/vortex/main/packages/vortex/docs/static/preview.svg',
    dark: 'https://raw.githubusercontent.com/vega-js/vortex/main/packages/vortex/docs/static/preview.svg',
  },
  outDir: 'dist',
  ssg: {
    strict: true,
  },
  markdown: {
    checkDeadLinks: true,
  },
  route: {
    cleanUrls: true,
    // exclude document fragments from routes
    exclude: ['**/en/shared/**', './theme', './src'],
  },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/vega-js/vortex',
      },
    ],
    locales: [
      {
        lang: 'en',
        label: 'English',
        title: 'Vortex',
        description: 'A next-gen state management library',
        editLink: {
          docRepoBaseUrl:
            'https://github.com/vega-js/vortex/tree/main/docs/docs',
          text: '📝 Edit this page on GitHub',
        },
      },
    ],
  },
  builderConfig: {
    dev: {
      lazyCompilation: true,
    },
    source: {
      alias: {
        '@components': path.join(__dirname, '@components'),
        '@en': path.join(__dirname, 'docs/en'),
      },
    },
    html: {
      appIcon: {
        name: 'Vortex',
        icons: [],
      },
    },
  },
});
