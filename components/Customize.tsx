"use client";

import { useEffect, useRef, useState } from "react";
import type { Edition } from "@/lib/types";
import { EDITIONS, TOPICS, type Prefs } from "./prefs";
import { ThemePicker, type Theme } from "./theme";

export function Customize({
  open,
  onClose,
  prefs,
  edition,
  update,
  reset,
  outlets,
  theme,
  setTheme,
}: {
  open: boolean;
  onClose: () => void;
  prefs: Prefs;
  edition: Edition;
  update: (p: Partial<Prefs> | ((p: Prefs) => Partial<Prefs>)) => void;
  reset: () => void;
  outlets: string[];
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [kw, setKw] = useState("");

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (key: "topics" | "hiddenOutlets", id: string) =>
    update((p) => ({ [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] }) as Partial<Prefs>);

  const addKeyword = () => {
    const k = kw.trim();
    if (!k) return;
    update((p) => ({ keywords: p.keywords.some((x) => x.toLowerCase() === k.toLowerCase()) ? p.keywords : [...p.keywords, k] }));
    setKw("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" tabIndex={-1} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-title"
        tabIndex={-1}
        className="panel-in relative flex h-full w-full max-w-[440px] flex-col bg-paper outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 id="customize-title" className="headline text-[26px] text-ink">
            Make it yours
          </h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-slate hover:bg-fog hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <section>
            <h3 className="text-[15px] font-semibold text-ink">Edition</h3>
            <p className="mt-0.5 text-[14px] text-slate">World news for everyone, plus national news for the country you pick.</p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Edition">
              {EDITIONS.map((e) => (
                <button
                  key={e.id}
                  role="radio"
                  aria-checked={edition === e.id}
                  onClick={() => update({ edition: e.id })}
                  className={`rounded-full border px-4 py-1.5 text-[15px] ${
                    edition === e.id ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-slate hover:text-ink"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[15px] font-semibold text-ink">Appearance</h3>
            <p className="mt-0.5 text-[14px] text-slate">System follows your device's light or dark setting.</p>
            <ThemePicker theme={theme} setTheme={setTheme} />
          </section>

          <section>
            <h3 className="text-[15px] font-semibold text-ink">Topics you follow</h3>
            <p className="mt-0.5 text-[14px] text-slate">Matching stories go into your For you feed.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TOPICS.map((t) => {
                const on = prefs.topics.includes(t.id);
                return (
                  <button
                    key={t.id}
                    aria-pressed={on}
                    onClick={() => toggle("topics", t.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-[14.5px] ${
                      on ? "border-seal bg-seal-tint text-seal" : "border-line text-slate hover:border-slate hover:text-ink"
                    }`}
                  >
                    {on && <span aria-hidden="true">✓ </span>}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-[15px] font-semibold text-ink">Keywords</h3>
            <p className="mt-0.5 text-[14px] text-slate">A team, company, person or place. Stories that mention it go into For you.</p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addKeyword();
              }}
            >
              <label className="flex-1">
                <span className="sr-only">Keyword</span>
                <input
                  value={kw}
                  onChange={(e) => setKw(e.target.value)}
                  placeholder="Arsenal"
                  maxLength={40}
                  className="w-full rounded-full border border-line bg-fog px-4 py-2 text-[15px] text-ink placeholder:text-hush focus:outline-none focus-visible:outline-2 focus-visible:outline-marine"
                />
              </label>
              <button type="submit" className="rounded-full bg-ink px-4 py-2 text-[15px] text-paper">
                Add
              </button>
            </form>
            {prefs.keywords.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {prefs.keywords.map((k) => (
                  <li key={k}>
                    <button
                      onClick={() => update((p) => ({ keywords: p.keywords.filter((x) => x !== k) }))}
                      className="flex items-center gap-1.5 rounded-full bg-seal-tint px-3 py-1 text-[14px] text-seal"
                      aria-label={`Remove ${k}`}
                    >
                      {k}
                      <span aria-hidden="true" className="text-[16px] leading-none">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-[15px] font-semibold text-ink">Default view</h3>
            <button
              role="switch"
              aria-checked={prefs.verifiedOnly}
              onClick={() => update((p) => ({ verifiedOnly: !p.verifiedOnly }))}
              className="mt-3 flex w-full items-center justify-between gap-4 text-left text-[15px] text-slate"
            >
              Show only verified stories
              <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${prefs.verifiedOnly ? "bg-seal" : "bg-line"}`}>
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-paper transition-transform ${prefs.verifiedOnly ? "translate-x-4" : ""}`} />
              </span>
            </button>
          </section>

          {outlets.length > 0 && (
            <section>
              <h3 className="text-[15px] font-semibold text-ink">Outlets</h3>
              <p className="mt-0.5 text-[14px] text-slate">
                Tap an outlet to hide its links. Hidden outlets still count toward the tick, so verification stays honest.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {outlets.map((o) => {
                  const hidden = prefs.hiddenOutlets.includes(o);
                  return (
                    <button
                      key={o}
                      aria-pressed={hidden}
                      onClick={() => toggle("hiddenOutlets", o)}
                      className={`rounded-full border px-3 py-1 text-[14px] ${
                        hidden ? "border-line bg-fog text-hush line-through" : "border-line text-slate hover:border-slate hover:text-ink"
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p className="text-[13px] text-hush">Saved in this browser. No account needed.</p>
          <div className="flex shrink-0 gap-2">
            <button onClick={reset} className="rounded-full px-3 py-2 text-[14px] text-slate hover:text-ink">
              Reset
            </button>
            <button onClick={onClose} className="rounded-full bg-ink px-5 py-2 text-[15px] text-paper">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
