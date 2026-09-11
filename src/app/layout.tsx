import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DestinyVox VIP — O Dossiê Numerológico Definitivo",
  description:
    "Converse diretamente com o Oráculo DestinyVox: respostas ultra-personalizadas sobre decisões de vida, amor, carreira e timing cósmico.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
