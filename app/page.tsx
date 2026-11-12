import { Corroboro } from "@/components/Corroboro";
import { getFeed } from "@/lib/feed";

export const revalidate = 600;

export default async function Home() {
  const feed = await getFeed();
  return <Corroboro feed={feed} />;
}
