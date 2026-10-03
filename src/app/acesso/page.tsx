import type { Metadata } from "next";
import { MapAccess } from "@/components/MapAccess";

export const metadata: Metadata = { title: "Acesse seu mapa | DestinyVox", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function AccessPage() { return <MapAccess />; }
