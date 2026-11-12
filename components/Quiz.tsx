"use client";

import { useEffect, useRef, useState } from "react";
import type { Story } from "@/lib/types";
import { SITE_URL } from "./interactive";

export type QuizQuestion = {
  prompt: string;
  context?: string; // the headline the question is about
  options: string[];
  answer: number;
  explain: string;
  link?: string;
};

const BEST_KEY = "corroboro:quiz:best";

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function short(s: string, n = 96) {
  return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s;
}

/**
 * Builds five factual questions from the live verified stories.
 * Every answer comes straight from the data on the page (outlet counts, who reported first, sections, social trends).
 */
export function buildQuiz(stories: Story[], tagOf: (s: Story) => string, rnd: () => number = Math.random): QuizQuestion[] {
  const verified = stories.filter((s) => s.status === "verified");
  if (verified.length < 6) return [];
  const used = new Set<string>();
  const take = (pred: (s: Story) => boolean) => {
    const s = shuffle(verified, rnd).find((x) => !used.has(x.id) && pred(x));
    if (s) used.add(s.id);
    return s;
  };
  const qs: QuizQuestion[] = [];

  // 1. Most outlets
  const byCount = new Map<number, Story>();
  shuffle(verified, rnd).forEach((s) => !byCount.has(s.independent) && byCount.set(s.independent, s));
  const distinct = [...byCount.values()].slice(0, 4);
  if (distinct.length === 4) {
    const top = distinct.reduce((a, b) => (b.independent > a.independent ? b : a));
    const opts = shuffle(distinct, rnd);
    distinct.forEach((s) => used.add(s.id));
    qs.push({
      prompt: "Which of these stories has been confirmed by the most independent newsrooms right now?",
      options: opts.map((s) => short(s.headline)),
      answer: opts.indexOf(top),
      explain: `${top.independent} independent outlets reported it, including ${top.outlets.slice(0, 3).map((o) => o.name).join(", ")}.`,
      link: top.outlets[0]?.link,
    });
  }

  // 2. Who reported first
  const firstQ = take((s) => s.outlets.length >= 4 && s.outlets[1].publishedAt - s.outlets[0].publishedAt >= 60_000);
  if (firstQ) {
    const four = firstQ.outlets.slice(0, 4).map((o) => o.name);
    const opts = shuffle(four, rnd);
    qs.push({
      prompt: "Which outlet reported this story first?",
      context: firstQ.headline,
      options: opts,
      answer: opts.indexOf(four[0]),
      explain: `${four[0]} had it first; ${four[1]} followed ${Math.round((firstQ.outlets[1].publishedAt - firstQ.outlets[0].publishedAt) / 60_000)} minutes later.`,
      link: firstQ.outlets[0].link,
    });
  }

  // 3. How many outlets
  const countQ = take((s) => s.independent >= 3);
  if (countQ) {
    const n = countQ.independent;
    const pool = [n - 2, n - 1, n + 1, n + 2, n + 3].filter((x) => x >= 1 && x !== n);
    const opts = shuffle([n, ...shuffle(pool, rnd).slice(0, 3)], rnd).map(String);
    qs.push({
      prompt: "How many independent newsrooms have confirmed this story?",
      context: countQ.headline,
      options: opts,
      answer: opts.indexOf(String(n)),
      explain: `${n}: ${countQ.outlets.map((o) => o.name).slice(0, 6).join(", ")}${countQ.outlets.length > 6 ? " and more" : ""}.`,
      link: countQ.outlets[0]?.link,
    });
  }

  // 4. Section
  const secQ = take(() => true);
  if (secQ) {
    const right = tagOf(secQ);
    const others = shuffle(["World", "Business", "Tech", "Science", "Sports", "Entertainment", "US", "UK", "India"].filter((x) => x !== right), rnd).slice(0, 3);
    const opts = shuffle([right, ...others], rnd);
    qs.push({
      prompt: "Which section does this story belong to?",
      context: secQ.headline,
      options: opts,
      answer: opts.indexOf(right),
      explain: `It's filed under ${right}.`,
      link: secQ.outlets[0]?.link,
    });
  }

  // 5. Trending on social (falls back to another "how many" question)
  const trending = verified.find((s) => s.social.length > 0 && !used.has(s.id));
  const quiet = shuffle(verified.filter((s) => s.social.length === 0 && !used.has(s.id) && s !== trending), rnd).slice(0, 3);
  if (trending && quiet.length === 3) {
    used.add(trending.id);
    const opts = shuffle([trending, ...quiet], rnd);
    qs.push({
      prompt: "Which of these stories is also trending on social media?",
      options: opts.map((s) => short(s.headline)),
      answer: opts.indexOf(trending),
      explain: `People are also searching for or sharing it on ${trending.social.map((p) => ({ google: "Google", x: "X", reddit: "Reddit", hackernews: "Hacker News" })[p]).join(" and ")}.`,
      link: trending.outlets[0]?.link,
    });
  } else {
    const extra = take((s) => s.independent >= 3);
    if (extra) {
      const n = extra.independent;
      const opts = shuffle([n, n + 2, Math.max(1, n - 1), n + 4].filter((v, i, a) => a.indexOf(v) === i), rnd).map(String);
      qs.push({
        prompt: "How many independent newsrooms have confirmed this story?",
        context: extra.headline,
        options: opts,
        answer: opts.indexOf(String(n)),
        explain: `${n} outlets reported it.`,
        link: extra.outlets[0]?.link,
      });
    }
  }

  return qs.slice(0, 5);
}

