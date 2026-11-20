// /<topic>/api/... goes to that topic's server code, src/topics/<topic>/server.js.
import type { APIRoute } from 'astro';

type Server = { handle: (request: Request) => Promise<Response> };
const servers = import.meta.glob<Server>('../../../topics/*/server.js', { eager: true });
const topics = Object.fromEntries(
  Object.entries(servers).map(([file, server]) => [file.split('/').at(-2)!, server]),
);

export const ALL: APIRoute = ({ params, request }) => {
  const topic = topics[params.topic ?? ''];
  return topic
    ? topic.handle(request)
    : Response.json({ error: `no topic ${params.topic}` }, { status: 404 });
};
