# 9. Syntax highlighting with TanStack Highlight

**Status: done (2026-11-21).** `@tanstack/highlight` 1.2.12 (MIT), pinned exactly.

- `src/lib/highlight.ts`: `createHighlighter({ languages: [html, ts] })` from `/core` with only the HTML and
  TypeScript languages; colours are TanStack's shipped GitHub Light and GitHub Dark themes, written as CSS by its own `createThemeRule` and
  `createThemeBaseCss`. `createThemeCss`'s dark switch is a selector (default `.dark`), so the dark rule sits in
  `@media (prefers-color-scheme: dark)` to follow the system scheme as Graffiti does. No hand-written CSS.
- `src/components/Source.astro` renders a pattern file highlighted at build time (`pre.th-code`); no highlighter code
  reaches the browser. `Base.astro` puts the generated theme in the page head.
- Sample topic: `src/topics/sample/patterns/example.ts`, shown on the sample lesson with
  `<Source code={example} />` (imported `?raw`). `showSource` is removed from `ui.ts`.
- `src/components/Code.astro` highlights a short inline example (`<Code lang="html" code={...} />`), used where page
  prose shows markup, such as the pattern-name tag in the sample pages and the scaffold template.
- No test checks the highlighter's output: that is TanStack's job. The browser test now also loads the page head's
  inline styles, which it had not, so the code block's own overflow rule applies at 390px.
- Also fixed (todo 8's loose ends): `ui.ts` helpers use Graffiti only. `say()` writes a `.tag` (success / error /
  warning / muted); `logger()` marks lines with ✓ ✗ … instead of dead classes; `timeline()` draws an SVG chart whose
  bars use Graffiti hue tokens and whose text uses `currentColor`. Pattern names are Graffiti tags with `--tag-color`
  (AGENTS.md, sample pages, scaffold template) instead of `<strong data-color>`. `test/ui.browser.test.ts` covers the
  helpers.

Depends on: 5 (Astro), 8 (Graffiti tokens for the colour theme).

## Why

- `showSource` puts the exact pattern file on screen. Today it is monochrome text in a `<pre>`.
- `@tanstack/highlight` is small and synchronous, loads only the languages imported, and emits stable `th-*` classes.
  Light and dark themes are CSS variable sets on the same markup, so dark mode needs no re-render.
- s-petey/lunch-n-learn already uses it (`@tanstack/highlight` ^1.2).

Docs: https://tanstack.com/highlight/latest/docs/overview

## Target

Highlight at build time. A lesson imports the pattern file as text and a component renders it:

```astro
---
// src/components/Source.astro
import { highlight } from "@tanstack/highlight/core";        // confirm exact entry + signature in the README
import javascript from "@tanstack/highlight/languages/javascript";
const { code } = Astro.props;
---
<pre class="source" data-lang="javascript"><code set:html={highlight(code, { lang: javascript })} /></pre>
```

```astro
---
import source from "../../topics/sample/patterns/sequential.js?raw";
---
<Source code={source} />
```

The browser ships highlighted HTML and no highlighter code. The same `?raw` string is the file that runs (the lesson
imports the module itself for the run button), so the code on screen is the code that ran.

## Steps

1. Test first: build the site, then for the sample lesson assert the `<pre class="source">` contains `.th-*` spans and
   its text content equals the pattern file on disk byte for byte. Watch it fail.
2. `pnpm add @tanstack/highlight`. Import the core entry and the JavaScript language only.
3. `src/components/Source.astro` as above. Replace `showSource(pre, url)` in lessons with `<Source code=... />`;
   remove `showSource` from `lib/ui.js`.
4. Theme: one CSS block mapping `th-*` variables to Graffiti tokens (todo 8) for both schemes. Keep pattern colours
   (blue/green/purple/orange) out of the code theme so a colour always means one pattern.
5. Add `patterns/example.js` to the sample topic and a `<Source>` in the sample lesson, so the template shows it.
6. If pattern files are TypeScript (todo 6), add the TypeScript language module; nothing else.

## Done when

- Sample lesson shows highlighted source in light and dark mode; the byte-for-byte test passes.
- No highlighter JavaScript in the built client bundle.