export function QuizCard({ available, onStart }: { available: boolean; onStart: () => void }) {
  const [best, setBest] = useState<string | null>(null);
  useEffect(() => {
    try {
      setBest(localStorage.getItem(BEST_KEY));
    } catch {}
  }, []);
  if (!available) return null;
  return (
    <section className="mb-5 rounded-2xl border border-line p-5">
      <h2 className="headline text-[22px] text-ink">Today in 5 questions</h2>
      <p className="mt-1 text-[14px] leading-snug text-slate">How closely have you followed today&apos;s news? Takes about a minute.</p>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={onStart} className="rounded-full bg-ink px-4 py-2 text-[15px] text-paper">
          Start the quiz
        </button>
        {best && <span className="text-[13px] text-hush">Your best: {best}/5</span>}
      </div>
    </section>
  );
}

export function QuizDialog({ questions, onClose }: { questions: QuizQuestion[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const q = questions[i];

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [onClose]);

  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (i + 1 < questions.length) {
      setI(i + 1);
      setPicked(null);
    } else {
      setDone(true);
      try {
        const best = Number(localStorage.getItem(BEST_KEY) || 0);
        if (score > best) localStorage.setItem(BEST_KEY, String(score));
      } catch {}
    }
  };

  const shareText = `I got ${score}/${questions.length} on today's Corroboro news quiz.`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${SITE_URL}`);
      setCopied(true);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button aria-label="Close quiz" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
        tabIndex={-1}
        className="pop-in relative w-full max-w-[560px] rounded-3xl bg-paper p-6 outline-none sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 id="quiz-title" className="text-[14px] text-hush">
            {done ? "Today in 5 questions" : `Question ${i + 1} of ${questions.length}`}
          </h2>
          <button onClick={onClose} aria-label="Close quiz" className="grid h-9 w-9 place-items-center rounded-full text-slate hover:bg-fog hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {questions.map((_, k) => (
            <span key={k} className={`h-1 flex-1 rounded-full ${k < i || done ? "bg-seal" : k === i ? "bg-ink" : "bg-line"}`} />
          ))}
        </div>

        {done ? (
          <div className="mt-6">
            <p className="headline text-[44px] leading-none text-ink">
              {score}/{questions.length}
            </p>
            <p className="mt-3 text-[16px] text-slate">
              {score === questions.length ? "Perfect. You're on top of today's news." : score >= 3 ? "Nicely done. You've been paying attention." : "A few surprises today. The stories are all on the page."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                className="rounded-full border border-line px-4 py-2 text-[14.5px] text-slate hover:border-slate hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(SITE_URL)}`}
              >
                Post on X
              </a>
              <a
                className="rounded-full border border-line px-4 py-2 text-[14.5px] text-slate hover:border-slate hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${SITE_URL}`)}`}
              >
                WhatsApp
              </a>
              <button onClick={copy} className="rounded-full border border-line px-4 py-2 text-[14.5px] text-slate hover:border-slate hover:text-ink">
                {copied ? "Copied" : "Copy result"}
              </button>
              <button onClick={onClose} className="ml-auto rounded-full bg-ink px-5 py-2 text-[15px] text-paper">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <p className="headline text-[24px] leading-tight text-ink">{q.prompt}</p>
            {q.context && <p className="mt-3 rounded-xl bg-fog px-4 py-3 text-[15px] leading-snug text-slate">{q.context}</p>}
            <div className="mt-5 grid gap-2">
              {q.options.map((o, k) => {
                const state = picked === null ? "idle" : k === q.answer ? "right" : k === picked ? "wrong" : "dim";
                const cls =
                  state === "right"
                    ? "border-seal bg-seal-tint text-seal"
                    : state === "wrong"
                      ? "border-amber bg-amber-tint text-amber"
                      : state === "dim"
                        ? "border-line text-hush"
                        : "border-line text-ink hover:border-slate";
                return (
                  <button
                    key={k}
                    onClick={() => pick(k)}
                    disabled={picked !== null && state === "dim"}
                    className={`rounded-xl border px-4 py-3 text-left text-[15.5px] leading-snug transition-colors ${cls}`}
                  >
                    {state === "right" && <span aria-hidden="true">✓ </span>}
                    {o}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="reveal mt-5 flex flex-wrap items-center justify-between gap-3" aria-live="polite">
                <p className="max-w-[40ch] text-[14.5px] text-slate">
                  <span className={`font-medium ${picked === q.answer ? "text-seal" : "text-amber"}`}>{picked === q.answer ? "Correct. " : "Not quite. "}</span>
                  {q.explain}{" "}
                  {q.link && (
                    <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-marine hover:underline">
                      Read it
                    </a>
                  )}
                </p>
                <button onClick={next} className="rounded-full bg-ink px-5 py-2 text-[15px] text-paper">
                  {i + 1 < questions.length ? "Next question" : "See my score"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
