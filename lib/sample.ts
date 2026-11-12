import type { Category, Feed, Region, SocialPlatform, SocialSignal, Status, Story } from "./types";

/**
 * Placeholder stories used only when live feeds can't be reached (offline, blocked network).
 * The UI shows a clear "sample stories" banner whenever these are on screen. They are not real news.
 */
type Row = [string, string, Category, Region[], string[], number, SocialPlatform[]?];

const ROWS: Row[] = [
  ["Central bank holds interest rates steady, signals cuts may come next year", "Policymakers kept the benchmark rate unchanged for a third meeting and said inflation is easing faster than expected.", "business", ["global", "us"], ["New York Times", "CNBC", "MarketWatch", "BBC News", "The Guardian", "NPR", "Axios"], 1.2, ["google", "reddit"]],
  ["Leaders agree to extend ceasefire talks for another two weeks", "Negotiators said progress was made on prisoner exchanges, but border arrangements remain unresolved.", "world", ["global"], ["BBC News", "Al Jazeera", "The Guardian", "DW", "France 24", "NPR"], 3, ["reddit"]],
  ["Senate passes bipartisan bill to fund bridge and rail repairs", "The measure now goes to the House, where leaders say a vote is expected before the holiday recess.", "nation", ["us"], ["New York Times", "NPR", "ABC News", "CBS News", "PBS News"], 2, ["google"]],
  ["Chipmaker unveils low-power AI processor for laptops", "The company claims double the battery life on AI tasks compared with its previous generation.", "tech", ["global"], ["The Verge", "Ars Technica", "TechCrunch", "BBC News"], 4, ["hackernews", "reddit"]],
  ["Rail strike set to disrupt commuter services across England next week", "Unions confirmed three days of walkouts after talks over pay and working conditions broke down.", "nation", ["uk"], ["BBC News", "Sky News", "The Guardian", "The Independent"], 2.5, ["google", "x"]],
  ["Telescope captures sharpest image yet of a planet-forming disc", "Astronomers say gaps in the disc suggest at least two young planets are already taking shape.", "science", ["global"], ["BBC News", "New York Times", "NPR", "The Guardian"], 5, ["reddit"]],
  ["Underdogs win the final with a stoppage-time goal", "The late header completed a comeback from two goals down and ended a 30-year wait for a trophy.", "sports", ["global", "uk"], ["BBC Sport", "Sky Sports", "The Guardian", "ESPN"], 6, ["google", "x"]],
  ["Streaming service raises prices in several markets", "Subscribers will pay up to 15% more from next month; the company cited rising content costs.", "entertainment", ["global"], ["Variety", "BBC News"], 7, ["reddit"]],
  ["Monsoon session of Parliament opens with debate on data protection rules", "Opposition parties sought changes to consent provisions as the government tabled amendments on the first day.", "nation", ["india"], ["The Hindu", "Hindustan Times", "Indian Express", "NDTV"], 3, ["google"]],
  ["Wildfires force evacuation of coastal towns as winds pick up", "Firefighters warned the next 48 hours will be critical as temperatures stay above seasonal averages.", "world", ["global", "us"], ["The Guardian", "Sky News", "NPR", "New York Times", "CBS News"], 8],
  ["Open-source browser engine reaches first stable release", "Developers say the engine now passes most of the major web compatibility tests.", "tech", ["global"], ["Ars Technica"], 3.5, ["hackernews"]],
  ["Unconfirmed reports of a merger between two airlines", "Neither company has commented; a single outlet cited people familiar with the talks.", "business", ["us"], ["Axios"], 1.5, ["x"]],
  ["Film festival announces opening night lineup", "Organisers said this year's programme features a record number of debut directors.", "entertainment", ["global"], ["Variety", "The Guardian", "New York Times"], 9],
  ["Study links shorter commutes to better sleep", "Researchers tracked 20,000 workers for two years and found each extra 10 minutes of travel cut sleep slightly.", "science", ["global"], ["The Guardian", "NPR"], 10],
  ["Government sets out plan to cut NHS waiting lists", "Ministers promised 2 million extra appointments a year, funded partly by new diagnostic centres.", "nation", ["uk"], ["BBC News", "The Guardian", "Sky News"], 11],
  ["India seal series win with a five-wicket victory", "A century from the opener saw the hosts chase down the target with an over to spare.", "sports", ["india", "global"], ["ESPNcricinfo", "BBC Sport", "The Hindu"], 5.5, ["google"]],
];

const SIGNALS: [SocialPlatform, Region, string, string, number?][] = [
  ["google", "us", "interest rates", "200K+ searches", 0],
  ["google", "uk", "rail strike dates", "100K+ searches", 4],
  ["x", "uk", "#RailStrike", "48K posts", 4],
  ["reddit", "global", "Ceasefire talks extended for two more weeks", "41K upvotes · r/worldnews", 1],
  ["hackernews", "global", "New low-power AI chip for laptops — benchmarks inside", "612 points", 3],
  ["google", "uk", "cup final result", "500K+ searches", 6],
  ["x", "us", "#AirlineMerger", "22K posts", 11],
  ["reddit", "us", "Bridge and rail repair bill: what's in it", "18K upvotes · r/news", 2],
  ["hackernews", "global", "Show HN: I built a terminal-based RSS reader", "388 points"],
  ["google", "us", "gold price today", "100K+ searches"],
  ["reddit", "global", "Scientists map the deepest cave system yet found", "28K upvotes · r/science"],
  ["google", "india", "India vs final match", "500K+ searches", 15],
  ["reddit", "india", "Data protection debate: key changes explained", "6K upvotes · r/india", 8],
];

export function sampleFeed(ok = 0, total = 0): Feed {
  const now = Date.now();
  const stories: Story[] = ROWS.map(([headline, summary, category, regions, outlets, ageH, social = []], i) => {
    const independent = outlets.length;
    const status: Status = independent >= 3 ? "verified" : independent === 2 ? "developing" : "single";
    return {
      id: `sample-${i}`,
      headline,
      summary,
      category,
      regions,
      status,
      independent,
      outlets: outlets.map((name) => ({ name, link: "#" })),
      firstSeen: now - (ageH + 2) * 3_600_000,
      latest: now - ageH * 3_600_000,
      score: (independent * 10 + outlets.length * 2) * Math.exp(-ageH / 14) * (1 + social.length * 0.25),
      social,
    };
  }).sort((a, b) => b.score - a.score);

  const signals: SocialSignal[] = SIGNALS.map(([platform, region, title, metric, storyIdx], i) => ({
    id: `sig-${i}`,
    platform,
    region,
    title,
    link: "#",
    metric,
    storyId: storyIdx !== undefined ? `sample-${storyIdx}` : undefined,
  }));

  return { generatedAt: now, sample: true, stories, signals, sourcesOk: ok, sourcesTotal: total };
}
