"use client"

import { useContext, createContext, type ReactNode, useEffect, useState } from "react"

export interface Permission {
  id: number
  key: string
  name: string
  description?: string
  category_id: number
  is_active: boolean
}

export interface PermissionCategory {
  id: number
  name: string
  description?: string
  icon: string
  sort_order: number
  is_active: boolean
  permissions: Permission[]
}

interface User {
  id: string
  name?: string
  email?: string
  role?: {
    roleName: string
    displayName: string
    description?: string
    id?: string
    permissions?: string[]
  }
  permissions?: string[]
}

interface DynamicPermissionContextType {
  user: User | null
  permissions: Permission[]
  categories: PermissionCategory[]
  hasPermission: (permissionKey: string) => boolean
  hasAnyPermission: (permissionKeys: string[]) => boolean
  hasAllPermissions: (permissionKeys: string[]) => boolean
  canAccessSection: (sectionType: string) => boolean
  loading: boolean
  error: string | null
  refreshPermissions: () => Promise<void>
}

const DynamicPermissionContext = createContext<DynamicPermissionContextType | undefined>(undefined)

export function DynamicPermissionProvider({
  children,
  user,
}: {
  children: ReactNode
  user: User | null
}) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [categories, setCategories] = useState<PermissionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/permissions")
      if (!response.ok) throw new Error("Failed to fetch permissions")

      const data = await response.json()
      setPermissions(data.permissions || [])
      setCategories(data.categories || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      console.error("Error fetching permissions:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

  const getUserPermissions = (): string[] => {
    if (!user) return []

    // Method 1: Direct permissions array on user
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions
    }

    // Method 2: Permissions in role object as array
    if (user.role?.permissions && Array.isArray(user.role.permissions)) {
      return user.role.permissions
    }

    // Method 3: Super admin check
    if (user.role?.roleName?.toLowerCase() === "admin" || user.role?.roleName?.toLowerCase() === "super_admin") {
      return permissions.map((p) => p.key)
    }

    return []
  }

  const hasPermission = (permissionKey: string): boolean => {
    const userPermissions = getUserPermissions()
    return userPermissions.includes(permissionKey)
  }

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    return permissionKeys.some((key) => hasPermission(key))
  }

  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    return permissionKeys.every((key) => hasPermission(key))
  }

  const canAccessSection = (sectionType: string): boolean => {
    const categoryMap: Record<string, string[]> = {
      employeeManagement: ["view_employees", "create_employee", "update_employee", "delete_employee"],
      attendanceTracking: [
        "view_attendance",
        "create_attendance",
        "view_own_attendance",
        "manage_attendance",
        "edit_attendance",
      ],
      leaveManagement: [
        "view_leave_requests",
        "create_leave_request",
        "edit_own_leave_request",
        "approve_leave_requests",
      ],
      scheduleManagement: ["view_schedules", "view_own_schedule", "create_schedule", "edit_schedules"],
      profileManagement: ["view_own_profile", "edit_own_profile", "change_password"],
      reports: ["view_reports", "view_own_reports", "generate_reports", "export_reports"],
      userManagement: ["view_users", "create_user", "update_user", "delete_user"],
      roleManagement: ["view_roles", "create_role", "update_role", "delete_role", "manage_permissions"],
      support: ["view_settings", "view_help", "contact_support"],
    }

    const requiredPermissions = categoryMap[sectionType] || []
    return hasAnyPermission(requiredPermissions)
  }

  return (
    <DynamicPermissionContext.Provider
      value={{
        user,
        permissions,
        categories,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessSection,
        loading,
        error,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </DynamicPermissionContext.Provider>
  )
}

export function useDynamicPermissions() {
  const context = useContext(DynamicPermissionContext)
  if (context === undefined) {
    throw new Error("useDynamicPermissions must be used within a DynamicPermissionProvider")
  }
  return context
}
