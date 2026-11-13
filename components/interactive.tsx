"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Feed, Story } from "@/lib/types";

export const SITE_URL = "https://corroboro.web.app";

export function ago(ts: number, now: number) {
  const m = Math.max(0, Math.round((now - ts) / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function storyUrl(id: string) {
  const origin = typeof window !== "undefined" && window.location.protocol.startsWith("http") ? window.location.origin : SITE_URL;
  return `${origin}/#story-${id}`;
}

/* ---------------------------------------------------------------- live updates */

const POLL_MS = 60_000;

/**
 * Keeps the feed fresh while the page is open. Checks /feed.json every minute and whenever the tab comes back into view;
 * if new stories arrived it holds them until the reader taps "Show", so the page never jumps under them.
 */
export function useLiveFeed(initial: Feed) {
  const [feed, setFeed] = useState(initial);
  const [pending, setPending] = useState<{ feed: Feed; newIds: string[] } | null>(null);
  const current = useRef(initial);

  useEffect(() => {
    if (initial.sample) return; // the design preview has nothing to poll
    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/feed.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const next: Feed = await res.json();
        if (stopped || next.generatedAt <= current.current.generatedAt) return;
        const known = new Set(current.current.stories.map((s) => s.id));
        const newIds = next.stories.filter((s) => !known.has(s.id)).map((s) => s.id);
        if (newIds.length === 0) {
          // Only counts and times changed: update quietly
          current.current = next;
          setFeed(next);
        } else {
          setPending({ feed: next, newIds });
        }
      } catch {}
    };
    const t = setInterval(check, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initial.sample]);

  const applyPending = useCallback(() => {
    if (!pending) return;
    current.current = pending.feed;
    setFeed(pending.feed);
    setPending(null);
  }, [pending]);

  return { feed, pending, applyPending };
}

export function NewStoriesButton({ count, onShow }: { count: number; onShow: () => void }) {
  return (
    <div className="pointer-events-none sticky top-[132px] z-10 -mb-11 flex justify-center sm:top-[120px]">
      <button
        onClick={onShow}
        className="pop-in pointer-events-auto flex items-center gap-2 rounded-full bg-marine px-4 py-2 text-[15px] font-medium text-paper shadow-lg"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        {count} new {count === 1 ? "story" : "stories"}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- watch list */

type Watched = Record<string, { headline: string; since: number; verifiedSeen?: boolean }>;
const WATCH_KEY = "corroboro:watch:v1";
const WATCH_TTL = 48 * 3_600_000;

/** Stories the reader is watching, saved in this browser. */
export function useWatch(stories: Story[]) {
  const [watched, setWatched] = useState<Watched>({});

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(WATCH_KEY) || "{}") as Watched;
      const now = Date.now();
      const fresh = Object.fromEntries(Object.entries(raw).filter(([, w]) => now - w.since < WATCH_TTL));
      setWatched(fresh);
    } catch {}
  }, []);

  const save = (w: Watched) => {
    setWatched(w);
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(w));
    } catch {}
  };

  const toggle = (s: Story) => {
    const next = { ...watched };
    if (next[s.id]) delete next[s.id];
    else next[s.id] = { headline: s.headline, since: Date.now() };
    save(next);
  };

  // Watched stories that have since earned the tick and the reader hasn't seen yet
  const nowVerified = stories.filter((s) => watched[s.id] && !watched[s.id].verifiedSeen && s.status === "verified");

  const markSeen = (id: string) => {
    if (!watched[id]) return;
    save({ ...watched, [id]: { ...watched[id], verifiedSeen: true } });
  };

  return { isWatched: (id: string) => Boolean(watched[id]), toggle, nowVerified, markSeen };
}

export function WatchedBanner({ stories, onOpen }: { stories: Story[]; onOpen: (s: Story) => void }) {
  if (!stories.length) return null;
  const s = stories[0];
  return (
    <div className="pop-in mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-seal-tint px-5 py-3.5 text-seal">
      <span className="text-[15px] font-medium">A story you&apos;re watching is now verified</span>
      <button onClick={() => onOpen(s)} className="min-w-0 flex-1 truncate text-left text-[15px] text-ink underline decoration-seal/50 underline-offset-2 hover:decoration-seal">
        {s.headline}
      </button>
      {stories.length > 1 && <span className="text-[14px]">+{stories.length - 1} more</span>}
    </div>
  );
}

