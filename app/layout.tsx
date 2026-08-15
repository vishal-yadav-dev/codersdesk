import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "the coder desk — one dev's desk, every hour of the day",
  description:
    "One developer's desk, every hour of the day. Same desk, same chair — the light, the screen and the sound are what change. Visit at 3am, visit at 9am.",
  openGraph: {
    title: "the coder desk",
    description:
      "One developer's desk, every hour of the day. Same desk — the light, the screen and the sound are what change.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "the coder desk",
    description:
      "One developer's desk, every hour of the day. The light, the screen and the sound change by the hour.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1220",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
