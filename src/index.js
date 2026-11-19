// The site Worker. A topic owns every path below /<slug>/, so a hub can mount it by forwarding
// /<slug>/* to this Worker and nothing else:
//   /<slug>/api/...   the topic's server code (topics/<slug>/api.js)
//   /<slug>/site/...  the site frame (styles.css, lib/, topics.json), one copy in public/ served below every topic
//   /<slug>/...       the topic's pages, from public/<slug>/
// Plumbing only. A topic big enough to need its own Workers (a router, a queue consumer, databases) puts them
// under topics/<slug>/patterns/<pattern>/ and its api.js forwards to them through service bindings.
import * as sample from "../topics/sample/api.js";

const TOPICS = { sample };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const [, slug, area, ...rest] = url.pathname.split("/");
    if (area === "api") {
      const topic = TOPICS[slug];
      return topic ? topic.handle(request, env) : Response.json({ error: `no topic ${slug}` }, { status: 404 });
    }
    if (area === "site") return env.ASSETS.fetch(new Request(new URL(`/${rest.join("/")}${url.search}`, url), request));
    return env.ASSETS.fetch(request);
  },
};
