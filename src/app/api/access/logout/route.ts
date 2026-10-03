import { NextResponse } from "next/server";
import { getMapAuth, PRIVATE_HEADERS, sameOrigin } from "@/lib/map-auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({}, { status: 403 });
  const client = await getMapAuth();
  await client.auth.signOut({ scope: "local" });
  return NextResponse.json({ success: true }, { headers: PRIVATE_HEADERS });
}
