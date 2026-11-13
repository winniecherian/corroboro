"use client";

import { useEffect, useRef, useState } from "react";
import type { Story } from "@/lib/types";
import { BreakingLabel, Seal, StatusLabel } from "./marks";
import { ago } from "./interactive";

/** Smoothly scrolls to a story already on the page and flashes it. */
export function jumpToStory(id: string) {
  const el = document.getElementById(`story-${id}`);
  if (!el) return;
  const offset = 150; // keeps it clear of the sticky header
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
  el.classList.remove("flash");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("flash");
}

/** Roughly when a story reached its tick: when the third outlet reported it. */
export function verifiedAt(s: Story): number | null {
  return s.status === "verified" && s.outlets.length >= 3 ? s.outlets[2].publishedAt : null;
}
export function justVerified(s: Story, now: number) {
  const t = verifiedAt(s);
  return t !== null && now - t <= 30 * 60_000;
}
/** Two outlets so far, with newsrooms still joining: about to get the tick. */
export function isRising(s: Story, now: number) {
  return s.status === "developing" && (s.recent ?? 0) >= 2 && now - s.latest <= 2 * 3_600_000;
}

/* ------------------------------------------------------------ Right now strip */

export function RightNow({ stories, now }: { stories: Story[]; now: number }) {
  if (stories.length < 2) return null;
  return (
    <section aria-label="Right now" className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink">
        <span className="h-2 w-2 animate-pulse rounded-full bg-seal" />
        Right now
        <span className="font-normal text-hush">Swipe for the biggest verified stories</span>
      </h2>
      <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 md:-mx-0 md:px-0">
        {stories.map((s, i) => (
          <li key={s.id} className="w-[78%] shrink-0 snap-start sm:w-[300px]">
            <button
              onClick={() => jumpToStory(s.id)}
              className={`flex h-full w-full flex-col rounded-2xl border bg-paper p-4 text-left transition-colors hover:border-seal ${
                i === 0 ? "glow border-seal/60" : "border-line"
              }`}
            >
              <span className="mb-2 flex items-center gap-2">
                {s.breaking ? <BreakingLabel /> : <StatusLabel status={s.status} count={s.independent} />}
              </span>
              <span className="headline line-clamp-4 text-[19px] leading-[1.2] text-ink">{s.headline}</span>
              <span className="mt-auto pt-3 text-[13px] text-hush">
                {s.independent} outlets · {ago(s.latest, now)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ Headline ticker */

export function Ticker({ stories }: { stories: Story[] }) {
  const label = stories.length > 0 && stories.every((s) => s.breaking) ? "Breaking" : "Latest verified";
  if (stories.length === 0) return null;
  const items = stories.slice(0, 8);
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((s) => (
        <li key={s.id} className="flex items-center">
          <button
            tabIndex={hidden ? -1 : 0}
            onClick={() => jumpToStory(s.id)}
            className="whitespace-nowrap px-5 text-[14.5px] text-ink hover:text-seal"
          >
            {s.headline}
          </button>
          <Seal size={12} className="shrink-0 text-seal" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="ticker border-b border-line bg-paper" role="region" aria-label="Headline ticker">
      <div className="mx-auto flex max-w-[1180px] items-center">
        <span className="z-10 flex shrink-0 items-center gap-2 bg-seal px-4 py-2 text-[13px] font-semibold text-paper">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper" />
          {label}
        </span>
        <div className="ticker-track relative flex-1 overflow-hidden py-2">
          <div className="ticker-move flex w-max">
            {row(false)}
            {row(true)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Brief mode */

export function BriefView({
  stories,
  now,
  hidden,
  onClose,
}: {
  stories: Story[];
  now: number;
  hidden: string[];
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const list = stories.slice(0, 30);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const h = box.current?.clientHeight ?? 0;
        box.current?.scrollBy({ top: e.key === "ArrowDown" ? h : -h, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-fog" role="dialog" aria-modal="true" aria-label="Brief: one story at a time">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
        <span className="rounded-full bg-paper px-3 py-1 text-[14px] text-slate">
          {Math.min(index + 1, list.length)} of {list.length}
        </span>
        <button onClick={onClose} className="rounded-full bg-ink px-4 py-1.5 text-[15px] text-paper">
          Close
        </button>
      </div>
      <div
        ref={box}
        tabIndex={-1}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollTop / e.currentTarget.clientHeight))}
        className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none"
      >
        {list.map((s, i) => {
          const link = s.outlets.find((o) => !hidden.includes(o.name))?.link ?? s.outlets[0]?.link;
          return (
            <section key={s.id} className="mx-auto flex h-full max-w-[720px] snap-start flex-col justify-center px-6 pt-16 pb-12">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {s.breaking && <BreakingLabel />}
                <StatusLabel status={s.status} count={s.independent} />
                <span className="text-[14px] text-hush">{ago(s.latest, now)}</span>
              </div>
              <h2 className="headline text-[clamp(1.9rem,6vw,3rem)] leading-[1.06] text-ink">{s.headline}</h2>
              {s.summary && <p className="mt-5 line-clamp-5 text-[18px] leading-[1.55] text-slate">{s.summary}</p>}
              <p className="mt-5 text-[14px] text-hush">
                {s.outlets
                  .slice(0, 4)
                  .map((o) => o.name)
                  .join(", ")}
                {s.outlets.length > 4 ? ` and ${s.outlets.length - 4} more` : ""}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="rounded-full bg-seal px-5 py-2.5 text-[16px] font-medium text-paper">
                    Read the story
                  </a>
                )}
                {i < list.length - 1 && <span className="text-[14px] text-hush">Swipe up for the next story</span>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Back to top */

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 900);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="pop-in fixed right-4 bottom-5 z-30 flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[15px] text-paper shadow-lg"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      Top
    </button>
  );
}
