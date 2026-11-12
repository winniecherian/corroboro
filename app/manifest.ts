import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Corroboro",
    short_name: "Corroboro",
    description: "Trending news, cross-checked across major outlets.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1020",
    theme_color: "#0d1020",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
