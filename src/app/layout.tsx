import type { Metadata } from "next";
import "./globals.css";
import RedditPixel from "@/components/RedditPixel";

export const metadata: Metadata = {
  title: "DestinyVox — Your Personal Numerology Reading",
  description:
    "Discover the patterns in your name and birth date with a personalized numerology reading.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=JetBrains+Mono:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <RedditPixel />
        {children}
      </body>
    </html>
  );
}
