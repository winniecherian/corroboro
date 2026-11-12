import Parser from "rss-parser";
import { tokens } from "./cluster";
import { cleanText } from "./ingest";
import { isEnglish } from "./lang";
import type { Region, SocialSignal, Story } from "./types";

const UA = "Mozilla/5.0 (compatible; CorroboroBot/0.1; +https://corroboro.app)";
const parser = new Parser({ timeout: 10_000, headers: { "User-Agent": UA }, customFields: { item: [["ht:approx_traffic", "traffic"]] } });

async function getJSON(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function googleTrends(geo: string, region: Region): Promise<SocialSignal[]> {
  const feed = await parser.parseURL(`https://trends.google.com/trending/rss?geo=${geo}`);
  return (feed.items ?? []).slice(0, 15).map((it, i) => ({
    id: `g-${geo}-${i}`,
    platform: "google" as const,
    region,
    title: cleanText(it.title, 120),
    link: `https://www.google.com/search?q=${encodeURIComponent(it.title ?? "")}`,
    metric: (it as unknown as { traffic?: string }).traffic ? `${(it as unknown as { traffic: string }).traffic} searches` : undefined,
  }));
}

async function hackerNews(): Promise<SocialSignal[]> {
  const data = await getJSON("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20");
  return (data.hits ?? []).map((h: { objectID: string; title: string; points: number; url?: string }) => ({
    id: `hn-${h.objectID}`,
    platform: "hackernews" as const,
    region: "global" as const,
    title: cleanText(h.title, 160),
    link: `https://news.ycombinator.com/item?id=${h.objectID}`,
    metric: `${h.points} points`,
  }));
}

async function reddit(sub: string, region: Region): Promise<SocialSignal[]> {
  const data = await getJSON(`https://www.reddit.com/r/${sub}/top.json?t=day&limit=12`);
  return (data.data?.children ?? []).map((c: { data: { id: string; title: string; ups: number; permalink: string } }) => ({
    id: `r-${c.data.id}`,
    platform: "reddit" as const,
    region,
    title: cleanText(c.data.title, 160),
    link: `https://www.reddit.com${c.data.permalink}`,
    metric: `${Intl.NumberFormat("en", { notation: "compact" }).format(c.data.ups)} upvotes · r/${sub}`,
  }));
}

/** Optional. X API is pay-per-use: each call costs credits. Only runs when X_BEARER_TOKEN is set. */
async function xTrends(): Promise<SocialSignal[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];
  const woeid = process.env.X_WOEID || "1"; // 1 = worldwide, 23424977 = US, 23424975 = UK, 23424848 = India
  const data = await getJSON(`https://api.x.com/2/trends/by/woeid/${woeid}?max_trends=20`, { Authorization: `Bearer ${token}` });
  return (data.data ?? []).map((t: { trend_name: string; tweet_count?: number }, i: number) => ({
    id: `x-${i}`,
    platform: "x" as const,
    region: (process.env.X_REGION as Region) || "global",
    title: t.trend_name,
    link: `https://x.com/search?q=${encodeURIComponent(t.trend_name)}`,
    metric: t.tweet_count ? `${Intl.NumberFormat("en", { notation: "compact" }).format(t.tweet_count)} posts` : undefined,
  }));
}

export async function fetchSignals(): Promise<SocialSignal[]> {
  const jobs = [
    googleTrends("US", "us"),
    googleTrends("GB", "uk"),
    googleTrends("IN", "india"),
    hackerNews(),
    reddit("worldnews", "global"),
    reddit("technology", "global"),
    reddit("news", "us"),
    reddit("unitedkingdom", "uk"),
    reddit("india", "india"),
    xTrends(),
  ];
  const results = await Promise.allSettled(jobs);
  const out: SocialSignal[] = [];
  results.forEach((r) => {
    // English only for now
    if (r.status === "fulfilled") out.push(...r.value.filter((s) => isEnglish(s.title)));
    else console.warn(`[corroboro] social source failed — ${String(r.reason).slice(0, 120)}`);
  });
  return out;
}

/** Links social signals to news stories by shared keywords, and boosts those stories. */
export function matchSignals(stories: Story[], signals: SocialSignal[]) {
  const storyTokens = stories.map((s) => new Set(tokens(`${s.headline} ${s.summary}`)));
  for (const sig of signals) {
    const st = [...new Set(tokens(sig.title.replace(/^#/, "").replace(/([a-z])([A-Z])/g, "$1 $2")))];
    if (!st.length) continue;
    // Short search terms (Google/X) must match fully; longer titles need 3 shared keywords
    const need = st.length <= 3 ? st.length : 3;
    let best = -1;
    let bestHits = 0;
    storyTokens.forEach((set, i) => {
      const hits = st.filter((w) => set.has(w)).length;
      if (hits >= need && hits > bestHits) {
        bestHits = hits;
        best = i;
      }
    });
    if (best >= 0) {
      const story = stories[best];
      sig.storyId = story.id;
      if (!story.social.includes(sig.platform)) {
        story.social.push(sig.platform);
        story.score *= 1.25;
      }
    }
  }
}
