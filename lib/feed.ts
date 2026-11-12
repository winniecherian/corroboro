import { unstable_cache } from "next/cache";
import { clusterArticles } from "./cluster";
import { fetchAllArticles } from "./ingest";
import { sampleFeed } from "./sample";
import { fetchSignals, matchSignals } from "./social";
import { summarizeTop } from "./summarize";
import type { Feed } from "./types";

const REFRESH = Number(process.env.REFRESH_SECONDS || 600);

async function buildFeed(): Promise<Feed> {
  const [{ articles, ok, total }, signals] = await Promise.all([fetchAllArticles(), fetchSignals()]);

  // If almost nothing loaded (offline, blocked network), show clearly-labelled sample stories instead of an empty page.
  if (articles.length < 10) {
    // On the deploy server, fail instead: the last good version stays live, and sample stories never go public.
    if (process.env.STRICT_FEEDS === "1") {
      throw new Error(`Only ${articles.length} articles from ${ok}/${total} feeds. Refusing to publish.`);
    }
    return sampleFeed(ok, total);
  }

  const stories = clusterArticles(articles);
  matchSignals(stories, signals);
  stories.sort((a, b) => b.score - a.score);
  const top = stories.slice(0, 160);
  await summarizeTop(top);

  return {
    generatedAt: Date.now(),
    sample: false,
    stories: top,
    signals: signals.slice(0, 120),
    sourcesOk: ok,
    sourcesTotal: total,
  };
}

export const getFeed = unstable_cache(buildFeed, ["corroboro-feed-v2"], { revalidate: REFRESH });
