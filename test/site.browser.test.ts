// Every page, rendered by Astro (the renderPage command in vitest.config.ts), laid out in a real Chrome with the
// real stylesheet: no sideways scroll on a 390px phone, and nothing written to console.error.
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { commands, page } from 'vitest/browser';
import site from '../src/site.json';
import '../src/styles/theme.css';

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
  expect(document.querySelector('body > footer')?.textContent?.trim()).toBe(
    `Made by ${site.author.name}.`,
  );
  // A Home chip on every page but home itself.
  const home = document.querySelector('body > header a.chip[href="/"]');
  if (path === '/') expect(home).toBeNull();
  else expect(home?.textContent?.trim()).toBe('← Home');
});

test("Graffiti's styles load: a lesson's chips get its pill shape", async () => {
  await render(site.topics[0]?.lessons[0]?.path ?? '/');
  const chip = document.querySelector('nav .chip');
  expect(chip).not.toBeNull();
  if (chip === null) return;
  expect(Number.parseFloat(getComputedStyle(chip).borderTopLeftRadius)).toBeGreaterThan(8);
});

test("home: a topic's lesson cards in one row are the same height", async () => {
  await page.viewport(1280, 900);
  await render('/');
  const cards = [...document.querySelectorAll('.layout-card .card')];
  expect(cards.length).toBeGreaterThan(1);
  const rows = Map.groupBy(cards, (card) => Math.round(card.getBoundingClientRect().top));
  for (const row of rows.values()) {
    const heights = new Set(row.map((card) => Math.round(card.getBoundingClientRect().height)));
    expect(heights.size, 'one height per row').toBe(1);
  }
});

test.each(paths)('%s fits a 390px phone screen with no sideways scroll', async (path) => {
  await page.viewport(390, 800);
  await render(path);
  expect(document.documentElement.scrollWidth - innerWidth).toBe(0);
});
