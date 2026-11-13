import Parser from "rss-parser";
import { SOURCES } from "./sources";
import { isEnglish } from "./lang";
import type { Article, Source } from "./types";

const parser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; CorroboroBot/0.1; +https://corroboro.app)" },
});

const MAX_AGE_MS = 18 * 60 * 60 * 1000; // ignore articles older than 18 hours

export function cleanText(s: string | undefined, max = 280): string {
  if (!s) return "";
  const t = s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&hellip;/g, "…")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, "") + "…" : t;
}

async function fetchSource(src: Source): Promise<Article[]> {
  const feed = await parser.parseURL(src.url);
  const now = Date.now();
  return (feed.items ?? [])
    .map((it, i): Article | null => {
      const title = cleanText(it.title, 220);
      const link = it.link ?? "";
      if (!title || !link || !isEnglish(title)) return null;
      const ts = Date.parse(it.isoDate ?? it.pubDate ?? "") || now;
      if (now - ts > MAX_AGE_MS) return null;
      return {
        id: `${src.id}-${i}`,
        sourceId: src.id,
        sourceName: src.name,
        group: src.group,
        category: src.category,
        region: src.region,
        title,
        summary: cleanText(it.contentSnippet ?? it.content ?? it.summary, 320),
        link,
        publishedAt: Math.min(ts, now),
      };
    })
    .filter((a): a is Article => a !== null)
    .slice(0, 40);
}

export async function fetchAllArticles(): Promise<{ articles: Article[]; ok: number; total: number }> {
  const results = await Promise.allSettled(SOURCES.map(fetchSource));
  const articles: Article[] = [];
  let ok = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.length) {
      ok++;
      articles.push(...r.value);
    } else if (r.status === "rejected") {
      console.warn(`[corroboro] feed failed: ${SOURCES[i].name} (${SOURCES[i].url}) — ${String(r.reason).slice(0, 120)}`);
    }
  });
  // Drop exact duplicate links (same article in two feeds of one outlet)
  const seen = new Set<string>();
  const unique = articles.filter((a) => (seen.has(a.link) ? false : (seen.add(a.link), true)));
  return { articles: unique, ok, total: SOURCES.length };
}
