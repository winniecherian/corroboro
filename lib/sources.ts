import type { Source } from "./types";

/**
 * Major English-language outlets with public RSS feeds.
 * `region`: global = international desk; us / uk / india = that country's national news.
 * `group` = owner. Two outlets from the same group only count once toward the verified tick.
 * Add or remove feeds freely; a dead feed is skipped automatically.
 */
export const SOURCES: Source[] = [
  // World (international desks)
  { id: "bbc-world", name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "world", region: "global", group: "bbc" },
  { id: "guardian-world", name: "The Guardian", url: "https://www.theguardian.com/world/rss", category: "world", region: "global", group: "guardian" },
  { id: "nyt-world", name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", category: "world", region: "global", group: "nyt" },
  { id: "npr-world", name: "NPR", url: "https://feeds.npr.org/1004/rss.xml", category: "world", region: "global", group: "npr" },
  { id: "aljazeera", name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "world", region: "global", group: "al-jazeera" },
  { id: "cbs-world", name: "CBS News", url: "https://www.cbsnews.com/latest/rss/world", category: "world", region: "global", group: "paramount" },
  { id: "sky-world", name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/world.xml", category: "world", region: "global", group: "sky" },
  { id: "dw", name: "DW", url: "https://rss.dw.com/rdf/rss-en-world", category: "world", region: "global", group: "dw" },
  { id: "france24", name: "France 24", url: "https://www.france24.com/en/rss", category: "world", region: "global", group: "france-medias-monde" },

  // US
  { id: "nyt-us", name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/US.xml", category: "nation", region: "us", group: "nyt" },
  { id: "npr-us", name: "NPR", url: "https://feeds.npr.org/1003/rss.xml", category: "nation", region: "us", group: "npr" },
  { id: "abc-us", name: "ABC News", url: "https://feeds.abcnews.com/abcnews/usheadlines", category: "nation", region: "us", group: "disney" },
  { id: "cbs-us", name: "CBS News", url: "https://www.cbsnews.com/latest/rss/us", category: "nation", region: "us", group: "paramount" },
  { id: "guardian-us", name: "The Guardian", url: "https://www.theguardian.com/us-news/rss", category: "nation", region: "us", group: "guardian" },
  { id: "pbs", name: "PBS News", url: "https://www.pbs.org/newshour/feeds/rss/headlines", category: "nation", region: "us", group: "pbs" },
  { id: "axios", name: "Axios", url: "https://api.axios.com/feed/", category: "nation", region: "us", group: "axios" },

  // UK
  { id: "bbc-uk", name: "BBC News", url: "https://feeds.bbci.co.uk/news/uk/rss.xml", category: "nation", region: "uk", group: "bbc" },
  { id: "guardian-uk", name: "The Guardian", url: "https://www.theguardian.com/uk-news/rss", category: "nation", region: "uk", group: "guardian" },
  { id: "sky-uk", name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/uk.xml", category: "nation", region: "uk", group: "sky" },
  { id: "independent-uk", name: "The Independent", url: "https://www.independent.co.uk/news/uk/rss", category: "nation", region: "uk", group: "independent" },

  // India
  { id: "thehindu", name: "The Hindu", url: "https://www.thehindu.com/news/national/feeder/default.rss", category: "nation", region: "india", group: "the-hindu" },
  { id: "indianexpress", name: "Indian Express", url: "https://indianexpress.com/section/india/feed/", category: "nation", region: "india", group: "indian-express" },
  { id: "ndtv", name: "NDTV", url: "https://feeds.feedburner.com/ndtvnews-top-stories", category: "nation", region: "india", group: "ndtv" },
  { id: "ht-india", name: "Hindustan Times", url: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", category: "nation", region: "india", group: "ht-media" },
  { id: "bbc-india", name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/asia/india/rss.xml", category: "nation", region: "india", group: "bbc" },

  // Business
  { id: "cnbc", name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", category: "business", region: "global", group: "nbcuniversal" },
  { id: "bbc-business", name: "BBC News", url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "business", region: "global", group: "bbc" },
  { id: "guardian-business", name: "The Guardian", url: "https://www.theguardian.com/business/rss", category: "business", region: "global", group: "guardian" },
  { id: "marketwatch", name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", category: "business", region: "us", group: "dow-jones" },
  { id: "nyt-business", name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", category: "business", region: "global", group: "nyt" },

  // Tech
  { id: "verge", name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "tech", region: "global", group: "vox-media" },
  { id: "techcrunch", name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "tech", region: "global", group: "yahoo" },
  { id: "ars", name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", category: "tech", region: "global", group: "conde-nast" },
  { id: "wired", name: "Wired", url: "https://www.wired.com/feed/rss", category: "tech", region: "global", group: "conde-nast" },
  { id: "bbc-tech", name: "BBC News", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", category: "tech", region: "global", group: "bbc" },
  { id: "guardian-tech", name: "The Guardian", url: "https://www.theguardian.com/technology/rss", category: "tech", region: "global", group: "guardian" },

  // Science
  { id: "bbc-science", name: "BBC News", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", category: "science", region: "global", group: "bbc" },
  { id: "guardian-science", name: "The Guardian", url: "https://www.theguardian.com/science/rss", category: "science", region: "global", group: "guardian" },
  { id: "npr-science", name: "NPR", url: "https://feeds.npr.org/1007/rss.xml", category: "science", region: "global", group: "npr" },
  { id: "nyt-science", name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml", category: "science", region: "global", group: "nyt" },

  // Sports
  { id: "bbc-sport", name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml", category: "sports", region: "global", group: "bbc" },
  { id: "guardian-sport", name: "The Guardian", url: "https://www.theguardian.com/sport/rss", category: "sports", region: "global", group: "guardian" },
  { id: "espn", name: "ESPN", url: "https://www.espn.com/espn/rss/news", category: "sports", region: "us", group: "disney" },
  { id: "sky-sports", name: "Sky Sports", url: "https://www.skysports.com/rss/12040", category: "sports", region: "uk", group: "sky" },
  { id: "cricinfo", name: "ESPNcricinfo", url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml", category: "sports", region: "global", group: "disney" },

  // Entertainment
  { id: "bbc-ent", name: "BBC News", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", category: "entertainment", region: "global", group: "bbc" },
  { id: "guardian-culture", name: "The Guardian", url: "https://www.theguardian.com/culture/rss", category: "entertainment", region: "global", group: "guardian" },
  { id: "variety", name: "Variety", url: "https://variety.com/feed/", category: "entertainment", region: "global", group: "pmc" },
  { id: "nyt-arts", name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml", category: "entertainment", region: "global", group: "nyt" },
];

/** Independent outlets needed for the verified tick */
export const VERIFIED_MIN = 3;
