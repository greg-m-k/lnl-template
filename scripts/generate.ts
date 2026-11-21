import { NodeRuntime, NodeServices } from '@effect/platform-node';
import { Console, Effect, FileSystem, Schema } from 'effect';
import { Argument, CliError, Command, Prompt } from 'effect/cli';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../src/site.json' with { type: 'json' };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type Lesson = { path: string; title?: string; chip?: string; blurb?: string };
export type Topic = { slug: string; lessons: Lesson[]; [field: string]: unknown };
export type Catalogue = { topics: Topic[]; [field: string]: unknown };

export function addLesson(
  catalogue: Catalogue,
  { topic, lesson, title }: { topic: string; lesson: string; title: string },
): Catalogue {
  if (!SLUG.test(topic) || !SLUG.test(lesson))
    throw new Error('slugs are lower-case words joined by hyphens');
  const path = `/${topic}/${lesson}/`;
  const topics: Topic[] = catalogue.topics.map((t) => ({ ...t, lessons: [...t.lessons] }));
  let entry = topics.find((t) => t.slug === topic);
  if (!entry) {
    entry = {
      slug: topic,
      emoji: '🧪',
      title: 'TODO: Pattern One vs Pattern Two',
      summary: 'TODO: the design question in one or two sentences, and what the lessons measure.',
      source: `src/topics/${topic}`,
      lessons:
        lesson === 'start'
          ? []
          : [
              {
                path: `/${topic}/start/`,
                title: 'Start here: the problem and the patterns',
                chip: 'Start here',
                blurb: 'TODO: what the reader will understand after this page.',
              },
            ],
    };
    topics.push(entry);
  }
  if (entry.lessons.some((l) => l.path === path)) throw new Error(`${path} already exists`);
  entry.lessons.push({
    path,
    title,
    chip: title,
    blurb: 'TODO: one sentence on what the reader will do and see.',
  });
  return { ...catalogue, topics };
}

const root = fileURLToPath(new URL('../', import.meta.url));
const escapeAttr = (s: string) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const escapeText = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('{', '&#123;');

const Slug = Schema.String.pipe(
  Schema.check(Schema.isPattern(SLUG, { message: 'Use lower-case words joined by hyphens' })),
);
const slug = (name: string, description: string) =>
  Argument.String(name).pipe(
    Argument.withDescription(description),
    Argument.withFallbackPrompt(Prompt.String({ message: description })),
    Argument.withSchema(Slug),
  );

const generate = Command.make(
  'generate',
  {
    topic: slug('topic', 'Topic slug, such as retries-vs-fail-fast'),
    lesson: slug('lesson', 'Lesson slug, such as start or when-a-call-fails'),
    title: Argument.String('title').pipe(
      Argument.withDescription('Lesson title, such as "When a call fails"'),
      Argument.withFallbackPrompt(Prompt.String({ message: 'Lesson title' })),
      Argument.withSchema(Schema.NonEmptyString),
    ),
  },
  Effect.fn(function* ({ topic, lesson, title }) {
    const fs = yield* FileSystem.FileSystem;
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const isNewTopic = !site.topics.some((t) => t.slug === topic);
    const after = yield* Effect.try({
      try: () => addLesson(site, { topic, lesson, title }),
      catch: (cause) =>
        new CliError.UserError({
          cause,
          userMessage: cause instanceof Error ? cause.message : String(cause),
        }),
    });
    const entry = after.topics.find((t) => t.slug === topic);
    if (!entry) return yield* Effect.die(`${topic} is missing after adding it`);

    const fromTemplate = (name: string, pageTitle = '') =>
      fs
        .readFileString(`${root}scripts/templates/${name}.tpl`)
        .pipe(
          Effect.map((text) =>
            text
              .replaceAll('__TOPIC__', topic)
              .replaceAll('__TITLE_ATTR__', escapeAttr(pageTitle))
              .replaceAll('__TITLE__', escapeText(pageTitle)),
          ),
        );
    const written: string[] = [];
    const writeIfMissing = Effect.fn(function* (
      path: string,
      template: string,
      pageTitle: string = '',
    ) {
      if (yield* fs.exists(`${root}${path}`)) return;
      const content = yield* fromTemplate(template, pageTitle);
      yield* fs.makeDirectory(dirname(`${root}${path}`), { recursive: true });
      yield* fs.writeFileString(`${root}${path}`, content);
      written.push(path);
    });

    for (const l of entry.lessons) {
      const page = l.path === `/${topic}/start/` ? 'start.astro' : 'lesson.astro';
      yield* writeIfMissing(`src/pages${l.path.slice(0, -1)}.astro`, page, l.title ?? l.path);
    }
    yield* writeIfMissing(`src/topics/${topic}/patterns/example.ts`, 'example.ts');
    yield* writeIfMissing(`src/topics/${topic}/server.ts`, 'server.ts');
    yield* writeIfMissing(`src/topics/${topic}/TOPIC.md`, 'TOPIC.md');
    yield* writeIfMissing(`src/topics/${topic}/FACILITATION.md`, 'FACILITATION.md');
    yield* fs.writeFileString(`${root}src/site.json`, `${JSON.stringify(after, null, 2)}\n`);

    const format = ChildProcess.make(
      'pnpm',
      ['run', '--silent', 'format', 'src/site.json', ...written],
      {
        cwd: root,
      },
    );
    if ((yield* spawner.exitCode(format)) !== ChildProcessSpawner.ExitCode(0)) {
      return yield* new CliError.UserError({
        cause: 'format failed',
        userMessage: 'pnpm run format failed',
      });
    }

    yield* Console.log(['src/site.json', ...written].map((f) => `wrote ${f}`).join('\n'));
    return yield* Console.log(`
Next (AGENTS.md, "Adding a topic, step by step"):
${isNewTopic ? `  - Write the question, patterns, glossary and claims table in src/topics/${topic}/TOPIC.md.\n` : ''}\
  - Fill in the TODOs in src/site.json: the topic's title, emoji and summary, and each lesson's blurb.
  - Replace src/topics/${topic}/patterns/example.ts and src/topics/${topic}/server.ts with real code, test first.
  - Write src/pages/${topic}/${lesson}.astro to the lesson anatomy.
  - pnpm run dev to try it, then pnpm run lint, pnpm run check and pnpm run test before a pull request.`);
  }),
).pipe(Command.withDescription('Add a lesson, and its topic if the topic is new.'));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generate.pipe(
    Command.run({ version: '1.0.0' }),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  );
}
