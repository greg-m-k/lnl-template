// The catalogue and the files it points at, and the scaffold.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { addLesson } from '../scripts/new-lesson.ts';
import catalogue from '../src/site.json';

const root = new URL('../', import.meta.url);

test('catalogue: slugs are unique and every topic opens with Start here', () => {
  const slugs = catalogue.topics.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const t of catalogue.topics) assert.equal(t.lessons[0].path, `/${t.slug}/start/`, t.slug);
});

test('catalogue: every lesson has a page in the Lesson layout, and every topic its source folder', () => {
  for (const t of catalogue.topics) {
    assert.ok(existsSync(new URL(t.source, root)), t.source);
    for (const l of t.lessons) {
      const page = readFileSync(new URL(`src/pages${l.path.slice(0, -1)}.astro`, root), 'utf8');
      assert.match(page, /import Lesson from ['"][./]*layouts\/Lesson\.astro['"]/, l.path);
    }
  }
});

// The scaffold tests use a fixed catalogue, so they hold whatever topics the repository grows.
const sample = {
  title: 't',
  topics: [
    { slug: 'requests', lessons: [{ path: '/requests/start/' }, { path: '/requests/race/' }] },
  ],
};

test('scaffold: a lesson in a new topic adds the topic with Start here first', () => {
  const after = addLesson(sample, {
    topic: 'caching',
    lesson: 'stale',
    title: 'When the cache is stale',
  });
  const topic = after.topics.at(-1);
  assert.ok(topic, 'a topic was added');
  assert.equal(topic.slug, 'caching');
  assert.deepEqual(
    topic.lessons.map((l) => l.path),
    ['/caching/start/', '/caching/stale/'],
  );
  assert.equal(sample.topics.length + 1, after.topics.length, 'the input is not changed');
});

test('scaffold: refuses a duplicate lesson and a bad slug', () => {
  assert.throws(
    () => addLesson(sample, { topic: 'requests', lesson: 'race', title: 'x' }),
    /already exists/,
  );
  assert.throws(() => addLesson(sample, { topic: 'Requests!', lesson: 'x', title: 'x' }), /slugs/);
});
