// One `pnpm run test` runs two projects:
//   node:    catalogue and scaffold checks, and the real site served by Alchemy's test harness (test/*.test.*)
//   browser: the site frame's browser code in a real Chrome (test/*.browser.test.ts)
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['test/**/*.test.{mjs,ts}'],
          exclude: ['test/**/*.browser.test.ts'],
        },
      },
      {
        // The tests import the site frame from public/ as code, so Vite must not treat it as a static folder.
        publicDir: false,
        test: {
          name: 'browser',
          include: ['test/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            // The Chrome already installed on the machine (and on GitHub's runners); nothing to download.
            provider: playwright({ launchOptions: { channel: 'chrome' } }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
