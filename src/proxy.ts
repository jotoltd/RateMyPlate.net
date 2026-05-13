import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MAINTENANCE_BYPASS_ROUTES = ["/maintenance", "/auth/login", "/auth/signup", "/admin"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Maintenance mode ────────────────────────────────────────────
  const maintenanceMode = process.env.MAINTENANCE_MODE === "true";
  if (maintenanceMode) {
    const isBypassed = MAINTENANCE_BYPASS_ROUTES.some((r) => pathname.startsWith(r));
    if (!isBypassed) {
      // Check if the logged-in user is an admin — admins see the real site
      let isAdmin = false;
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        isAdmin = data?.is_admin === true;
      }
      if (!isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/maintenance";
        return NextResponse.redirect(url);
      }
    }
  }
  // ────────────────────────────────────────────────────────────────

  const publicRoutes = ["/auth/login", "/auth/signup", "/maintenance"];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user && ["/auth/login", "/auth/signup"].includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
