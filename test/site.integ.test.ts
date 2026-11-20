// Boots the real stack (alchemy.run.ts) locally with Alchemy's test harness and drives it over HTTP.
// dev: true runs it in workerd with local simulators, so no Cloudflare account is touched.
import { readFileSync } from 'node:fs';
import * as Cloudflare from '@alchemy.run/cloudflare';
import * as Test from '@alchemy.run/test/Vitest';
import { expect } from '@effect/vitest';
import * as Alchemy from 'alchemy';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import Stack from '../alchemy.run.ts';

const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  state: Alchemy.localState(),
  dev: true,
});

const stack = beforeAll(deploy(Stack), { timeout: 300_000 });
afterAll(destroy(Stack));

const base = Effect.map(stack, ({ url }) => url.replace(/\/+$/, ''));

test(
  'serves every page, the site frame and the topic API below the topic path',
  Effect.gen(function* () {
    const url = yield* base;
    const expected: Array<[string, string]> = [
      ['/', 'text/html'],
      ['/sample/start/', 'text/html'],
      ['/sample/lesson/', 'text/html'],
      ['/sample/site/styles.css', 'text/css'],
      ['/sample/site/lib/site.js', 'javascript'],
      ['/sample/api/hello', 'application/json'],
    ];
    for (const [path, type] of expected) {
      const res = yield* Test.getWhenReady(`${url}${path}`);
      expect(res.status, path).toBe(200);
      expect(res.headers['content-type'], path).toContain(type);
    }
  }),
  { timeout: 120_000 },
);

test(
  'the site frame below a topic is the one copy in public/',
  Effect.gen(function* () {
    const url = yield* base;
    const res = yield* Test.getWhenReady(`${url}/sample/site/topics.json`);
    expect(yield* res.text).toBe(readFileSync(new URL('../public/topics.json', import.meta.url), 'utf8'));
  }),
  { timeout: 120_000 },
);

test(
  'served pages use plain statements (see AGENTS.md "Writing")',
  Effect.gen(function* () {
    const url = yield* base;
    const site = JSON.parse(readFileSync(new URL('../public/topics.json', import.meta.url), 'utf8'));
    const paths = ['/', ...site.topics.flatMap((t: { lessons: { path: string }[] }) => t.lessons.map((l) => l.path))];
    for (const path of paths) {
      const html = yield* (yield* Test.getWhenReady(`${url}${path}`)).text;
      const text = html.replace(/<script[\s\S]*?<\/script>|<!--[\s\S]*?-->|<[^>]+>/g, ' ');
      expect(text, path).not.toMatch(/\bNeither\b|, not (a|an|the) |is the lesson|slide's word/);
    }
  }),
  { timeout: 120_000 },
);

test(
  'an unknown topic has no API',
  Effect.gen(function* () {
    const url = yield* base;
    const res = yield* HttpClient.get(`${url}/nope/api/x`);
    expect(res.status).toBe(404);
  }),
  { timeout: 120_000 },
);
