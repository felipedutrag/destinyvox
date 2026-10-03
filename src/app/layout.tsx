import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seu Mapa Numerológico Online por R$ 39,90 | DestinyVox",
  description:
    "Explore nove números e suas interpretações em um mapa numerológico online. Receba seu link de acesso por e-mail após a confirmação do Pix. Pagamento único de R$ 39,90.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
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
