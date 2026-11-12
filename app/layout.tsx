import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";
import { themeBootScript } from "@/components/theme";

export const metadata: Metadata = {
  title: "Corroboro — trending news, checked against multiple outlets",
  description:
    "What's trending right now across major news outlets, Reddit, Hacker News, Google and X. A tick means at least three independent news organisations reported it.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf0f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1020" },
  ],
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
