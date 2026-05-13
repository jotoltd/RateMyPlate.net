import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Simple in-memory rate limiter ────────────────────────────────
// Max 5 POST attempts per IP per 10 minutes on auth routes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMITED_PATHS = ["/auth/signup", "/auth/verify-email"];

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}
// ─────────────────────────────────────────────────────────────────

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

  // ── Rate limiting ────────────────────────────────────────────────
  if (request.method === "POST" && RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many attempts. Please wait 10 minutes and try again." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "600" } }
      );
    }
  }
  // ────────────────────────────────────────────────────────────────

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

  const publicRoutes = ["/auth/login", "/auth/signup", "/auth/confirm", "/auth/check-email", "/auth/verify-email", "/maintenance"];
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
