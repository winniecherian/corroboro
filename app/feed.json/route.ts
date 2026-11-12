import { getFeed } from "@/lib/feed";

// Served as a static /feed.json. Open pages poll it to show new stories without a reload.
export const dynamic = "force-static";
export const revalidate = 600;

export async function GET() {
  const feed = await getFeed();
  return Response.json(feed);
}