/* ---------------------------------------------------------------- per-story actions */

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const btn = "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13.5px] text-slate hover:bg-paper hover:text-ink";

export function StoryActions({
  story,
  now,
  watching,
  onWatch,
  hiddenOutlets,
  defaultOpen = false,
}: {
  story: Story;
  now: number;
  watching: boolean;
  onWatch: () => void;
  hiddenOutlets: string[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [sharing, setSharing] = useState(false);
  const outlets = story.outlets.filter((o) => !hiddenOutlets.includes(o.name));

  return (
    <div>
      <div className="-ml-2.5 flex flex-wrap items-center gap-1">
        <button className={btn} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <Icon d="M4 6h16M4 12h10M4 18h7" />
          {open ? "Hide coverage" : `Compare ${outlets.length} ${outlets.length === 1 ? "headline" : "headlines"}`}
        </button>
        <button className={btn} aria-expanded={sharing} onClick={() => setSharing((v) => !v)}>
          <Icon d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
          Share
        </button>
        {story.status !== "verified" && (
          <button className={`${btn} ${watching ? "text-marine" : ""}`} aria-pressed={watching} onClick={onWatch}>
            <Icon d={watching ? "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" : "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"} />
            {watching ? "Watching" : "Watch"}
          </button>
        )}
      </div>
      {sharing && <ShareRow story={story} />}
      {watching && story.status !== "verified" && (
        <p className="mt-1 text-[13px] text-hush">We&apos;ll highlight it here when a third newsroom confirms it.</p>
      )}
      {open && <Coverage story={story} outlets={outlets} now={now} />}
    </div>
  );
}

function Coverage({ story, outlets, now }: { story: Story; outlets: Story["outlets"]; now: number }) {
  const first = outlets[0]?.publishedAt ?? story.firstSeen;
  return (
    <ol className="reveal mt-3 border-l-2 border-line pl-4" aria-label="How each outlet covered it">
      {outlets.map((o, i) => (
        <li key={o.name} className="relative py-2">
          <span className={`absolute top-[15px] -left-[21px] h-2 w-2 rounded-full ${i === 0 ? "bg-seal" : "bg-line"}`} aria-hidden="true" />
          <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
            <span className="font-medium text-ink">{o.name}</span>
            <span className="text-hush">
              {i === 0 ? `broke it ${ago(o.publishedAt, now)}` : `+${Math.max(1, Math.round((o.publishedAt - first) / 60_000))} min later`}
            </span>
          </div>
          <a href={o.link} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-[15px] leading-snug text-slate hover:text-marine">
            {o.title || story.headline}
          </a>
        </li>
      ))}
    </ol>
  );
}

function ShareRow({ story }: { story: Story }) {
  const [copied, setCopied] = useState(false);
  const url = storyUrl(story.id);
  const label = story.status === "verified" ? ` (verified by ${story.independent} outlets)` : "";
  const text = `${story.headline}${label}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const t = document.createElement("textarea");
      t.value = url;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const link = "rounded-full border border-line bg-paper px-3 py-1 text-[13.5px] text-slate hover:border-slate hover:text-ink";
  return (
    <div className="reveal mt-2 flex flex-wrap gap-2">
      <a className={link} target="_blank" rel="noopener noreferrer" href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}>
        Post on X
      </a>
      <a className={link} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}>
        WhatsApp
      </a>
      <button className={link} onClick={copy} aria-live="polite">
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- shared-link focus */

/** Reads #story-<id> from the address so a shared link opens on that story. */
export function useSharedStory() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const m = window.location.hash.match(/^#story-([a-z0-9-]+)$/i);
      setId(m ? m[1] : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const clear = () => {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    setId(null);
  };
  return { sharedId: id, clearShared: clear };
}
