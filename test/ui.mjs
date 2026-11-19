// Drive the site in a real browser and check what a visitor sees.
// npm run dev, then: npm run ui   (BASE=https://your.domain npm run ui for production)
// Uses the installed Edge; set CHANNEL=chrome to use Chrome.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:8800";
const catalogue = JSON.parse(readFileSync(new URL("../public/topics.json", import.meta.url), "utf8"));
const lessons = catalogue.topics.flatMap((t) => t.lessons);
let browser, page;
const errors = [];

before(async () => {
  browser = await chromium.launch({ channel: process.env.CHANNEL ?? "msedge" });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/status of 503/.test(m.text()) && errors.push(`${m.text()} at ${m.location().url}`));
});
after(() => browser?.close());

test("home: one card per lesson, grouped by topic", async () => {
  await page.goto(BASE);
  await page.waitForSelector(".card");
  assert.equal(await page.locator(".topic").count(), catalogue.topics.length);
  assert.equal(await page.locator(".card").count(), lessons.length);
  assert.equal(await page.locator(`header a[href="${catalogue.origin.url}"]`).count(), 1, "credits where the format comes from");
});

test("every lesson: chips for its topic with itself marked current", async () => {
  for (const l of lessons) {
    await page.goto(BASE + l.path);
    await page.waitForSelector(".chips");
    assert.equal(await page.textContent('.chips [aria-current="page"]'), l.chip ?? l.title, l.path);
  }
});

test("every lesson: each request it makes stays below its topic's path, so a hub can mount the topic", async () => {
  for (const t of catalogue.topics) for (const l of t.lessons) {
    const seen = [];
    const record = (r) => { const u = new URL(r.url()); if (u.origin === new URL(BASE).origin) seen.push(u.pathname); };
    page.on("request", record);
    await page.goto(BASE + l.path);
    await page.waitForSelector(".chips");
    if (await page.locator("#run").count()) await page.click("#run");  // a lesson's run button calls its API
    await page.waitForLoadState("networkidle");
    page.off("request", record);
    for (const p of seen) assert.ok(p.startsWith(`/${t.slug}/`), `${l.path} requested ${p}`);
  }
});

test("every page fits a phone screen without sideways scrolling", async () => {
  await page.setViewportSize({ width: 390, height: 800 });
  for (const path of ["/", ...lessons.map((l) => l.path)]) {
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, path);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("footers credit the author and pages use plain statements", async () => {
  for (const path of ["/", ...lessons.map((l) => l.path)]) {
    await page.goto(BASE + path);
    await page.waitForSelector("footer");
    assert.equal(await page.textContent("footer"), `Made by ${catalogue.author.name}.`, path);
    assert.doesNotMatch(await page.textContent("main"), /\bNeither\b|, not (a|an|the) |is the lesson|slide's word/, path);
  }
});

test("nothing logged an error", () => {
  assert.deepEqual(errors, []);
});
