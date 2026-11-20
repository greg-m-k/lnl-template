// /<topic>/api/... goes to that topic's server code (topics/<topic>/api.js).
import type { APIRoute } from 'astro';
import * as sample from '../../../../topics/sample/api.js';

const TOPICS: Record<string, { handle: (request: Request) => Promise<Response> }> = { sample };

export const ALL: APIRoute = ({ params, request }) => {
  const topic = TOPICS[params.topic ?? ''];
  return topic
    ? topic.handle(request)
    : Response.json({ error: `no topic ${params.topic}` }, { status: 404 });
};
