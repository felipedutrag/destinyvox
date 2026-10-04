import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapReader } from "@/components/MapReader";
import { buildPurchasedMap } from "@/lib/map-products";
import { brazilianDate } from "@/lib/web-map";

export const metadata: Metadata = { title: "Demonstração do mapa | DestinyVox", robots: { index: false, follow: false } };
export default async function DemoPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { product } = await searchParams;
  return <MapReader demo={buildPurchasedMap("Marina Costa", "1994-05-17", { product: product === "atlas" ? "atlas" : "map", bumps: product === "atlas" ? [] : ["calendar", "name", "challenges"], referenceDate: brazilianDate() })} />;
}
