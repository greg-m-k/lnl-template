// The catalogue, the files it points at, the scaffold and the sample topic's server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { addLesson } from "../scripts/new-lesson.mjs";
import { parseWork, handle } from "../topics/requests/api.js";
import worker from "../src/index.js";

const root = new URL("../", import.meta.url);
const catalogue = JSON.parse(readFileSync(new URL("public/topics.json", root), "utf8"));

test("catalogue: slugs are unique and every topic opens with Start here", () => {
  const slugs = catalogue.topics.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const t of catalogue.topics) assert.equal(t.lessons[0].path, `/${t.slug}/start/`, t.slug);
});

test("catalogue: every lesson has a page that draws the site frame, and every topic its source folder", () => {
  for (const t of catalogue.topics) {
    assert.ok(existsSync(new URL(t.source, root)), t.source);
    for (const l of t.lessons) {
      const html = readFileSync(new URL(`public${l.path}index.html`, root), "utf8");
      assert.ok(new RegExp(`import \\{[^}]*lesson[^}]*\\} from "/${t.slug}/site/lib/site\\.js"`).test(html), l.path);
    }
  }
});

// The scaffold tests use a fixed catalogue, so they hold whatever topics the repository grows.
const sample = { title: "t", topics: [{ slug: "requests", lessons: [{ path: "/requests/start/" }, { path: "/requests/race/" }] }] };

test("scaffold: a lesson in a new topic adds the topic with Start here first", () => {
  const after = addLesson(sample, { topic: "caching", lesson: "stale", title: "When the cache is stale" });
  const topic = after.topics.at(-1);
  assert.equal(topic.slug, "caching");
  assert.deepEqual(topic.lessons.map((l) => l.path), ["/caching/start/", "/caching/stale/"]);
  assert.equal(sample.topics.length + 1, after.topics.length, "the input is not changed");
});

test("scaffold: refuses a duplicate lesson and a bad slug", () => {
  assert.throws(() => addLesson(sample, { topic: "requests", lesson: "race", title: "x" }), /already exists/);
  assert.throws(() => addLesson(sample, { topic: "Requests!", lesson: "x", title: "x" }), /slugs/);
});

test("requests api: parses and clamps the query at the boundary", () => {
  assert.deepEqual(parseWork("https://x/requests/api/work?name=user&ms=300"), { name: "user", ms: 300, fail: false });
  assert.equal(parseWork("https://x/requests/api/work?ms=99999").ms, 3000);
  assert.equal(parseWork("https://x/requests/api/work?ms=-5").ms, 0);
  assert.equal(parseWork("https://x/requests/api/work?fail=1").fail, true);
  assert.ok(parseWork("https://x/requests/api/work?ms=abc").error);
});

test("requests api: really waits, then answers or fails", async () => {
  const t0 = Date.now();
  const ok = await handle(new Request("https://x/requests/api/work?name=user&ms=120"));
  assert.ok(Date.now() - t0 >= 110);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).name, "user");
  const failed = await handle(new Request("https://x/requests/api/work?name=orders&ms=0&fail=1"));
  assert.equal(failed.status, 503);
});

test("site worker: a topic owns everything below /<slug>/: its API, the site frame, its pages", async () => {
  const env = { ASSETS: { fetch: (r) => new Response(`asset ${new URL(r.url).pathname}`) } };
  const get = (path) => worker.fetch(new Request(`https://x${path}`), env);
  assert.equal(await (await get("/requests/race/")).text(), "asset /requests/race/");
  assert.equal((await get("/requests/api/work?ms=0")).status, 200);
  assert.equal((await get("/nope/api/x")).status, 404);
  // The frame has one copy in public/ and is served below every topic, so a hub can forward /<slug>/* alone.
  assert.equal(await (await get("/requests/site/styles.css")).text(), "asset /styles.css");
  assert.equal(await (await get("/requests/site/lib/ui.js")).text(), "asset /lib/ui.js");
  assert.equal(await (await get("/requests/site/topics.json")).text(), "asset /topics.json");
});

test("every lesson page loads the frame and calls its API below its own topic", () => {
  for (const t of catalogue.topics) for (const l of t.lessons) {
    const html = readFileSync(new URL(`public${l.path}index.html`, root), "utf8");
    const paths = [...html.matchAll(/(?:href=|src=|from )["'`](\/[^"'`$]*)/g)].map((m) => m[1]).filter((p) => p !== "/");
    for (const p of paths) assert.ok(p.startsWith(`/${t.slug}/`), `${l.path} uses ${p}`);
  }
});
