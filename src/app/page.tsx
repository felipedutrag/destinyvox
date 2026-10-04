import { App } from "@/components/App";
import { LandingPage } from "@/components/LandingPage";

export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  return lang === "en" || lang === "es" ? <App initialLang={lang} /> : <LandingPage />;
}
