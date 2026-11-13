/**
 * Groups articles about the same story using TF-IDF cosine similarity.
 * No paid AI needed. Swap in embeddings later for better accuracy.
 */
import { VERIFIED_MIN } from "./sources";
import type { Article, Category, Region, Status, Story, StoryOutlet } from "./types";

const STOP = new Set(
  `a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those
  after before over under into about against between during without within says said say new news live latest update updates
  will would can could may might has have had do does did not no than then so up out more most very just also
  how why what who when where which amid while report reports video watch photos first last year years day days week
  he she they them his her their we our you your i me my us one two three top big`.split(/\s+/)
);

function stem(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (w.length > 3 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
  // Prefix-truncate long words so "evacuate", "evacuation", "evacuations" all match
  return w.length > 6 ? w.slice(0, 6) : w;
}

/** Common acronyms in Indian and world news, expanded so "RBI" matches "Reserve Bank". */
const ALIASES: [RegExp, string][] = [
  [/\brbi\b/g, "rbi reserve bank"],
  [/\breserve bank\b/g, "reserve bank rbi"],
  [/\bsc\b/g, "supreme court"],
  [/\bhc\b/g, "high court"],
  [/\bpm\b/g, "prime minister"],
  [/\bcm\b/g, "chief minister"],
  [/\bec\b/g, "election commission"],
  [/\bisro\b/g, "isro space"],
  [/\bu\.s\.?(?=\s|$)/g, "united states"],
  [/\b(uk|u\.k\.?)(?=\s|$)/g, "britain"],
];

export function tokens(text: string): string[] {
  let t = text.toLowerCase();
  for (const [re, rep] of ALIASES) t = t.replace(re, rep);
  return t
    .replace(/[’']s\b/g, "")
    .replace(/[^a-z0-9\u0900-\u097f\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
    .map(stem);
}

type Vec = Map<string, number>;

function norm(v: Vec): number {
  let s = 0;
  v.forEach((x) => (s += x * x));
  return Math.sqrt(s) || 1;
}

export function cosine(a: Vec, b: Vec): number {
  let dot = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  small.forEach((x, k) => {
    const y = big.get(k);
    if (y) dot += x * y;
  });
  return dot / (norm(a) * norm(b));
}

export function buildVectors(texts: { title: string; summary: string }[]) {
  const docs = texts.map((t) => {
    const tf: Vec = new Map();
    // Titles count 3x more than summaries
    for (const w of tokens(t.title)) tf.set(w, (tf.get(w) ?? 0) + 3);
    for (const w of tokens(t.summary).slice(0, 40)) tf.set(w, (tf.get(w) ?? 0) + 1);
    return tf;
  });
  const df = new Map<string, number>();
  docs.forEach((d) => d.forEach((_, k) => df.set(k, (df.get(k) ?? 0) + 1)));
  const N = docs.length;
  const idf = (k: string) => Math.log(1 + N / (df.get(k) ?? 1));
  const vecs = docs.map((d) => {
    const v: Vec = new Map();
    d.forEach((tf, k) => v.set(k, (1 + Math.log(tf)) * idf(k)));
    return v;
  });
  return { vecs, idf };
}

const JOIN_THRESHOLD = 0.26;

type Cluster = { items: number[]; centroid: Vec };

function hashId(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function clusterArticles(articles: Article[]): Story[] {
  if (!articles.length) return [];
  const order = articles.map((_, i) => i).sort((a, b) => articles[a].publishedAt - articles[b].publishedAt);
  const { vecs } = buildVectors(articles);
  const clusters: Cluster[] = [];

  for (const i of order) {
    let best = -1;
    let bestSim = 0;
    clusters.forEach((c, ci) => {
      const s = cosine(vecs[i], c.centroid);
      if (s > bestSim) {
        bestSim = s;
        best = ci;
      }
    });
    if (best >= 0 && bestSim >= JOIN_THRESHOLD) {
      const c = clusters[best];
      c.items.push(i);
      vecs[i].forEach((x, k) => c.centroid.set(k, (c.centroid.get(k) ?? 0) + x));
    } else {
      clusters.push({ items: [i], centroid: new Map(vecs[i]) });
    }
  }

  const now = Date.now();
  return clusters.map((c) => {
    const items = c.items.map((i) => articles[i]);
    const groups = new Set(items.map((a) => a.group));
    const independent = groups.size;
    const status: Status = independent >= VERIFIED_MIN ? "verified" : independent === 2 ? "developing" : "single";

    // Representative article = closest to the centroid
    let rep = c.items[0];
    let repSim = -1;
    c.items.forEach((i) => {
      const s = cosine(vecs[i], c.centroid);
      if (s > repSim) {
        repSim = s;
        rep = i;
      }
    });
    const repA = articles[rep];
    const summary = repA.summary || items.find((a) => a.summary)?.summary || "";

    // One entry per outlet name (its own headline and time), earliest reporter first
    const outlets: StoryOutlet[] = [];
    const seenNames = new Set<string>();
    const byTime = [...items].sort((a, b) => a.publishedAt - b.publishedAt);
    byTime.forEach((a) => {
      if (!seenNames.has(a.sourceName)) {
        seenNames.add(a.sourceName);
        outlets.push({ name: a.sourceName, link: a.link, title: a.title, publishedAt: a.publishedAt });
      }
    });

    const catCount = new Map<Category, number>();
    items.forEach((a) => catCount.set(a.category, (catCount.get(a.category) ?? 0) + 1));
    const category = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0][0];

    const regions = [...new Set(items.map((a) => a.region))] as Region[];

    const firstSeen = Math.min(...items.map((a) => a.publishedAt));
    const latest = Math.max(...items.map((a) => a.publishedAt));
    const ageH = (now - latest) / 3_600_000;
    // Momentum: independent newsrooms that published in the last 3 hours
    const recent = new Set(items.filter((a) => now - a.publishedAt <= 3 * 3_600_000).map((a) => a.group)).size;
    // Fresh, widely-confirmed, worldwide stories rise; stale or single-source ones sink.
    const trust = status === "verified" ? 1 : status === "developing" ? 0.55 : 0.25;
    const worldwide = 1 + 0.35 * Math.min(2, Math.max(0, regions.length - 1));
    const score = (independent * 10 + items.length * 2 + recent * 8) * Math.exp(-ageH / 6) * trust * worldwide;
    const breaking = status === "verified" && ageH <= 3 && recent >= 3;

    return {
      // Stable across refreshes: based on the first article that broke the story
      id: hashId(byTime[0].link),
      headline: repA.title,
      summary,
      category,
      regions,
      status,
      independent,
      outlets,
      firstSeen,
      latest,
      score,
      recent,
      breaking,
      social: [],
    };
  });
}
