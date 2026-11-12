"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Edition, Feed, SocialSignal, Story } from "@/lib/types";
import { Customize } from "./Customize";
import { ThemeButton, useTheme } from "./theme";
import { PlatformGlyph, Seal, StatusLabel, Tally, platformName, statusText } from "./marks";
import {
  EDITIONS,
  TOPICS,
  editionScore,
  hasInterests,
  inEdition,
  matchedInterests,
  signalInEdition,
  usePrefs,
  type Prefs,
} from "./prefs";

type Tab = "top" | "foryou" | Category;

const SECTION_LABEL: Record<Exclude<Category, "nation">, string> = {
  world: "World",
  business: "Business",
  tech: "Tech",
  science: "Science",
  sports: "Sports",
  entertainment: "Entertainment",
};

function categoryLabel(c: Category, edition: Edition) {
  if (c === "nation") return EDITIONS.find((e) => e.id === edition)?.nation ?? "National";
  return SECTION_LABEL[c];
}

/** Tag shown on a story: national stories name their own country, not the reader's edition. */
function storyTag(s: Story) {
  if (s.category !== "nation") return SECTION_LABEL[s.category];
  const r = s.regions.find((x) => x !== "global");
  return EDITIONS.find((e) => e.id === r)?.nation ?? "World";
}

