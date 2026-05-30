import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";
  const isCustomerRoute =
    pathname.startsWith("/account") || pathname.startsWith("/checkout");
  const needsAuth = isAdminRoute || isCustomerRoute;

  // For public routes we only need to forward the pathname header.
  // Skip the Supabase auth network call entirely — no point hitting the
  // auth server on every product page or API route.
  if (!needsAuth) {
    const response = NextResponse.next({ request });
    response.headers.set("x-pathname", pathname);
    return response;
  }

  // Protected routes: set up the Supabase client so it can refresh the session
  // cookie and then read claims from the (already-validated) JWT locally.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() reads the JWT locally — no network round-trip.
  // Use getUser() instead if you need server-side token revocation checks.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  // Customer routes (/account, /checkout): any authenticated user is allowed.
  if (isCustomerRoute) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.search = "";
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url);
    }
    response.headers.set("x-pathname", pathname);
    return response;
  }

  // Admin routes.
  if (!isLoginRoute && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  // Run on all routes (to set x-pathname), but exclude Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
