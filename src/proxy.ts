import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { shouldProtectPath } from "@/lib/auth/protected-paths";
import { isAdminUser } from "@/lib/auth/is-admin-user";
import { getSupabaseEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const { url, anonKey } = getSupabaseEnv();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    if (!shouldProtectPath(request.nextUrl.pathname)) {
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdminUser(supabase, user.id))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return response;
  } catch {
    if (shouldProtectPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
