// Scaffold a lesson: pnpm run new-lesson <topic-slug> <lesson-slug> "Lesson title"
// Adds the lesson to src/site.json (and the topic, if it is new), writes the page skeleton
// at src/pages/<topic>/<lesson>.astro, and starts src/topics/<topic>/ (TOPIC.md, server.ts) for a new topic.
// A new topic gets a "Start here" lesson first, because every topic opens by defining its terms.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type Lesson = { path: string; title?: string; chip?: string; blurb?: string };
export type Topic = { slug: string; lessons: Lesson[]; [field: string]: unknown };
export type Catalogue = { topics: Topic[]; [field: string]: unknown };

// Pure: the catalogue with the lesson added. Throws on a bad slug or a lesson that exists.
export function addLesson(
  catalogue: Catalogue,
  { topic, lesson, title }: { topic: string; lesson: string; title: string },
): Catalogue {
  if (!SLUG.test(topic) || !SLUG.test(lesson)) throw new Error("slugs are lower-case words joined by hyphens");
  const path = `/${topic}/${lesson}/`;
  const topics: Topic[] = catalogue.topics.map((t) => ({ ...t, lessons: [...t.lessons] }));
  let entry = topics.find((t) => t.slug === topic);
  if (!entry) {
    entry = {
      slug: topic, emoji: "🧪", title: "TODO: Pattern One vs Pattern Two",
      summary: "TODO: the design question in one or two sentences, and what the lessons measure.",
      source: `src/topics/${topic}`,
      lessons: lesson === "start" ? [] : [{ path: `/${topic}/start/`, title: "Start here: the problem and the patterns", chip: "Start here",
        blurb: "TODO: what the reader will understand after this page." }],
    };
    topics.push(entry);
  }
  if (entry.lessons.some((l) => l.path === path)) throw new Error(`${path} already exists`);
  entry.lessons.push({ path, title, chip: title, blurb: "TODO: one sentence on what the reader will do and see." });
  return { ...catalogue, topics };
}

const attr = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
const page = (title: string, start: boolean) => `---
import Lesson from '../../layouts/Lesson.astro';

export const prerender = true;
---

<Lesson title="${attr(title)}"${start ? " prose" : ""}>
  <h1>${title}</h1>
  <p class="lead">
    TODO: the question this lesson answers, both patterns in one sentence each (name them, colour them with
    <code>&lt;strong data-color="..."&gt;</code>), what to try, and a link back to Start here for the terms.
  </p>
  <!-- See AGENTS.md "Lesson anatomy". Complete lessons: https://github.com/greg-m-k/apollo-lnl and https://github.com/greg-m-k/useeffect-lnl. -->
</Lesson>
`;

const server = (slug: string) => `// ${slug} topic · placeholder server code. Replace it with the real code your patterns call.
// It answers everything below /${slug}/api/. Report the server's own time in x-time-ms, so lesson pages can draw
// measured timelines.
export async function handle(request: Request) {
  const started = Date.now();
  const path = new URL(request.url).pathname;
  if (path !== "/${slug}/api/hello") return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ hello: "TODO: replace with your topic's real endpoint" },
    { headers: { "x-time-ms": String(Date.now() - started), "cache-control": "no-store" } });
}
`;

const topicDoc = (slug: string) => `# TODO: Pattern One vs Pattern Two

Where everything for the \`${slug}\` topic lives:

- Pages: \`src/pages/${slug}/<lesson>.astro\`
- Pattern code the browser runs: \`src/topics/${slug}/patterns/<pattern>.ts\`, one standalone file per pattern
- Server code: \`src/topics/${slug}/server.ts\`, served at \`/${slug}/api/...\`
- Talk track for presenting it: \`src/topics/${slug}/FACILITATION.md\`

## The question
TODO

## The patterns
TODO: one paragraph each: what it does, what you get, what it costs.

## Glossary
TODO: every term a senior engineer from another field might not know.

## Lessons and the claim each one proves
| Lesson | Claim | The switch or slider that shows it | What is measured |
|---|---|---|---|
`;

function main([topic, lesson, title]: string[]) {
  if (!topic || !lesson || !title) {
    console.error('usage: pnpm run new-lesson <topic-slug> <lesson-slug> "Lesson title"');
    process.exit(2);
  }
  const root = new URL("../", import.meta.url);
  const file = new URL("src/site.json", root);
  const before: Catalogue = JSON.parse(readFileSync(file, "utf8"));
  const isNewTopic = !before.topics.some((t) => t.slug === topic);
  const after = addLesson(before, { topic, lesson, title });
  const written: string[] = [];
  const write = (path: string, text: string) => {
    const url = new URL(path, root);
    if (existsSync(url)) return;
    mkdirSync(new URL(".", url), { recursive: true });
    writeFileSync(url, text);
    written.push(path);
  };
  for (const l of after.topics.find((t) => t.slug === topic)!.lessons) {
    write(`src/pages${l.path.slice(0, -1)}.astro`, page(l.title ?? l.path, l.path.endsWith("/start/")));
  }
  if (isNewTopic) {
    write(`src/topics/${topic}/TOPIC.md`, topicDoc(topic));
    write(`src/topics/${topic}/server.ts`, server(topic));
  }
  writeFileSync(file, `${JSON.stringify(after, null, 2)}\n`);
  console.log(["src/site.json", ...written].map((f) => `wrote ${f}`).join("\n"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
