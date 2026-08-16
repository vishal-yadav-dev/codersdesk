import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coder Desk | Music and IDE for Practice",
  description:
    "Practice DSA and other problems in a live multi-language IDE, reveal detailed solutions, and code to a switchable music playlist. One developer's desk, every hour of the day.",
  openGraph: {
    title: "Coder Desk | Music and IDE for Practice",
    description:
      "Practice DSA and other problems in a live multi-language IDE, with a switchable music playlist. One developer's desk, every hour of the day.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coder Desk | Music and IDE for Practice",
    description:
      "Practice DSA and interview problems in a live IDE, with a switchable music playlist.",
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
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
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
