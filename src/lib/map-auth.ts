import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Used only by route handlers: refreshes and stores sessions in HttpOnly cookies. */
export async function getMapAuth() {
  const jar = await cookies();
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Configuração de acesso indisponível");
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: values => values.forEach(({ name, value, options }) => jar.set(name, value, options)),
    },
  });
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
