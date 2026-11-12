import type { Story } from "./types";

/**
 * Optional: Claude rewrites the top stories with a neutral headline and a 2-sentence summary
 * based only on the outlets' own headlines and snippets. Runs only when ANTHROPIC_API_KEY is set.
 */
export async function summarizeTop(stories: Story[], limit = 15): Promise<void> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return;
  const targets = stories.filter((s) => s.independent >= 2).slice(0, limit);
  if (!targets.length) return;

  const input = targets.map((s, i) => ({ i, headline: s.headline, snippet: s.summary, outlets: s.outlets.map((o) => o.name) }));
  const prompt = `You edit a news aggregator. For each story below, write a neutral, factual headline (max 14 words, no clickbait, no opinion) and a summary of at most 2 short sentences. Use ONLY the information given; do not add facts. Reply with JSON only: [{"i":0,"headline":"...","summary":"..."}]\n\n${JSON.stringify(input)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
    for (const r of json as { i: number; headline: string; summary: string }[]) {
      const s = targets[r.i];
      if (s && r.headline) {
        s.headline = r.headline;
        if (r.summary) s.summary = r.summary;
      }
    }
  } catch (e) {
    console.warn(`[corroboro] summaries skipped — ${String(e).slice(0, 160)}`);
  }
}
