import type { Metadata } from "next";
import { MapReader } from "@/components/MapReader";

export const metadata: Metadata = { title: "Seu universo em números | DestinyVox", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MapReader mapId={id} />;
}
