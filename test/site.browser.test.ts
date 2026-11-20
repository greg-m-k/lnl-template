// Every page, rendered by Astro (the renderPage command in vitest.config.ts), laid out in a real Chrome with the
// real stylesheet: no sideways scroll on a 390px phone, and nothing written to console.error.
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { commands, page } from 'vitest/browser';
import site from '../src/site.json';
import '../src/styles/site.css';

declare module 'vitest/browser' {
  interface BrowserCommands {
    renderPage: (path: string) => Promise<string>;
  }
}

const paths = ['/', ...site.topics.flatMap((t) => t.lessons.map((l) => l.path))];
let errors: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errors = vi.spyOn(console, 'error');
  document.body.replaceChildren();
});
afterEach(() => {
  expect(errors, 'nothing logs an error').not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

// Put the rendered page's body (its <main>, and the home page's footer) into the document.
async function render(path: string) {
  const html = await commands.renderPage(path);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  document.body.append(...[...doc.body.children].map((n) => document.importNode(n, true)));
}

test.each(paths)('%s renders its content', async (path) => {
  await render(path);
  expect(document.querySelector('main h1')?.textContent?.trim()).toBeTruthy();
  expect(document.querySelector('footer')?.textContent).toBe(`Made by ${site.author.name}.`);
});

test.each(paths)('%s fits a 390px phone screen with no sideways scroll', async (path) => {
  await page.viewport(390, 800);
  await render(path);
  expect(document.documentElement.scrollWidth - innerWidth).toBe(0);
});
