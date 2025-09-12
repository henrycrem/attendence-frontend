import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ Define allowed routes for each role
const ALLOWED_ROUTES = {
  employee: [
    "/dashboard/attendance/clock-in",
    "/dashboard/attendance/my-records",
    "/dashboard/profile",
    "/dashboard/profile/edit",
    "/dashboard/settings",
    "/dashboard/help",
  ],
  sales: [
    "/dashboard/attendance/clock-in",
    "/dashboard/sales/attendance-records",
    "/dashboard/profile",
    "/dashboard/profile/edit",
    "/dashboard/settings",
    "/dashboard/help",
    "/dashboard/tasks",
    "/dashboard/engagements",
    "/dashboard/prespective-client",
    "/dashboard/tasks/new",
  ],
  super_admin: "/dashboard", // Grants access to all /dashboard/* routes
};

// ✅ Define redirect paths for root dashboard access
const ROLE_REDIRECTS = {
  employee: "/dashboard/attendance/my-records",
  sales: "/dashboard/tasks",          // Sales go to tasks by default
  super_admin: "/dashboard",          // Admins go to full dashboard
};

// ✅ Add security headers to all responses
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

// ✅ Check if pathname matches allowed path (exact or startsWith)
function matchesAllowedPath(pathname: string, allowedPaths: string[] | string): boolean {
  if (Array.isArray(allowedPaths)) {
    return allowedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
  }
  return pathname === allowedPaths || pathname.startsWith(`${allowedPaths}/`);
}

// ✅ Validate JWT token by calling /api/me
async function validateToken(request: NextRequest): Promise<{ isValid: boolean; user?: any }> {
  try {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      console.log("Middleware: No access token found");
      return { isValid: false };
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "Telecel-Attendance-System/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.log(`Middleware: Token validation failed with status: ${response.status}`);
      return { isValid: false };
    }

    const data = await response.json();
    console.log(`Middleware: Token validation successful for user: ${data.user?.email}`);
    return { isValid: true, user: data.user };
  } catch (error) {
    console.error("Middleware: Token validation error:", error);
    return { isValid: false };
  }
}

// ✅ Middleware Entry Point
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";

  console.log(`Middleware: Processing request for ${pathname}`);

  // ✅ Add security headers to all responses
  let response = NextResponse.next();
  response = addSecurityHeaders(response);

  // ✅ Only protect routes under /dashboard
  if (!pathname.startsWith("/dashboard")) {
    console.log(`Middleware: Non-dashboard route ${pathname}, allowing access`);
    return response;
  }

  try {
    console.log(`Middleware: Validating token for dashboard route: ${pathname}`);
    const { isValid, user } = await validateToken(request);

    if (!isValid || !user) {
      console.log("Middleware: Invalid token or no user, redirecting to login");
      return NextResponse.redirect(new URL("/", request.url));
    }

    const roleName = user.role?.roleName as keyof typeof ALLOWED_ROUTES;

    // ✅ Ensure role exists and is supported
    const validRoles = ["employee", "sales", "super_admin"] as const;
    if (!roleName || !validRoles.includes(roleName)) {
      console.warn(`Middleware: Invalid or missing role: ${roleName} for user ${user.id}`);
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    console.log(`Middleware: User ${user.email} (${roleName}) accessing ${pathname}`);

    // ✅ Handle root /dashboard redirect based on role
    if (pathname === "/dashboard") {
      const redirectPath = ROLE_REDIRECTS[roleName];
      if (redirectPath && redirectPath !== "/dashboard") {
        console.log(`Middleware: Redirecting ${roleName} from /dashboard to ${redirectPath}`);
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }

    // ✅ Check if user has access to requested path
    let isAllowed = false;

    if (roleName === "super_admin") {
      isAllowed = matchesAllowedPath(pathname, ALLOWED_ROUTES.super_admin);
    } else {
      const allowedPaths = ALLOWED_ROUTES[roleName];
      isAllowed = matchesAllowedPath(pathname, allowedPaths);
    }

    if (isAllowed) {
      console.log(`Middleware: Access granted for ${roleName} to ${pathname}`);
      return addSecurityHeaders(NextResponse.next());
    }

    // ✅ Log unauthorized access
    console.warn(`Middleware: Access denied for user ${user.id} (${roleName}) on: ${pathname} from IP: ${ip}`);
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  } catch (error) {
    console.error("Middleware: Unexpected error:", error);
    console.log("Middleware: Redirecting to login due to internal error");
    return NextResponse.redirect(new URL("/", request.url));
  }
}

// ✅ Apply middleware only to dashboard routes
export const config = {
  matcher: ["/dashboard/:path*"],
};