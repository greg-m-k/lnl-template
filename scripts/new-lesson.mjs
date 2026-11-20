// Scaffold a lesson: pnpm new-lesson <topic-slug> <lesson-slug> "Lesson title"
// Adds the lesson to public/topics.json (and the topic, if it is new), writes the page skeleton
// at public/<topic>/<lesson>/index.html, and starts topics/<topic>/TOPIC.md for a new topic.
// A new topic gets a "Start here" lesson first, because every topic opens by defining its terms.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Pure: the catalogue with the lesson added. Throws on a bad slug or a lesson that exists.
export function addLesson(catalogue, { topic, lesson, title }) {
  if (!SLUG.test(topic) || !SLUG.test(lesson)) throw new Error("slugs are lower-case words joined by hyphens");
  const path = `/${topic}/${lesson}/`;
  const topics = catalogue.topics.map((t) => ({ ...t, lessons: [...t.lessons] }));
  let entry = topics.find((t) => t.slug === topic);
  if (!entry) {
    entry = {
      slug: topic, emoji: "🧪", title: "TODO: Pattern One vs Pattern Two",
      summary: "TODO: the design question in one or two sentences, and what the lessons measure.",
      source: `topics/${topic}`,
      lessons: lesson === "start" ? [] : [{ path: `/${topic}/start/`, title: "Start here: the problem and the patterns", chip: "Start here",
        blurb: "TODO: what the reader will understand after this page." }],
    };
    topics.push(entry);
  }
  if (entry.lessons.some((l) => l.path === path)) throw new Error(`${path} already exists`);
  entry.lessons.push({ path, title, chip: title, blurb: "TODO: one sentence on what the reader will do and see." });
  return { ...catalogue, topics };
}

const page = (slug, title, start) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Lunch & Learn</title>
<link rel="stylesheet" href="/${slug}/site/styles.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='9' cy='16' r='6' fill='%232563eb'/%3E%3Ccircle cx='23' cy='16' r='6' fill='%2316a34a'/%3E%3C/svg%3E">
</head>
<body>
<main${start ? ' class="prose"' : ""}>
  <h1>${title}</h1>
  <p class="lead">TODO: the question this lesson answers, both patterns in one sentence each (name them, colour them with
    <code>&lt;strong data-color="..."&gt;</code>), what to try, and a link back to Start here for the terms.</p>
  <!-- See AGENTS.md "Lesson anatomy". Complete lessons: https://github.com/greg-m-k/apollo-lnl and https://github.com/greg-m-k/useeffect-lnl. -->
</main>
<script type="module">import { lesson } from "/${slug}/site/lib/site.js"; lesson(document.querySelector("main"));</script>
</body>
</html>
`;

const topicDoc = (slug) => `# TODO: Pattern One vs Pattern Two

Where everything for the \`${slug}\` topic lives:

- Pages: \`public/${slug}/<lesson>/index.html\`
- Pattern code the browser runs: \`public/${slug}/patterns/<pattern>.js\`, one standalone file per pattern
- Server code: \`topics/${slug}/api.js\`, registered in \`src/index.js\`
- Talk track for presenting it: \`topics/${slug}/FACILITATION.md\`

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

function main([topic, lesson, title]) {
  if (!topic || !lesson || !title) {
    console.error('usage: pnpm new-lesson <topic-slug> <lesson-slug> "Lesson title"');
    process.exit(2);
  }
  const root = new URL("../", import.meta.url);
  const file = new URL("public/topics.json", root);
  const before = JSON.parse(readFileSync(file, "utf8"));
  const isNewTopic = !before.topics.some((t) => t.slug === topic);
  const after = addLesson(before, { topic, lesson, title });
  const written = [];
  for (const l of after.topics.find((t) => t.slug === topic).lessons) {
    const dir = new URL(`public${l.path}`, root);
    if (existsSync(new URL("index.html", dir))) continue;
    mkdirSync(dir, { recursive: true });
    writeFileSync(new URL("index.html", dir), page(topic, l.title, l.path.endsWith("/start/")));
    written.push(`public${l.path}index.html`);
  }
  if (isNewTopic) {
    mkdirSync(new URL(`topics/${topic}/`, root), { recursive: true });
    writeFileSync(new URL(`topics/${topic}/TOPIC.md`, root), topicDoc(topic));
    written.push(`topics/${topic}/TOPIC.md`);
  }
  writeFileSync(file, `${JSON.stringify(after, null, 2)}\n`);
  console.log(["public/topics.json", ...written].map((f) => `wrote ${f}`).join("\n"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
