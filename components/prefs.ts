"use client";

import { useCallback, useEffect, useState } from "react";
import type { Edition, Region, SocialSignal, Story } from "@/lib/types";

export type Prefs = {
  edition: Edition | null; // null = not chosen yet, guess from the browser
  topics: string[];
  keywords: string[];
  hiddenOutlets: string[];
  verifiedOnly: boolean;
  nudgeDismissed: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  edition: null,
  topics: [],
  keywords: [],
  hiddenOutlets: [],
  verifiedOnly: false,
  nudgeDismissed: false,
};

export const EDITIONS: { id: Edition; label: string; nation?: string }[] = [
  { id: "global", label: "Global" },
  { id: "us", label: "US", nation: "US" },
  { id: "uk", label: "UK", nation: "UK" },
  { id: "india", label: "India", nation: "India" },
];

export type Topic = { id: string; label: string; terms: string[] };

export const TOPICS: Topic[] = [
  { id: "ai", label: "AI", terms: ["ai", "artificial intelligence", "openai", "chatgpt", "llm", "anthropic", "gemini", "deepmind", "machine learning", "nvidia", "chatbot"] },
  { id: "markets", label: "Markets and economy", terms: ["stocks", "stock market", "shares", "inflation", "interest rate", "interest rates", "central bank", "federal reserve", "economy", "gdp", "recession", "nasdaq", "dow", "ftse", "s&p"] },
  { id: "politics", label: "Politics", terms: ["election", "elections", "senate", "congress", "parliament", "prime minister", "president", "white house", "downing street", "vote", "campaign", "minister"] },
  { id: "climate", label: "Climate", terms: ["climate", "emissions", "wildfire", "wildfires", "heatwave", "flood", "floods", "hurricane", "carbon", "renewable", "net zero"] },
  { id: "space", label: "Space", terms: ["nasa", "spacex", "rocket", "telescope", "astronaut", "astronomers", "moon", "mars", "isro", "satellite", "orbit"] },
  { id: "health", label: "Health", terms: ["health", "vaccine", "virus", "cancer", "hospital", "nhs", "disease", "medical", "drug", "waiting lists"] },
  { id: "cyber", label: "Cybersecurity", terms: ["hack", "hacked", "hackers", "cyber", "cyberattack", "ransomware", "data breach", "malware"] },
  { id: "crypto", label: "Crypto", terms: ["bitcoin", "crypto", "cryptocurrency", "ethereum", "blockchain", "stablecoin"] },
  { id: "football", label: "Football", terms: ["football", "soccer", "premier league", "champions league", "fifa", "uefa", "world cup"] },
  { id: "cricket", label: "Cricket", terms: ["cricket", "ipl", "test match", "odi", "t20", "wicket", "wickets", "century"] },
  { id: "ussports", label: "NFL, NBA and US sports", terms: ["nfl", "nba", "mlb", "nhl", "super bowl", "playoffs"] },
  { id: "screen", label: "Film and TV", terms: ["film", "movie", "box office", "netflix", "streaming", "series", "oscar", "oscars", "festival"] },
  { id: "gaming", label: "Gaming", terms: ["gaming", "video game", "playstation", "xbox", "nintendo", "steam"] },
];

const KEY = "corroboro:prefs:v1";

function guessEdition(): Edition {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lang = (navigator.language || "").toLowerCase();
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta" || lang === "en-in") return "india";
    if (tz === "Europe/London" || lang === "en-gb") return "uk";
    if (tz.startsWith("America/") && lang.startsWith("en")) return "us";
  } catch {}
  return "global";
}

/** Preferences live in this browser only (localStorage). No account needed. */
export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const [guessed, setGuessed] = useState<Edition>("global");

  useEffect(() => {
    setGuessed(guessEdition());
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<Prefs> | ((p: Prefs) => Partial<Prefs>)) => {
    setPrefs((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setPrefs(DEFAULT_PREFS);
  }, []);

  return { prefs, update, reset, ready, edition: prefs.edition ?? guessed };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const termCache = new Map<string, RegExp>();
function termRe(terms: string[]): RegExp {
  const k = terms.join("|");
  let re = termCache.get(k);
  if (!re) {
    re = new RegExp(`(^|[^a-z0-9])(${terms.map((t) => escapeRe(t.toLowerCase())).join("|")})(?=$|[^a-z0-9])`, "i");
    termCache.set(k, re);
  }
  return re;
}

/** Which of the reader's topics and keywords this story matches */
export function matchedInterests(story: Story, prefs: Prefs): string[] {
  const text = `${story.headline} ${story.summary}`;
  const hits: string[] = [];
  for (const t of TOPICS) if (prefs.topics.includes(t.id) && termRe(t.terms).test(text)) hits.push(t.label);
  for (const k of prefs.keywords) if (k.trim() && termRe([k.trim()]).test(text)) hits.push(k.trim());
  return hits;
}

/** Is this story part of the chosen edition? */
export function inEdition(story: Story, edition: Edition): boolean {
  if (story.regions.includes("global")) return true;
  if (edition === "global") return story.independent >= 5 || (story.regions.length >= 2 && story.independent >= 3); // big national stories, or any verified story reported in more than one region
  return story.regions.includes(edition as Region);
}

export function editionScore(story: Story, edition: Edition): number {
  return edition !== "global" && story.regions.includes(edition as Region) ? story.score * 1.3 : story.score;
}

export function signalInEdition(s: SocialSignal, edition: Edition): boolean {
  if (edition === "global") return s.region !== "india";
  return s.region === edition || s.region === "global";
}

export function hasInterests(p: Prefs) {
  return p.topics.length > 0 || p.keywords.length > 0;
}
