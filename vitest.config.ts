/// <reference types="vitest/config" />
// One `pnpm run test` runs two projects:
//   node:    catalogue and scaffold checks, and the real site served by Alchemy's test harness (test/*.test.*)
//   browser: every page, rendered by Astro, laid out in a real Chrome (test/*.browser.test.ts)
// getViteConfig gives both projects Astro's Vite setup, so .astro files load in tests.
import { playwright } from '@vitest/browser-playwright';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getViteConfig } from 'astro/config';
import type { BrowserCommand } from 'vitest/node';

// Runs in Node: renders the page at `path` (src/pages/...) with Astro's Container API and returns its HTML.
const renderPage: BrowserCommand<[path: string]> = async ({ project }, path) => {
  const file = `/src/pages${path === '/' ? '/index' : path.replace(/\/$/, '')}.astro`;
  const page = await project.vite.ssrLoadModule(file);
  const container = await AstroContainer.create();
  return container.renderToString(page.default, { request: new Request(`http://localhost${path}`) });
};

export default getViteConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['test/**/*.test.ts'],
          exclude: ['test/**/*.browser.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['test/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            // The Chrome already installed on the machine (and on GitHub's runners); nothing to download.
            provider: playwright({ launchOptions: { channel: 'chrome' } }),
            instances: [{ browser: 'chromium' }],
            commands: { renderPage },
          },
        },
      },
    ],
  },
});
