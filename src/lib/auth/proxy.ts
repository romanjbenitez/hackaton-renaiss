import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getDemoSessionFromRequest } from "@/lib/auth/demo";
import { normalizeRole, isSupabaseConfigured } from "@/lib/auth/config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!isSupabaseConfigured()) {
    const demoSession = getDemoSessionFromRequest(request);

    return {
      response,
      role: demoSession?.role ?? null,
      user: demoSession
        ? {
            id: demoSession.id,
            email: demoSession.email,
            app_metadata: { role: demoSession.role },
            user_metadata: {
              first_name: demoSession.firstName,
              last_name: demoSession.lastName,
              company_name: demoSession.companyName,
              role: demoSession.role,
            },
          }
        : null,
    };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    response,
    role: normalizeRole(user?.app_metadata.role ?? user?.user_metadata.role),
    user,
  };
}
