import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapReader } from "@/components/MapReader";
import { buildWebMap } from "@/lib/web-map";

export const metadata: Metadata = { title: "Demonstração do mapa | DestinyVox", robots: { index: false, follow: false } };
export default function DemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MapReader demo={buildWebMap("Marina Costa", "1994-05-17")} />;
}
