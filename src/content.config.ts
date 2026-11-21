// Content collections. links: Lunch & Learn sites hosted elsewhere, one JSON file each in src/links/, listed on the
// home page once a maintainer has reviewed them in a pull request (AGENTS.md, "Adding a link").
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const https = z.url({ protocol: /^https$/ });

export const collections = {
  links: defineCollection({
    loader: glob({ pattern: '*.json', base: './src/links' }),
    schema: z.object({
      title: z.string().min(1),
      url: https,
      summary: z.string().min(1),
      // The site's public source code: a link is listed only when its code can be read.
      source: https,
      // Who reviewed it, and when: the pull request that added the file is the full record.
      vettedBy: z.string().min(1),
      vettedOn: z.iso.date(),
    }),
  }),
};
