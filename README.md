# Corroboro

Trending news from major outlets, Reddit, Hacker News, Google Trends and X, with a tick when at least 3 independent news organisations report the same story.

No login, no database. The site fetches everything on the server and refreshes every 10 minutes.

## Appearance and language

- **Appearance:** Light, Dark or System (follows the device). It's set from the button in the header or in Customize, saved in the browser, and applied before the page draws, so there's no flash.
- **English only:** news headlines and social trends written in other languages are filtered out (`lib/lang.ts`).

## Editions and preferences

- **Editions:** Global, US, UK and India. Every edition gets world news; US, UK and India add that country's national news and a matching section tab. The edition is guessed from the reader's time zone and language the first time they visit, and they can change it.
- **For you:** readers follow topics (AI, Politics, Football and so on) and their own keywords, and matching stories get a For you tab.
- **Also saved:** "Verified only" as the default view, and hidden outlets. Hidden outlets still count toward the tick.
- **Storage:** preferences are saved in the reader's browser (localStorage), so no account is needed. Topics live in `components/prefs.ts`.

## Run it on your Mac

1. Install Node.js 22 LTS from https://nodejs.org (the macOS installer works on Ventura).
2. Open Terminal in this folder and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:3000

The first load takes about 10 seconds while ~30 feeds are fetched. After that, pages load instantly from cache.

If you see the yellow "sample stories" banner, the feeds couldn't be reached. Check your internet connection, and look in Terminal for `[corroboro] feed failed` lines.

## Optional keys

Copy `.env.example` to `.env.local` and fill in what you want:

| Key | What it adds | Cost |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Neutral AI-written headlines and 2-line summaries for the top 15 stories | Small (Haiku, ~once per 10 min) |
| `X_BEARER_TOKEN` | X trending topics in the "Rising on social" rail | X API is pay-per-use; set a spend cap in the X Developer Console first |

## Go live on Firebase (free)

Corroboro deploys as a plain static site, so it runs on Firebase Hosting's free Spark plan. No server and no paid plan needed.
A GitHub Actions job rebuilds the site with fresh news every 10 minutes and redeploys it.

**One-time setup**

1. **Firebase:** create a project at https://console.firebase.google.com, then open Build → Hosting → Get started. Put your project ID in `.firebaserc`.
2. **GitHub:** create a **public** repository and push this folder to its `main` branch. Public repos get unlimited Actions minutes; a private repo's 2,000 free minutes a month would run out on a 10-minute schedule.
3. **Service account:** in the Firebase console, open Project settings → Service accounts → Generate new private key. That downloads a JSON file.
4. **GitHub secrets:** in the repo, open Settings → Secrets and variables → Actions and add:
   - `FIREBASE_SERVICE_ACCOUNT`: paste the whole JSON file
   - `FIREBASE_PROJECT_ID`: your project ID
   - Optional: `ANTHROPIC_API_KEY`, `X_BEARER_TOKEN`
5. **First deploy:** open the Actions tab → Refresh and deploy → Run workflow. When it finishes, the site is live at `https://corroboro.web.app`.
6. **Custom domain (optional):** Hosting → Add custom domain, then follow the DNS steps.

**Safety:** if the feeds can't be reached during a rebuild, the job fails on purpose and the last good version stays live. Sample stories are never published.

**Watch your traffic:** the Spark plan has a monthly data-transfer allowance. If a busy month uses it up, Firebase turns the site off until the next month instead of charging you. Check Hosting → Usage now and then, and switch to the Blaze plan (with a budget alert) if you get close.

**Deploy from your Mac instead:** `npm install -g firebase-tools`, `firebase login`, then `npm run deploy`.

## How it works

| File | Job |
| --- | --- |
| `lib/sources.ts` | The news feeds. Each has a `region` (global, us, uk, india) and a `group` (owner). Outlets in the same group count once. Add or remove feeds here. |
| `lib/ingest.ts` | Fetches and cleans all RSS feeds in parallel; dead feeds are skipped. |
| `lib/cluster.ts` | Groups articles about the same story (TF-IDF similarity on headline + snippet), then sets the status: verified (3+ independent groups), developing (2) or single source (1). |
| `lib/social.ts` | Google Trends (US, UK, India), Hacker News, Reddit, X; each tagged with a region so the rail matches the edition; matches each to a news story by keywords. Social never counts toward the tick. |
| `lib/summarize.ts` | Optional Claude rewrite of headlines and summaries. |
| `lib/feed.ts` | Ties it together and caches for `REFRESH_SECONDS`. |
| `components/` | The UI. |

Tuning: `VERIFIED_MIN` in `lib/sources.ts` (default 3), `JOIN_THRESHOLD` in `lib/cluster.ts` (raise it if unrelated stories get merged, lower it if the same story appears twice).

## Copyright

Corroboro shows only headlines, a short snippet and a link to the original article, never the full text.
