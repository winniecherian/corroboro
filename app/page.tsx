import { Corroboro } from "@/components/Corroboro";
import { getFeed } from "@/lib/feed";
import { SOURCES } from "@/lib/sources";

export const revalidate = 600;

export default async function Home() {
  const feed = await getFeed();
  const outletCount = new Set(SOURCES.map((s) => s.name)).size;
  return <Corroboro feed={feed} outletCount={outletCount} />;
}
