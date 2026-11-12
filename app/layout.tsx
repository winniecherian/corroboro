import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";
import { themeBootScript } from "@/components/theme";

export const metadata: Metadata = {
  metadataBase: new URL("https://corroboro.web.app"),
  title: "Corroboro — trending news, cross-checked",
  description:
    "A news aggregator: the day's top stories from major news outlets, refreshed every 10 minutes. A story gets a tick when at least three independent newsrooms report it.",
  openGraph: {
    title: "Corroboro — trending news, cross-checked",
    description: "Top stories from major news outlets. A tick means at least three independent newsrooms reported it.",
    url: "https://corroboro.web.app",
    siteName: "Corroboro",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Corroboro — trending news, cross-checked" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corroboro — trending news, cross-checked",
    description: "Top stories from major news outlets. A tick means at least three independent newsrooms reported it.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1020",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
