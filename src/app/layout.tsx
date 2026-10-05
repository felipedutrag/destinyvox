import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteAnalytics } from "@/components/SiteAnalytics";

export const metadata: Metadata = {
  title: "O que os números dizem sobre seu destino | DestinyVox — R$ 19,90",
  description:
    "Descubra o que os números dizem sobre o seu destino. Seu nome e nascimento em um mapa com nove números interpretados. Acesso online por R$ 19,90, sem assinatura.",
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
      <body suppressHydrationWarning>{children}<SiteAnalytics /></body>
      <Script id="reddit-pixel" strategy="afterInteractive">
        {`!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
        rdt('init','a2_jo82q4y3vyus');
        rdt('track','PageVisit');
        try{var c=new URLSearchParams(location.search).get('rdt_cid');if(c)document.cookie='_rdt_cid='+encodeURIComponent(c)+';path=/;max-age=2592000;SameSite=Lax;Secure'}catch(e){}`}
      </Script>
    </html>
  );
}
