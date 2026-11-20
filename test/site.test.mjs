// The catalogue, the files it points at, the scaffold and the sample topic's server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { addLesson } from "../scripts/new-lesson.mjs";
import { handle } from "../topics/sample/api.js";
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

test("sample topic: ships as a placeholder, with no example content to delete", () => {
  assert.deepEqual(catalogue.topics.map((t) => t.slug), ["sample"]);
  assert.equal(catalogue.topics[0].title, "Sample topic");
  assert.ok(!existsSync(new URL("public/requests", root)) && !existsSync(new URL("topics/requests", root)));
});

test("sample api: answers below its topic and reports its own time", async () => {
  const ok = await handle(new Request("https://x/sample/api/hello"));
  assert.equal(ok.status, 200);
  assert.ok(ok.headers.has("x-time-ms"));
  assert.equal((await handle(new Request("https://x/sample/api/nope"))).status, 404);
});

test("site worker: a topic owns everything below /<slug>/: its API, the site frame, its pages", async () => {
  const env = { ASSETS: { fetch: (r) => new Response(`asset ${new URL(r.url).pathname}`) } };
  const get = (path) => worker.fetch(new Request(`https://x${path}`), env);
  assert.equal(await (await get("/sample/lesson/")).text(), "asset /sample/lesson/");
  assert.equal((await get("/sample/api/hello")).status, 200);
  assert.equal((await get("/nope/api/x")).status, 404);
  // The frame has one copy in public/ and is served below every topic, so a hub can forward /<slug>/* alone.
  assert.equal(await (await get("/sample/site/styles.css")).text(), "asset /styles.css");
  assert.equal(await (await get("/sample/site/lib/ui.js")).text(), "asset /lib/ui.js");
  assert.equal(await (await get("/sample/site/topics.json")).text(), "asset /topics.json");
});

// The Node version is declared once, in package.json; workflows read it from there.
test("node: package.json declares the version, and every workflow takes it from package.json", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  assert.match(pkg.engines?.node ?? "", /^>=26\./, "engines.node");
  assert.equal(pkg.devEngines?.runtime?.name, "node");
  assert.match(pkg.devEngines?.runtime?.version ?? "", /^\^26\./, "devEngines.runtime.version");
  const dir = new URL(".github/workflows/", root);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".yml"))) {
    const yml = readFileSync(new URL(file, dir), "utf8");
    // pnpm/setup installs Node from devEngines.runtime and pnpm from devEngines.packageManager when given neither.
    assert.doesNotMatch(yml, /^\s*(node-version|node-version-file|runtime|version):/m, `${file} names a version itself`);
    assert.doesNotMatch(yml, /actions\/setup-node@/, `${file}: pnpm/setup installs Node`);
    assert.match(yml, /uses: pnpm\/setup@v3/, `${file}: sets up pnpm and Node`);
  }
});

test("pnpm: package.json pins it, the lockfile is pnpm's, and no workflow calls npm or npx", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  assert.equal(pkg.devEngines?.packageManager?.name, "pnpm");
  assert.match(pkg.devEngines?.packageManager?.version ?? "", /^\^12\./, "devEngines.packageManager.version");
  assert.equal(pkg.packageManager, undefined, "one source: devEngines.packageManager only");
  assert.ok(existsSync(new URL("pnpm-lock.yaml", root)), "pnpm-lock.yaml");
  assert.ok(!existsSync(new URL("package-lock.json", root)), "no package-lock.json");
  const dir = new URL(".github/workflows/", root);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".yml"))) {
    const yml = readFileSync(new URL(file, dir), "utf8");
    assert.doesNotMatch(yml, /\bnpm (ci|install|test|run)\b|\bnpx\b|cache: npm/, file);
  }
});

// Every command a person or CI runs is a package.json script, so `pnpm run` lists all of them.
test("scripts: workflows and docs run package.json scripts, never a tool directly", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  for (const name of ["dev", "test", "ui", "new-lesson", "deploy", "deploy:preview", "login", "d1:create", "queues:create"]) {
    assert.ok(pkg.scripts[name], `script ${name}`);
  }
  const dir = new URL(".github/workflows/", root);
  const files = [...readdirSync(dir).filter((f) => f.endsWith(".yml")).map((f) => new URL(f, dir)),
    new URL("README.md", root), new URL("AGENTS.md", root)];
  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /pnpm exec|pnpm wrangler/, file.pathname.split("/").pop());
  }
});

test("every lesson page loads the frame and calls its API below its own topic", () => {
  for (const t of catalogue.topics) for (const l of t.lessons) {
    const html = readFileSync(new URL(`public${l.path}index.html`, root), "utf8");
    const paths = [...html.matchAll(/(?:href=|src=|from )["'`](\/[^"'`$]*)/g)].map((m) => m[1]).filter((p) => p !== "/");
    for (const p of paths) assert.ok(p.startsWith(`/${t.slug}/`), `${l.path} uses ${p}`);
  }
});
