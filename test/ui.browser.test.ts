// The lesson helpers in src/lib/ui.ts, in a real Chrome: they use Graffiti's classes and tokens, and nothing else.
import { expect, test } from 'vitest';
import { logger, say, timeline } from '../src/lib/ui.ts';
import '../src/styles/theme.css';

test('say: a status line is a Graffiti tag, one variant per kind', () => {
  const node = document.createElement('span');
  say(node, 'Running', 'wait');
  expect(node.className).toBe('tag warning');
  say(node, 'Done', 'ok');
  expect(node.className).toBe('tag success');
  say(node, 'Failed', 'err');
  expect(node.className).toBe('tag error');
  say(node, 'Idle');
  expect(node.className).toBe('tag muted');
  expect(node.textContent).toBe('Idle');
});

test('logger: each line carries its kind as a mark in the text, with no class', () => {
  const pre = document.createElement('pre');
  const log = logger(pre);
  expect(pre.textContent).toBe('Nothing logged yet');
  log.log('fetched', 'ok');
  log.log('refused', 'err');
  log.log('plain');
  const lines = [...pre.children];
  expect(lines.map((l) => l.className)).toEqual(['', '', '']);
  expect(lines[0]?.textContent).toMatch(/✓ fetched$/);
  expect(lines[1]?.textContent).toMatch(/✗ refused$/);
  expect(lines[2]?.textContent).toMatch(/ {2}plain$/);
});

test('timeline: an SVG chart, each bar placed by its measured start and length and coloured by a Graffiti hue', () => {
  const box = document.createElement('div');
  document.body.replaceChildren(box);
  timeline(box, [
    { name: 'sequential', start: 0, end: 400, color: 'blue' },
    { name: 'parallel', start: 100, end: 200, color: 'green', failed: true },
  ]);
  const svg = box.querySelector('svg');
  expect(svg).not.toBeNull();
  const bars = [...box.querySelectorAll('rect[data-lane]')];
  expect(bars.map((b) => b.getAttribute('data-lane'))).toEqual(['sequential', 'parallel']);
  // The scale fits the slowest lane (400ms), so the second bar starts a quarter of the way along at a quarter's length.
  const [first, second] = bars.map((b) => ({
    x: Number(b.getAttribute('x')),
    width: Number(b.getAttribute('width')),
  }));
  expect(second?.width).toBeCloseTo((first?.width ?? 0) / 4);
  expect((second?.x ?? 0) - (first?.x ?? 0)).toBeCloseTo((first?.width ?? 0) / 4);
  expect(bars[0]?.getAttribute('style')).toBe('fill: var(--blue)');
  expect(bars[1]?.getAttribute('style')).toBe('fill: var(--error)');
  expect(box.textContent).toContain('400ms');
  // No stylesheet involved: the chart draws with SVG attributes and Graffiti's tokens alone.
  expect(box.querySelectorAll('[class]')).toHaveLength(0);
});
