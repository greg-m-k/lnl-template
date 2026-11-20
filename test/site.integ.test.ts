// Boots the real stack (alchemy.run.ts) locally with Alchemy's test harness and drives it over HTTP.
// dev: true runs it in workerd with local simulators, so no Cloudflare account is touched.
import * as Cloudflare from '@alchemy.run/cloudflare';
import * as Test from '@alchemy.run/test/Vitest';
import { expect } from '@effect/vitest';
import * as Alchemy from 'alchemy';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import Stack from '../alchemy.run.ts';
import site from '../src/site.json';

const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  state: Alchemy.localState(),
  dev: true,
});

const stack = beforeAll(deploy(Stack), { timeout: 300_000 });
afterAll(destroy(Stack));

const base = Effect.map(stack, ({ url }) => {
  if (!url) throw new Error('the stack did not report a url');
  return url.replace(/\/+$/, '');
});
const html = (path: string) =>
  Effect.gen(function* () {
    const res = yield* Test.getWhenReady(`${yield* base}${path}`);
    expect(res.status, path).toBe(200);
    expect(res.headers['content-type'], path).toContain('text/html');
    // Astro's dev server tags every element with data-astro-source-* attributes; the pages are checked without them.
    return (yield* res.text).replace(/ data-astro-source-[a-z]+="[^"]*"/g, '');
  });
const lessons = site.topics.flatMap((t) => t.lessons.map((l) => ({ ...l, topic: t })));
const credit = `Made by <a href="${site.author.url}">${site.author.name}</a>.`;

test(
  'home: one section per topic, one card per lesson, credits the origin and the author',
  Effect.gen(function* () {
    const page = yield* html('/');
    expect(page.match(/<section class="topic"/g)).toHaveLength(site.topics.length);
    expect(page.match(/<a class="card"/g)).toHaveLength(lessons.length);
    expect(page).toContain(`href="${site.origin.url}"`);
    expect(page).toContain(credit);
  }),
  { timeout: 120_000 },
);

test(
  'every lesson: chips for its topic with itself current, the next lesson, and the footer',
  Effect.gen(function* () {
    for (const [i, l] of lessons.entries()) {
      const page = yield* html(l.path);
      expect(page, l.path).toMatch(
        new RegExp(`href="${l.path}"[^>]*aria-current="page"[^>]*>\\s*${l.chip ?? l.title}\\s*<`),
      );
      expect(page.match(/<nav class="chips"[\s\S]*?<\/nav>/)?.[0].match(/<a /g), l.path).toHaveLength(
        l.topic.lessons.length + 1,
      );
      const next = lessons[i + 1];
      if (next && next.topic === l.topic) expect(page, l.path).toContain(`href="${next.path}"`);
      expect(page, l.path).toContain(credit);
    }
  }),
  { timeout: 120_000 },
);

test(
  'served pages use plain statements (see AGENTS.md "Writing")',
  Effect.gen(function* () {
    for (const path of ['/', ...lessons.map((l) => l.path)]) {
      const text = (yield* html(path)).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>/g, ' ');
      expect(text, path).not.toMatch(/\bNeither\b|, not (a|an|the) |is the lesson|slide's word/);
    }
  }),
  { timeout: 120_000 },
);

test(
  "a topic's API answers below its path; an unknown topic has none",
  Effect.gen(function* () {
    const url = yield* base;
    const ok = yield* Test.getWhenReady(`${url}/sample/api/hello`);
    expect(ok.status).toBe(200);
    expect(ok.headers['x-time-ms']).toBeDefined();
    expect((yield* HttpClient.get(`${url}/nope/api/x`)).status).toBe(404);
  }),
  { timeout: 120_000 },
);
