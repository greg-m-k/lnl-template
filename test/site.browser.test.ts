// Every real page (public/**/index.html) in a real Chrome: its own <main>, run through the site frame
// (public/lib/site.js) the way the page's script does, with the real topics.json and styles.css.
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { home, lesson } from '../public/lib/site.js';
import site from '../public/topics.json';
import '../public/styles.css';

const files = import.meta.glob<string>('../public/**/index.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const html = (path: string) => {
  const text = files[`../public${path}index.html`];
  if (text === undefined) throw new Error(`no page for ${path}`);
  return new DOMParser().parseFromString(text, 'text/html');
};

const lessons = site.topics.flatMap((t) => t.lessons.map((l) => ({ ...l, slug: t.slug })));
const pages = [{ path: '/', slug: '' }, ...lessons];
let requested: string[];
let errors: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  requested = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    requested.push(String(url));
    return Response.json(site);
  });
  errors = vi.spyOn(console, 'error');
  document.body.replaceChildren();
  await page.viewport(1280, 900);
});
afterEach(() => {
  expect(errors, 'nothing logs an error').not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

// Put the page's own <main> in the document and run the frame on it, as the page's script does.
async function render(path: string) {
  const main = document.importNode(html(path).querySelector('main')!, true);
  document.body.append(main);
  if (path === '/') await home(main);
  else await lesson(main, path);
}

test('home: one section per topic, one card per lesson, credits the origin and the author', async () => {
  await render('/');
  expect(document.querySelectorAll('.topic')).toHaveLength(site.topics.length);
  expect(document.querySelectorAll('.card')).toHaveLength(lessons.length);
  expect(document.querySelector(`header a[href="${site.origin.url}"]`)).not.toBeNull();
  expect(document.querySelector('footer')?.textContent).toBe(`Made by ${site.author.name}.`);
});

test.each(lessons)('lesson $path: chips for its topic, itself current, footer credit', async (l) => {
  await render(l.path);
  expect(document.querySelector('.chips [aria-current="page"]')?.textContent).toBe(l.chip ?? l.title);
  expect(document.querySelector('footer')?.textContent).toBe(`Made by ${site.author.name}.`);
});

test.each(lessons)('lesson $path: its files and every request stay below its topic path', async (l) => {
  const doc = html(l.path);
  const own = [
    ...[...doc.querySelectorAll('link[href], script[src], a[href^="/"], img[src]')].map(
      (n) => n.getAttribute('href') ?? n.getAttribute('src')!,
    ),
    ...[...doc.querySelectorAll('script:not([src])')].flatMap((s) =>
      [...(s.textContent ?? '').matchAll(/from\s+["'](\/[^"']*)/g)].map((m) => m[1]!),
    ),
  ].filter((p) => p.startsWith('/'));
  await render(l.path);
  expect(own.length + requested.length).toBeGreaterThan(0);
  for (const url of [...own, ...requested]) expect(url.startsWith(`/${l.slug}/`), url).toBe(true);
});

test.each(pages)('$path fits a 390px phone screen with no sideways scroll', async (p) => {
  await page.viewport(390, 800);
  await render(p.path);
  expect(document.documentElement.scrollWidth - innerWidth).toBe(0);
});
