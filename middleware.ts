import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ALLOWED_ROUTES = {
  employee: [
    "/dashboard/attendance/clock-in",
    "/dashboard/attendance/my-records", 
    "/dashboard/profile",
    "/dashboard/profile/edit",
    "/dashboard/settings",
    "/dashboard/help",
  ],
  super_admin: "/dashboard",
}

const ROLE_REDIRECTS = {
  employee: "/dashboard/attendance/my-records",
  super_admin: "/dashboard"
}

// ✅ Add security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

function matchesAllowedPath(pathname: string, allowedPaths: string[] | string): boolean {
  if (Array.isArray(allowedPaths)) {
    return allowedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  }
  return pathname === allowedPaths || pathname.startsWith(`${allowedPaths}/`)
}

// ✅ Simple token validation without calling server action
async function validateToken(request: NextRequest): Promise<{ isValid: boolean; user?: any }> {
  try {
    const accessToken = request.cookies.get("access_token")?.value
    
    if (!accessToken) {
      console.log("Middleware: No access token found")
      return { isValid: false }
    }

    // ✅ Call the API directly instead of using server action
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/me`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "Telecel-Attendance-System/1.0",
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.log(`Middleware: Token validation failed with status: ${response.status}`)
      return { isValid: false }
    }

    const data = await response.json()
    console.log(`Middleware: Token validation successful for user: ${data.user?.email}`)
    return { isValid: true, user: data.user }

  } catch (error) {
    console.error("Middleware: Token validation error:", error)
    return { isValid: false }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

  console.log(`Middleware: Processing request for ${pathname}`)

  // ✅ Add security headers to all responses
  let response = NextResponse.next()
  response = addSecurityHeaders(response)

  // ✅ Only protect dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    console.log(`Middleware: Non-dashboard route ${pathname}, allowing access`)
    return response
  }

  try {
    console.log(`Middleware: Validating token for dashboard route: ${pathname}`)
    const { isValid, user } = await validateToken(request)
    
    if (!isValid || !user) {
      console.log(`Middleware: Invalid token or no user, redirecting to login`)
      return NextResponse.redirect(new URL("/", request.url))
    }

    const roleName = user.role?.roleName as keyof typeof ALLOWED_ROUTES
    
    if (!roleName) {
      console.warn(`Middleware: User ${user.id} has no role assigned`)
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }

    console.log(`Middleware: User ${user.email} (${roleName}) accessing ${pathname}`)

    // ✅ Handle role-based redirects for /dashboard root access
    if (pathname === "/dashboard") {
      const redirectPath = ROLE_REDIRECTS[roleName]
      if (redirectPath && redirectPath !== "/dashboard") {
        console.log(`Middleware: Redirecting ${roleName} from /dashboard to ${redirectPath}`)
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }

    // ✅ Check if user has access to the requested path
    let isAllowed = false
    
    if (roleName === "super_admin") {
      isAllowed = matchesAllowedPath(pathname, ALLOWED_ROUTES.super_admin)
    } else if (roleName === "employee") {
      isAllowed = matchesAllowedPath(pathname, ALLOWED_ROUTES.employee)
    } else {
      console.warn(`Middleware: Unknown role: ${roleName} for user ${user.id}`)
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }

    if (isAllowed) {
      console.log(`Middleware: Access granted for ${roleName} to ${pathname}`)
      return addSecurityHeaders(NextResponse.next())
    }

    // ✅ Log unauthorized access attempts
    console.warn(`Middleware: Access denied for user ${user.id} (${roleName}) on: ${pathname} from IP: ${ip}`)
    return NextResponse.redirect(new URL("/unauthorized", request.url))

  } catch (error) {
    console.error("Middleware: Unexpected error:", error)
    
    // ✅ On error, redirect to login for dashboard routes
    console.log(`Middleware: Error occurred, redirecting to login`)
    return NextResponse.redirect(new URL("/", request.url))
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
}
