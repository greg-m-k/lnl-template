// The site Worker: serves public/ and sends /api/<topic>/... to that topic's handler.
// Plumbing only. Each topic's server code lives in topics/<slug>/; a topic big enough to need
// its own Workers (a router, a queue consumer, databases) puts them under
// topics/<slug>/patterns/<pattern>/ and its api.js forwards to them through service bindings.
import * as requests from "../topics/requests/api.js";

const TOPICS = { requests };

export default {
  async fetch(request, env) {
    const [, api, slug] = new URL(request.url).pathname.split("/");
    if (api !== "api") return env.ASSETS.fetch(request);
    const topic = TOPICS[slug];
    return topic ? topic.handle(request, env) : Response.json({ error: `no topic ${slug}` }, { status: 404 });
  },
};
