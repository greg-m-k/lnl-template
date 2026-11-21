// Boots the real stack (alchemy.run.ts) locally with Alchemy's test harness and drives it over HTTP.
// dev: true runs it in workerd with local simulators, so no Cloudflare account is touched.
import * as Cloudflare from '@alchemy.run/cloudflare';
import * as Test from '@alchemy.run/test/Vitest';
import { expect } from '@effect/vitest';
import * as Alchemy from 'alchemy';
import { exportState, isResourceState } from 'alchemy/State';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as Schema from 'effect/Schema';
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
// The vetted links, one JSON file each (see AGENTS.md "Adding a link").
const links = Object.values(
  import.meta.glob<{ url: string }>('../src/links/*.json', { eager: true, import: 'default' }),
);
const credit = `Made by <a href="${site.author.url}">${site.author.name}</a>.`;

// What the hosted site may use from Cloudflare: products that run under `alchemy dev` with no account, and fit the
// Workers free plan (AGENTS.md, "Runs locally from a fresh clone"). Durable Objects are bindings, not resources.
const freeResources = new Set([
  'Cloudflare.Worker',
  'Cloudflare.KV.Namespace',
  'Cloudflare.D1Database',
  'Cloudflare.Queues.Queue',
  'Cloudflare.Queues.Consumer',
]);
const freeBindings = new Set([
  'assets',
  'kv_namespace',
  'd1',
  'queue',
  'durable_object_namespace',
  'service',
  'plain_text',
  'secret_text',
  'json',
  'version_metadata',
]);
// A resource's bindings, as Alchemy records them in state.
const Bindings = Schema.Struct({
  bindings: Schema.optional(Schema.Array(Schema.Struct({ type: Schema.String }))),
});

test(
  'home: one section per topic, one card per lesson, credits the origin and the author',
  Effect.gen(function* () {
    const page = yield* html('/');
    expect(page.match(/<section [^>]*aria-labelledby="topic-/g)).toHaveLength(site.topics.length);
    expect(page.match(/<a class="card\b[^"]*"/g)).toHaveLength(lessons.length + links.length);
    expect(page).toContain(`href="${site.origin.url}"`);
    expect(page).toContain(credit);
  }),
  { timeout: 120_000 },
);

test(
  'home: after the topics, an Elsewhere section with one card per vetted link',
  Effect.gen(function* () {
    const page = yield* html('/');
    expect(links.length).toBeGreaterThan(0);
    const elsewhere = page.match(
      /<section [^>]*aria-labelledby="elsewhere"[\s\S]*?<\/section>/,
    )?.[0];
    expect(elsewhere, 'an Elsewhere section').toBeDefined();
    expect(page.lastIndexOf('aria-labelledby="topic-')).toBeLessThan(page.indexOf(elsewhere ?? ''));
    expect(elsewhere?.match(/<a class="card\b[^"]*"/g)).toHaveLength(links.length);
    for (const l of links) expect(elsewhere, l.url).toContain(`href="${l.url}"`);
  }),
  { timeout: 120_000 },
);

test(
  'home: a last section links to CONTRIBUTING.md in the repository',
  Effect.gen(function* () {
    const page = yield* html('/');
    const section = page.match(
      /<section [^>]*aria-labelledby="contribute"[\s\S]*?<\/section>/,
    )?.[0];
    expect(section, 'an Add an example section').toBeDefined();
    expect(section).toContain(`href="${site.repo}/blob/main/CONTRIBUTING.md"`);
    expect(page.lastIndexOf('<section ')).toBe(page.indexOf(section ?? ''));
  }),
  { timeout: 120_000 },
);

test(
  'every lesson: chips for its topic with itself current, the next lesson, and the footer',
  Effect.gen(function* () {
    for (const [i, l] of lessons.entries()) {
      const page = yield* html(l.path);
      // The current lesson's chip is marked both for screen readers and for Graffiti's .selected style.
      expect(page, l.path).toMatch(
        new RegExp(
          `class="chip selected"[^>]*href="${l.path}"[^>]*aria-current="page"[^>]*>\\s*${l.chip ?? l.title}\\s*<`,
        ),
      );
      expect(
        page.match(/<nav [^>]*aria-label="[^"]* lessons"[\s\S]*?<\/nav>/)?.[0].match(/<a /g),
        l.path,
      ).toHaveLength(l.topic.lessons.length);
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
      const text = (yield* html(path)).replace(
        /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>/g,
        ' ',
      );
      expect(text, path).not.toMatch(/\bNeither\b|, not (a|an|the) |is the lesson|slide's word/);
    }
  }),
  { timeout: 120_000 },
);

test(
  'the deployed stack uses only free-plan Cloudflare products that run locally',
  Effect.gen(function* () {
    yield* stack;
    const { resources } = yield* exportState({ stack: 'lnl' });
    const deployed = resources.map((r) => r.state).filter(isResourceState);
    expect(deployed.length).toBeGreaterThan(0);
    for (const r of deployed) {
      expect(freeResources, `${r.fqn} is a ${r.resourceType}`).toContain(r.resourceType);
      for (const b of r.bindings) {
        for (const { type } of Schema.decodeUnknownSync(Bindings)(b.data).bindings ?? []) {
          expect(freeBindings, `${r.fqn} has a ${type} binding`).toContain(type);
        }
      }
    }
  }).pipe(Effect.provide(Alchemy.localState())),
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
