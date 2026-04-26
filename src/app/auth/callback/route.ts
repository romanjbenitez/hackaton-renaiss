import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/auth/config";
import { createServerSupabaseClient } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");
  const redirectTo = nextPath?.startsWith("/") ? nextPath : "/";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=Configurá%20Supabase", request.url));
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
