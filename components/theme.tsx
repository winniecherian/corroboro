"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";
const KEY = "corroboro:theme";

/** Runs before the page paints (inlined in <head>) so there's no white flash for dark-mode readers. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    try {
      const t = localStorage.getItem(KEY);
      if (t === "light" || t === "dark") setThemeState(t);
    } catch {}
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    const root = document.documentElement;
    if (t === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", t);
    try {
      if (t === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, t);
    } catch {}
  }, []);

  return { theme, setTheme };
}

const LABEL: Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

export function ThemeIcon({ theme, size = 18 }: { theme: Theme; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (theme === "light")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  if (theme === "dark")
    return (
      <svg {...common}>
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

/** Header button: cycles System → Light → Dark */
export function ThemeButton({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const label = `Appearance: ${LABEL[theme]}. Switch to ${LABEL[NEXT[theme]]}`;
  return (
    <button
      onClick={() => setTheme(NEXT[theme])}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper text-slate hover:border-slate hover:text-ink"
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}

/** Segmented control for the Customize panel */
export function ThemePicker({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div role="radiogroup" aria-label="Appearance" className="mt-3 inline-flex rounded-full border border-line p-1">
      {(["system", "light", "dark"] as Theme[]).map((t) => (
        <button
          key={t}
          role="radio"
          aria-checked={theme === t}
          onClick={() => setTheme(t)}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[14.5px] ${theme === t ? "bg-ink text-paper" : "text-slate hover:text-ink"}`}
        >
          <ThemeIcon theme={t} size={16} />
          {LABEL[t]}
        </button>
      ))}
    </div>
  );
}
