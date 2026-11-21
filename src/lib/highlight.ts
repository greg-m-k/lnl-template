// Syntax highlighting with TanStack Highlight, at build time: only the languages pages show are registered, and the
// colours are TanStack's own GitHub themes, light by default and dark when the system is (as Graffiti follows it).
import { createHighlighter, renderNodesToHtml, renderTokens } from '@tanstack/highlight/core';
import { html } from '@tanstack/highlight/languages/html';
import { ts } from '@tanstack/highlight/languages/ts';
import { createThemeBaseCss, createThemeRule } from '@tanstack/highlight/theme';
import { githubDarkTheme } from '@tanstack/highlight/themes/github-dark';
import { githubLightTheme } from '@tanstack/highlight/themes/github-light';

export const highlighter = createHighlighter({ languages: [html, ts] });

// Highlighted token spans for inline code, without the <pre><code> block wrapper.
export const highlightInline = (code: string, lang: string) =>
  renderNodesToHtml(renderTokens(highlighter.tokenize(code, { lang }).tokens));

export const codeThemeCss = [
  createThemeRule(':root', githubLightTheme),
  `@media (prefers-color-scheme: dark) {\n${createThemeRule(':root', githubDarkTheme)}\n}`,
  createThemeBaseCss(),
].join('\n\n');
