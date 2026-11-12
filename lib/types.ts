export type Category = "world" | "nation" | "business" | "tech" | "science" | "sports" | "entertainment";

/** Where an outlet or story is focused. "global" = international coverage. */
export type Region = "global" | "us" | "uk" | "india";

/** Reader-facing edition. Global shows international news; the others add that country's national news. */
export type Edition = "global" | "us" | "uk" | "india";

export type Source = {
  id: string;
  name: string;
  url: string;
  category: Category;
  region: Region;
  /** Owner / media group. Outlets with the same group count as ONE independent source. */
  group: string;
};

export type Article = {
  id: string;
  sourceId: string;
  sourceName: string;
  group: string;
  category: Category;
  region: Region;
  title: string;
  summary: string;
  link: string;
  publishedAt: number; // epoch ms
};

export type Status = "verified" | "developing" | "single";

export type StoryOutlet = { name: string; link: string };

export type Story = {
  id: string;
  headline: string;
  summary: string;
  category: Category;
  regions: Region[];
  status: Status;
  /** Number of independent media groups reporting it */
  independent: number;
  outlets: StoryOutlet[];
  firstSeen: number;
  latest: number;
  score: number;
  /** Social platforms where this story is also trending */
  social: SocialPlatform[];
};

export type SocialPlatform = "reddit" | "hackernews" | "google" | "x";

export type SocialSignal = {
  id: string;
  platform: SocialPlatform;
  region: Region;
  title: string;
  link: string;
  metric?: string;
  /** Matched to a news story? */
  storyId?: string;
};

export type Feed = {
  generatedAt: number;
  sample: boolean;
  stories: Story[];
  signals: SocialSignal[];
  sourcesOk: number;
  sourcesTotal: number;
};
