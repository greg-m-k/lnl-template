// Small DOM helpers for lesson pages. Plumbing only: no pattern under comparison lives here.
// They use Graffiti's classes and tokens and need no stylesheet of their own.
const MIN_SCALE_MS = 200;

export type Kind = 'ok' | 'err' | 'wait';
const MARK: Record<Kind, string> = { ok: '✓', err: '✗', wait: '…' };
const TAG: Record<Kind, string> = { ok: 'success', err: 'error', wait: 'warning' };
type Child = Node | string | null | undefined | false;
type Attrs = Record<string, string | boolean | null | undefined | EventListener>;

export const $ = (sel: string) => document.querySelector(sel);

export function el(tag: string, attrs: Attrs = {}, ...children: (Child | Child[])[]): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = String(v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  node.append(...children.flat().filter((c): c is Node | string => c != null && c !== false));
  return node;
}

// A console pane (a <pre>, e.g. inside Graffiti's .log-card): log(text, kind?) with kind "ok" | "err" | "wait",
// shown as a ✓, ✗ or … mark before the text.
export function logger(pre: HTMLElement) {
  pre.textContent = 'Nothing logged yet';
  let empty = true;
  return {
    log(text: string, kind?: Kind) {
      if (empty) {
        pre.textContent = '';
        empty = false;
      }
      const mark = kind === undefined ? '' : `${MARK[kind]} `;
      pre.append(el('div', {}, `${new Date().toLocaleTimeString()}  ${mark}${text}`));
      pre.scrollTop = pre.scrollHeight;
    },
    clear() {
      pre.textContent = 'Nothing logged yet';
      empty = true;
    },
  };
}

// A status line as a Graffiti tag: kind "ok" | "err" | "wait" is its success / error / warning variant; none is muted.
export function say(node: HTMLElement, text: string, kind: Kind | '' = '') {
  node.textContent = text;
  node.className = kind === '' ? 'tag muted' : `tag ${TAG[kind]}`;
}

// On/off switch buttons: pressed(button) reads one; press(button, on) sets it and marks it with ✕.
export const pressed = (button: HTMLElement) => button.getAttribute('aria-pressed') === 'true';
export function press(button: HTMLElement, on: boolean) {
  button.dataset.label ??= button.textContent ?? '';
  button.setAttribute('aria-pressed', String(on));
  button.textContent = `${button.dataset.label}${on ? ' ✕' : ''}`;
}

// A pattern keeps one Graffiti hue across its topic: its name, its panel's tag and its timeline bars.
export type Hue = 'blue' | 'green' | 'purple' | 'orange';

export type Lane = {
  name: string;
  start: number;
  end: number;
  color?: Hue;
  failed?: boolean;
  label?: string;
};

const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(tag: string, attrs: Record<string, string | number>, ...children: (Node | string)[]) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  node.append(...children);
  return node;
}

// A measured timeline, drawn as an SVG chart: one row per lane (name, bar, duration) and an axis. lanes are in ms
// from the start of the run; the scale fits the slowest lane. Text uses the page's colour; bars use Graffiti's hues.
export function timeline(container: HTMLElement, lanes: Lane[]) {
  const scale = Math.ceil(Math.max(MIN_SCALE_MS, ...lanes.map((l) => l.end)) / 100) * 100;
  const [width, nameWidth, msWidth, row, bar] = [1000, 180, 90, 36, 20];
  const trackX = nameWidth;
  const trackWidth = width - nameWidth - msWidth;
  const at = (ms: number) => trackX + (ms / scale) * trackWidth;
  const height = (lanes.length + 1) * row;
  const text = { fill: 'currentColor', 'dominant-baseline': 'middle', 'font-size': 18 };
  const rows = lanes.flatMap((l, i) => {
    const middle = i * row + row / 2;
    const top = middle - bar / 2;
    const ms = `${Math.round(l.start)}–${Math.round(l.end)} ms`;
    return [
      svg('text', { ...text, x: 0, y: middle }, l.name),
      svg('rect', {
        x: trackX,
        y: top,
        width: trackWidth,
        height: bar,
        rx: 4,
        fill: 'currentColor',
        'fill-opacity': 0.1,
      }),
      svg(
        'rect',
        {
          'data-lane': l.name,
          x: at(l.start),
          y: top,
          width: Math.max(at(l.end) - at(l.start), 2),
          height: bar,
          rx: 4,
          style: `fill: var(--${l.failed === true ? 'error' : (l.color ?? 'fg-5')})`,
        },
        svg('title', {}, `${l.name}: ${ms}`),
      ),
      svg(
        'text',
        { ...text, x: width, y: middle, 'text-anchor': 'end' },
        l.label ?? `${Math.round(l.end - l.start)}ms`,
      ),
    ];
  });
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) =>
    svg(
      'text',
      {
        ...text,
        x: at(scale * f),
        y: height - row / 2,
        'text-anchor': 'middle',
        'fill-opacity': 0.6,
        'font-size': 14,
      },
      `${Math.round(scale * f)}ms`,
    ),
  );
  container.replaceChildren(
    svg(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        width: '100%',
        role: 'img',
        'aria-label': 'Measured timeline',
      },
      ...rows,
      ...ticks,
    ),
  );
}

// A click handler that disables its button while it runs.
export function busy<A extends unknown[], R>(
  button: HTMLButtonElement,
  fn: (...args: A) => Promise<R>,
) {
  return async (...args: A) => {
    button.disabled = true;
    try {
      return await fn(...args);
    } finally {
      button.disabled = false;
    }
  };
}
