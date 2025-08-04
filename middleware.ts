import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCurrentUserAction } from "./actions/auth"

// Define route permissions for Telecel Liberia Attendance System
const ROUTE_PERMISSIONS = {
  // Employee routes
  "/dashboard/attendance/clock-in": ["create_attendance"],
  "/dashboard/attendance/clock-out": ["create_attendance"],
  "/dashboard/attendance/my-records": ["view_own_attendance"],
  "/dashboard/leave/request": ["create_leave_request"],
  "/dashboard/leave/my-requests": ["edit_own_leave_request"],
  "/dashboard/schedule/my-schedule": ["view_own_schedule"],
  "/dashboard/profile": ["view_own_profile"],
  "/dashboard/profile/edit": ["edit_own_profile"],
  "/dashboard/reports/my-reports": ["view_own_reports"],

  // Admin/HR routes
  "/dashboard/employees": ["view_employees"],
  "/dashboard/employees/new": ["create_employee"],
  "/dashboard/employees/[id]/edit": ["update_employee"],
  "/dashboard/attendance": ["view_attendance"],
  "/dashboard/attendance/manage": ["manage_attendance"],
  "/dashboard/attendance/record": ["manage_attendance"],
  "/dashboard/leave-requests": ["view_leave_requests"],
  "/dashboard/leave-requests/[id]/review": ["approve_leave_requests"],
  "/dashboard/compliance": ["view_compliance_reports"],
  "/dashboard/compliance/generate": ["generate_reports"],
  "/dashboard/departments": ["view_departments"],
  "/dashboard/schedules": ["view_schedules"],
  "/dashboard/schedules/create": ["create_schedule"],

  // User management routes
  "/dashboard/users": ["view_users"],
  "/dashboard/users/new": ["create_user"],

  // Role management routes
  "/dashboard/roles": ["view_roles"],
  "/dashboard/create_role": ["create_role"],
  "/dashboard/user-roles": ["manage_roles"],
  "/dashboard/permissions": ["manage_permissions"],

  // System routes
  "/dashboard/settings": ["view_settings"],
  "/dashboard/help": ["view_help"],
} as const

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for non-dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  try {
    const user = await getCurrentUserAction()

    if (!user) {
      console.log("No user found, redirecting to login")
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Check route-specific permissions
    const requiredPermissions = getRequiredPermissions(pathname)
    console.log(`Route: ${pathname}, Required permissions:`, requiredPermissions)

    if (requiredPermissions.length > 0) {
      const userPermissions = getUserPermissions(user)
      console.log("User permissions:", userPermissions)

      const hasAccess = requiredPermissions.some((permission) => userPermissions.includes(permission))

      console.log(`Access check for ${pathname}: ${hasAccess}`)

      if (!hasAccess) {
        console.log(`Access denied for ${pathname}. Required: ${requiredPermissions}, User has: ${userPermissions}`)
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }
}

function getRequiredPermissions(pathname: string): string[] {
  // Direct match first
  if (ROUTE_PERMISSIONS[pathname as keyof typeof ROUTE_PERMISSIONS]) {
    return Array.from(ROUTE_PERMISSIONS[pathname as keyof typeof ROUTE_PERMISSIONS])
  }

  // Pattern matching for dynamic routes
  for (const [route, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route.includes("[id]")) {
      const routePattern = route.replace("[id]", "")
      if (pathname.startsWith(routePattern)) {
        return Array.from(permissions)
      }
    }
  }

  return []
}

function getUserPermissions(user: any): string[] {
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions
  }

  if (user.role?.permissions) {
    if (Array.isArray(user.role.permissions)) {
      return user.role.permissions
    }

    if (typeof user.role.permissions === "object") {
      return Object.keys(user.role.permissions).filter((key) => user.role.permissions[key] === true)
    }
  }

  return []
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
