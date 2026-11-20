// /<topic>/site/... serves the site frame (styles.css, lib/, topics.json) from its one copy in public/,
// so every request a lesson makes stays below its topic's path.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ params, request }) =>
  fetch(new URL(`/${params.path ?? ''}`, request.url));
