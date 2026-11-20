# 9. Vetted links to other Lunch & Learn sites

Depends on: 5 (Astro collections).

## Why

Replaces the removed "mount a topic from another Worker" design. This site hosts small, free-to-run examples merged
by pull request (todo 10). Lunch & Learn sites hosted elsewhere are listed as links once someone vets them; their
code and APIs are never served from here. The home page already
credits lnl.sam-peterson.com as the origin of the format; that becomes the first entry.

## Target

```
src/links/<slug>.json
{
  "title": "useEffect: when it runs and when it doesn't",
  "url": "https://lnl.greg.kitchen/effects/",
  "summary": "One or two sentences on the question it covers.",
  "source": "https://github.com/greg-m-k/useeffect-lnl",
  "vettedBy": "github-handle",
  "vettedOn": "2026-11-20"
}
```

- A `links` content collection with a zod schema: `url` and `source` must be `https:`; all fields required.
- Home shows a "Elsewhere" section after the local topics: one `a.card.linked` per link (title, summary, host name),
  opening in the same tab, `rel="noopener"`.
- "Vetted" means a maintainer reviewed it in a pull request. The pull request is the record; `vettedBy` and
  `vettedOn` say who and when.

## Steps

1. Test first: the schema rejects `http:` URLs and missing fields; the home page renders one card per link file.
2. Collection + schema in `src/content.config.ts`; the home section in `index.astro`.
3. Add the origin site and the two reference repos' live sites as the first entries (confirm their URLs are live).
4. `AGENTS.md`: a short "Adding a link" section: what makes a site eligible (built to this format, runs real code,
   source public), and that a link arrives by pull request.
5. Optional, later: a scheduled CI job that HEADs each URL weekly and opens an issue on failure. Not in this todo.

## Done when

- Home lists local topics, then vetted links. Adding a link is one JSON file in one pull request.
