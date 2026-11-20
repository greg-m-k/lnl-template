// The catalogue, the files it points at, the scaffold and the sample topic's server.
import { test } from "vitest";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { addLesson } from "../scripts/new-lesson.ts";
import { handle } from "../src/topics/sample/server.ts";

import catalogue from "../src/site.json";

const root = new URL("../", import.meta.url);

test("catalogue: slugs are unique and every topic opens with Start here", () => {
  const slugs = catalogue.topics.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const t of catalogue.topics) assert.equal(t.lessons[0].path, `/${t.slug}/start/`, t.slug);
});

test("catalogue: every lesson has a page in the Lesson layout, and every topic its source folder", () => {
  for (const t of catalogue.topics) {
    assert.ok(existsSync(new URL(t.source, root)), t.source);
    for (const l of t.lessons) {
      const page = readFileSync(new URL(`src/pages${l.path.slice(0, -1)}.astro`, root), "utf8");
      assert.match(page, /import Lesson from ['"][./]*layouts\/Lesson\.astro['"]/, l.path);
    }
  }
});

// The scaffold tests use a fixed catalogue, so they hold whatever topics the repository grows.
const sample = { title: "t", topics: [{ slug: "requests", lessons: [{ path: "/requests/start/" }, { path: "/requests/race/" }] }] };

test("scaffold: a lesson in a new topic adds the topic with Start here first", () => {
  const after = addLesson(sample, { topic: "caching", lesson: "stale", title: "When the cache is stale" });
  const topic = after.topics.at(-1)!;
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
  assert.ok(!existsSync(new URL("src/pages/requests", root)) && !existsSync(new URL("src/topics/requests", root)));
});

test("sample api: answers below its topic and reports its own time", async () => {
  const ok = await handle(new Request("https://x/sample/api/hello"));
  assert.equal(ok.status, 200);
  assert.ok(ok.headers.has("x-time-ms"));
  assert.equal((await handle(new Request("https://x/sample/api/nope"))).status, 404);
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
  for (const name of ["dev", "test", "new-lesson", "login", "deploy", "destroy"]) {
    assert.ok(pkg.scripts[name], `script ${name}`);
  }
  // Cloudflare is set up by Alchemy (alchemy.run.ts); wrangler is not used.
  assert.ok(!Object.values(pkg.scripts).some((s) => /\bwrangler\b/.test(String(s))), "no wrangler script");
  assert.ok(!pkg.devDependencies?.wrangler && !existsSync(new URL("wrangler.jsonc", root)), "no wrangler");
  const dir = new URL(".github/workflows/", root);
  const files = [...readdirSync(dir).filter((f) => f.endsWith(".yml")).map((f) => new URL(f, dir)),
    new URL("README.md", root), new URL("AGENTS.md", root)];
  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /pnpm exec|pnpm wrangler/, file.pathname.split("/").pop() ?? "");
  }
});

test("typescript: every source file is TypeScript, and `check` type-checks them", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  assert.match(pkg.scripts.check ?? "", /astro check/);
  const js: string[] = [];
  for (const dir of ["src", "scripts", "test"]) {
    for (const f of readdirSync(new URL(`${dir}/`, root), { recursive: true, encoding: "utf8" })) {
      if (/\.(m?js)$/.test(f)) js.push(`${dir}/${f}`);
    }
  }
  assert.deepEqual(js, []);
});

test("ci: least-privilege token, one run per change, cancelled when superseded", () => {
  const ci = readFileSync(new URL(".github/workflows/ci.yml", root), "utf8");
  assert.match(ci, /^permissions:\n\s+contents: read\n/m, "top-level permissions: contents: read");
  assert.match(ci, /^concurrency:\n\s+group: ci-\$\{\{ github\.ref \}\}\n\s+cancel-in-progress: true\n/m);
  assert.match(ci, /^on:\n\s+push:\n\s+branches: \[main\]\n\s+pull_request:\n/m, "push to main and pull requests only");
});

test("renovate: held a few days, weekly, beta packages pinned in a group of their own", () => {
  type Rule = { groupName?: string; rangeStrategy?: string; matchPackageNames: string[] };
  const cfg: { minimumReleaseAge?: string; schedule?: string[]; packageRules?: Rule[] } = JSON.parse(
    readFileSync(new URL("renovate.json", root), "utf8"),
  );
  assert.match(cfg.minimumReleaseAge ?? "", /^\d+ days$/);
  assert.ok(cfg.schedule?.length, "a schedule");
  const own = cfg.packageRules?.find((r) => r.groupName === "alchemy and graffiti");
  assert.ok(own, "alchemy and graffiti in their own group");
  assert.equal(own.rangeStrategy, "pin");
  for (const name of ["alchemy", "@alchemy.run/cloudflare", "@drop-in/graffiti"]) {
    assert.ok(own.matchPackageNames.some((p) => p === name || (p.startsWith("/") && new RegExp(p.slice(1, -1)).test(name))), name);
  }
});