function ago(ts: number, now: number) {
  const m = Math.max(0, Math.round((now - ts) / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function Corroboro({ feed, outletCount }: { feed: Feed; outletCount: number }) {
  const { prefs, update, reset, edition, ready } = usePrefs();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("top");
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(feed.generatedAt);
  const [panelOpen, setPanelOpen] = useState(false);
  const interested = hasInterests(prefs);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Leave For you if the reader removes every interest
  useEffect(() => {
    if (tab === "foryou" && !interested) setTab("top");
  }, [tab, interested]);

  const tabs = useMemo(() => {
    const t: { id: Tab; label: string }[] = [{ id: "top", label: "Top" }];
    if (interested) t.push({ id: "foryou", label: "For you" });
    t.push({ id: "world", label: "World" });
    if (edition !== "global") t.push({ id: "nation", label: categoryLabel("nation", edition) });
    (["business", "tech", "science", "sports", "entertainment"] as const).forEach((c) => t.push({ id: c, label: SECTION_LABEL[c] }));
    return t;
  }, [edition, interested]);

  const editionStories = useMemo(
    () =>
      feed.stories
        .filter((s) => inEdition(s, edition))
        .filter((s) => s.outlets.some((o) => !prefs.hiddenOutlets.includes(o.name)))
        .map((s) => ({ story: s, rank: editionScore(s, edition), interests: matchedInterests(s, prefs) }))
        .sort((a, b) => b.rank - a.rank),
    [feed.stories, edition, prefs]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return editionStories.filter(({ story: s, interests }) => {
      if (tab === "foryou" && interests.length === 0) return false;
      if (tab !== "top" && tab !== "foryou" && s.category !== tab) return false;
      if (prefs.verifiedOnly && s.status !== "verified") return false;
      if (q && !`${s.headline} ${s.summary} ${s.outlets.map((o) => o.name).join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [editionStories, tab, prefs.verifiedOnly, query]);

  // Lead = the highest-ranked story with at least two outlets, so a lone rumour never takes the top spot.
  const lead = visible.find((v) => v.story.independent >= 2) ?? visible[0];
  const rest = visible.filter((v) => v !== lead);
  const verifiedCount = editionStories.filter((v) => v.story.status === "verified").length;
  const outletNames = useMemo(() => [...new Set(feed.stories.flatMap((s) => s.outlets.map((o) => o.name)))].sort(), [feed.stories]);
  const signals = feed.signals.filter((s) => signalInEdition(s, edition));
  const showNudge = ready && !interested && !prefs.nudgeDismissed && tab === "top";

  return (
    <div className="min-h-screen">
      {feed.sample && (
        <div className="bg-amber-tint px-5 py-2.5 text-center text-[14px] text-amber">
          You&apos;re seeing sample stories for the design preview. These aren&apos;t real news. Live feeds load when the site runs with internet access.
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-line bg-fog/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 md:px-8">
          <a href="#" className="flex items-center gap-2.5 text-ink" aria-label="Corroboro home">
            <Seal size={26} className="text-seal" />
            <span className="flex flex-col">
              <span className="font-display text-[26px] leading-none font-[720] tracking-[-0.02em]" style={{ fontStretch: "76%" }}>
                corroboro
              </span>
              <span className="mt-1 text-[12.5px] leading-none text-slate">Trending news, cross-checked</span>
            </span>
          </a>

          <label className="flex items-center">
            <span className="sr-only">Edition</span>
            <select
              value={edition}
              onChange={(e) => update({ edition: e.target.value as Edition })}
              className="cursor-pointer appearance-none rounded-full border border-line bg-paper py-1 pr-7 pl-3 text-[14px] text-slate hover:text-ink"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%238a90a3' stroke-width='1.5'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
              }}
            >
              {EDITIONS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label} edition
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-3">
            <label className="hidden items-center sm:flex">
              <span className="sr-only">Search stories</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stories"
                className="w-44 rounded-full border border-line bg-paper px-4 py-1.5 text-[15px] text-ink transition-[width] placeholder:text-hush focus:w-60 focus:outline-none focus-visible:outline-2 focus-visible:outline-marine"
              />
            </label>
            <ThemeButton theme={theme} setTheme={setTheme} />
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 rounded-full bg-ink px-3 py-2 text-[15px] text-paper sm:px-4 sm:py-1.5"
              aria-haspopup="dialog"
              aria-label="Customize"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
                <circle cx="16" cy="6" r="2" />
                <circle cx="10" cy="12" r="2" />
                <circle cx="18" cy="18" r="2" />
              </svg>
              <span className="hidden sm:inline">Customize</span>
            </button>
          </div>

          <nav aria-label="Sections" className="-mx-1 flex w-full gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[15px] transition-colors ${
                  tab === t.id ? "bg-ink text-fog" : "text-slate hover:bg-paper hover:text-ink"
                }`}
              >
                {t.id === "foryou" && <span aria-hidden="true">★ </span>}
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1180px] gap-x-14 gap-y-10 px-5 pt-7 pb-20 md:px-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <p className="mb-4 max-w-[64ch] text-[16px] leading-relaxed text-slate">
            The day&apos;s top stories from {outletCount} major news outlets, refreshed every 15 minutes. A story gets the{" "}
            <Seal size={16} className="inline -translate-y-px text-seal" /> when at least 3 independent newsrooms report it.
          </p>
          <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-hush">
            <span>Updated {ago(feed.generatedAt, now)}</span>
            {!feed.sample && (
              <span>
                {feed.sourcesOk} of {feed.sourcesTotal} news feeds live
              </span>
            )}
            <span>{verifiedCount} verified stories right now</span>
            <button
              role="switch"
              aria-checked={prefs.verifiedOnly}
              onClick={() => update((p) => ({ verifiedOnly: !p.verifiedOnly }))}
              className="ml-auto flex items-center gap-2 text-[14px] text-slate"
            >
              <span className={`relative h-5 w-9 rounded-full transition-colors ${prefs.verifiedOnly ? "bg-seal" : "bg-line"}`}>
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-paper transition-transform ${prefs.verifiedOnly ? "translate-x-4" : ""}`} />
              </span>
              Verified only
            </button>
          </div>

          {showNudge && <Nudge prefs={prefs} update={update} onMore={() => setPanelOpen(true)} onFollow={() => setTab("foryou")} />}

          {lead ? (
            <Lead story={lead.story} interests={lead.interests} now={now} prefs={prefs} />
          ) : (
            <Empty
              tab={tab}
              onReset={() => {
                update({ verifiedOnly: false });
                setQuery("");
                setTab("top");
              }}
              onCustomize={() => setPanelOpen(true)}
            />
          )}

          {rest.length > 0 && (
            <ol className="mt-10 border-t border-line">
              {rest.map(({ story, interests }) => (
                <StoryRow key={story.id} story={story} interests={interests} now={now} edition={edition} showCategory={tab === "top" || tab === "foryou"} prefs={prefs} />
              ))}
            </ol>
          )}
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <SocialRail signals={signals} stories={feed.stories} />
          <HowItWorks />
        </aside>
      </main>

      <Customize
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        prefs={prefs}
        edition={edition}
        update={update}
        reset={reset}
        outlets={outletNames}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  );
}

function Nudge({ prefs, update, onMore, onFollow }: { prefs: Prefs; update: (p: Partial<Prefs> | ((p: Prefs) => Partial<Prefs>)) => void; onMore: () => void; onFollow: () => void }) {
  const quick = TOPICS.slice(0, 7);
  return (
    <section className="mb-8 rounded-2xl bg-paper p-5" aria-label="Pick topics">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="headline text-[22px] text-ink">Follow a few topics</h2>
          <p className="mt-0.5 text-[15px] text-slate">We&apos;ll build a For you feed from them. No sign-up.</p>
        </div>
        <button
          onClick={() => update({ nudgeDismissed: true })}
          aria-label="Dismiss"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-hush hover:bg-fog hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {quick.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              update((p) => ({ topics: p.topics.includes(t.id) ? p.topics : [...p.topics, t.id] }));
              onFollow();
            }}
            className="rounded-full border border-line px-3.5 py-1.5 text-[14.5px] text-slate hover:border-seal hover:bg-seal-tint hover:text-seal"
          >
            + {t.label}
          </button>
        ))}
        <button onClick={onMore} className="px-2 py-1.5 text-[14.5px] text-marine hover:underline">
          More topics and keywords
        </button>
      </div>
    </section>
  );
}

function Outlets({ story, max, prefs }: { story: Story; max: number; prefs: Prefs }) {
  const [open, setOpen] = useState(false);
  const all = story.outlets.filter((o) => !prefs.hiddenOutlets.includes(o.name));
  const list = open ? all : all.slice(0, max);
  const hidden = all.length - list.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {list.map((o) => (
        <a
          key={o.name}
          href={o.link}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-[13px] text-slate hover:border-slate hover:text-ink"
        >
          {o.name}
        </a>
      ))}
      {hidden > 0 && (
        <button onClick={() => setOpen(true)} className="px-1.5 text-[13px] text-marine hover:underline">
          {hidden} more
        </button>
      )}
    </div>
  );
}

function InterestTags({ interests }: { interests: string[] }) {
  if (!interests.length) return null;
  return (
    <span className="flex items-center gap-1 text-[13px] text-marine">
      <span aria-hidden="true">★</span>
      {interests.slice(0, 2).join(", ")}
    </span>
  );
}

function Lead({ story, interests, now, prefs }: { story: Story; interests: string[]; now: number; prefs: Prefs }) {
  return (
    <article key={story.id}>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <Tally count={story.independent} status={story.status} size="lg" animate />
        <p className={`pb-1 text-[15px] font-medium ${story.status === "verified" ? "text-seal" : story.status === "developing" ? "text-amber" : "text-slate"}`}>
          {statusText(story.status, story.independent)}
        </p>
      </div>
      <h1 className="headline mt-5 max-w-[22ch] text-[clamp(2.1rem,5vw,3.6rem)] leading-[1.02] text-ink">{story.headline}</h1>
      {story.summary && <p className="mt-4 max-w-[62ch] text-[18px] leading-[1.6] text-slate">{story.summary}</p>}
      <div className="mt-5">
        <Outlets story={story} max={8} prefs={prefs} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-hush">
        <span>First reported {ago(story.firstSeen, now)}</span>
        {story.social.length > 0 && (
          <span className="flex items-center gap-1.5">
            Also trending on
            {story.social.map((p) => (
              <PlatformGlyph key={p} platform={p} size={20} />
            ))}
          </span>
        )}
        <InterestTags interests={interests} />
      </div>
    </article>
  );
}

function StoryRow({
  story,
  interests,
  now,
  edition,
  showCategory,
  prefs,
}: {
  story: Story;
  interests: string[];
  now: number;
  edition: Edition;
  showCategory: boolean;
  prefs: Prefs;
}) {
  const link = story.outlets.find((o) => !prefs.hiddenOutlets.includes(o.name))?.link;
  return (
    <li className="border-b border-line py-5 sm:grid sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-x-4">
      <div className="mb-2.5 sm:mb-0 sm:pt-1.5">
        <Tally count={story.independent} status={story.status} />
      </div>
      <div>
        <h2 className="headline text-[21px] leading-[1.18] text-ink sm:text-[23px]">
          <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-marine">
            {story.headline}
          </a>
        </h2>
        {story.summary && <p className="mt-1.5 line-clamp-2 max-w-[68ch] text-[15.5px] leading-[1.55] text-slate">{story.summary}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
          <StatusLabel status={story.status} count={story.independent} />
          <Outlets story={story} max={3} prefs={prefs} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-hush">
          <span>{ago(story.latest, now)}</span>
          {showCategory && <span>{storyTag(story)}</span>}
          {story.social.length > 0 && (
            <span className="flex items-center gap-1">
              Trending on
              {story.social.map((p) => (
                <PlatformGlyph key={p} platform={p} size={18} />
              ))}
            </span>
          )}
          <InterestTags interests={interests} />
        </div>
      </div>
    </li>
  );
}

function SocialRail({ signals, stories }: { signals: SocialSignal[]; stories: Story[] }) {
  const byId = new Map(stories.map((s) => [s.id, s]));
  const items = signals.slice(0, 12);
  return (
    <section aria-labelledby="rising" className="rounded-2xl bg-paper p-5">
      <h2 id="rising" className="headline text-[22px] text-ink">
        Rising on social
      </h2>
      <p className="mt-1 text-[14px] leading-snug text-slate">What people are searching and sharing. Social posts never count toward the tick.</p>
      {items.length === 0 ? (
        <p className="mt-4 text-[14px] text-hush">Social trends couldn&apos;t be loaded. They&apos;ll appear on the next refresh.</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {items.map((s) => {
            const story = s.storyId ? byId.get(s.storyId) : undefined;
            return (
              <li key={s.id} className="flex gap-3">
                <PlatformGlyph platform={s.platform} />
                <div className="min-w-0">
                  <a href={s.link} target="_blank" rel="noopener noreferrer" className="block text-[15px] leading-snug text-ink hover:text-marine">
                    {s.title}
                  </a>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-[12.5px] text-hush">
                    {s.metric && <span>{s.metric}</span>}
                    {story ? (
                      <span className={story.status === "verified" ? "text-seal" : "text-amber"}>
                        {story.status === "verified" ? "Matches a verified story" : "In the news, not verified yet"}
                      </span>
                    ) : (
                      <span>Not in the news yet</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-[12.5px] text-hush">
        From {[...new Set(signals.map((s) => s.platform))].map(platformName).join(", ") || "social platforms"}
      </p>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mt-5 px-1 text-[14px] leading-relaxed text-slate">
      <h2 className="mb-2 flex items-center gap-2 font-medium text-ink">
        <Seal size={18} className="text-seal" />
        How the tick works
      </h2>
      <p>
        Each mark is one news organisation reporting the story. At three independent organisations, the story is verified. Outlets owned by the
        same group count once.
      </p>
      <p className="mt-2">Verified means widely reported, not proven true. Open the outlets to read the original reporting.</p>
    </section>
  );
}

function Empty({ tab, onReset, onCustomize }: { tab: Tab; onReset: () => void; onCustomize: () => void }) {
  if (tab === "foryou") {
    return (
      <div className="rounded-2xl bg-paper p-8">
        <p className="headline text-[24px] text-ink">Nothing on your topics right now</p>
        <p className="mt-2 text-slate">New stories arrive every 10 minutes. Add more topics or keywords to widen your feed.</p>
        <button onClick={onCustomize} className="mt-4 rounded-full bg-ink px-4 py-2 text-[15px] text-paper">
          Add topics
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-paper p-8">
      <p className="headline text-[24px] text-ink">No stories match these filters</p>
      <p className="mt-2 text-slate">Try another section, or turn off Verified only.</p>
      <button onClick={onReset} className="mt-4 rounded-full bg-ink px-4 py-2 text-[15px] text-paper">
        Show all stories
      </button>
    </div>
  );
}
