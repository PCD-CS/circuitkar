import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";
  const isCustomerRoute =
    pathname.startsWith("/account") || pathname.startsWith("/checkout");
  const needsAuth = isAdminRoute || isCustomerRoute;

  // Public routes — only set the pathname header, skip Supabase entirely.
  if (!needsAuth) {
    const response = NextResponse.next({ request });
    response.headers.set("x-pathname", pathname);
    return response;
  }

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

  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;
  const userEmail = (data?.claims?.email as string) || "";

  // Customer routes — any authenticated user.
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

  // Admin routes — must be logged in AND be the designated admin.
  // Admin is identified by ADMIN_EMAIL env var.
  // If ADMIN_EMAIL is not set, fall back to checking app_metadata.role = "admin".
  const adminEmail = process.env.ADMIN_EMAIL || "";
  const isAdmin = adminEmail
    ? userEmail === adminEmail
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data?.claims as any)?.app_metadata?.role === "admin";

  if (!isLoginRoute) {
    if (!isLoggedIn || !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // If logged in as admin and hitting login page → redirect to dashboard.
  if (isLoginRoute && isLoggedIn && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
