"use client"

import { useContext, createContext, type ReactNode } from "react"

// Define all permissions used in the Telecel Liberia Attendance System
export const PERMISSIONS = {
  // Dashboard & Main
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_INBOX: "view_inbox",

  // Employee Management (Admin/HR permissions)
  VIEW_EMPLOYEES: "view_employees",
  CREATE_EMPLOYEE: "create_employee",
  UPDATE_EMPLOYEE: "update_employee",
  DELETE_EMPLOYEE: "delete_employee",

  // Attendance Management (Employee & Admin permissions)
  VIEW_ATTENDANCE: "view_attendance",
  CREATE_ATTENDANCE: "create_attendance", // New: For employees to clock in/out
  EDIT_ATTENDANCE: "edit_attendance", // New: For employees to edit their own attendance
  DELETE_ATTENDANCE: "delete_attendance", // Admin only
  MANAGE_ATTENDANCE: "manage_attendance", // Admin: Manage all attendance records
  VIEW_OWN_ATTENDANCE: "view_own_attendance", // New: Employees view their own records
  APPROVE_ATTENDANCE: "approve_attendance", // Supervisor permission

  // Leave Requests Management
  VIEW_LEAVE_REQUESTS: "view_leave_requests",
  CREATE_LEAVE_REQUEST: "create_leave_request", // New: Employees create leave requests
  EDIT_OWN_LEAVE_REQUEST: "edit_own_leave_request", // New: Edit own leave requests
  CANCEL_LEAVE_REQUEST: "cancel_leave_request", // New: Cancel own leave requests
  APPROVE_LEAVE_REQUESTS: "approve_leave_requests", // Supervisor/HR permission
  MANAGE_LEAVE_REQUESTS: "manage_leave_requests", // Admin permission

  // Department Management
  VIEW_DEPARTMENTS: "view_departments",
  CREATE_DEPARTMENT: "create_department",
  UPDATE_DEPARTMENT: "update_department",
  DELETE_DEPARTMENT: "delete_department",

  // Schedule Management (New section)
  VIEW_SCHEDULES: "view_schedules",
  VIEW_OWN_SCHEDULE: "view_own_schedule", // New: Employees view their schedule
  EDIT_SCHEDULES: "edit_schedules", // Admin/HR permission
  CREATE_SCHEDULE: "create_schedule", // Admin/HR permission

  // Profile Management (New section for employees)
  VIEW_OWN_PROFILE: "view_own_profile", // New: View own profile
  EDIT_OWN_PROFILE: "edit_own_profile", // New: Edit own profile (limited fields)
  CHANGE_PASSWORD: "change_password", // New: Change own password

  // Compliance & Reporting
  VIEW_COMPLIANCE_REPORTS: "view_compliance",
  GENERATE_COMPLIANCE_REPORTS: "generate_reports",
  EXPORT_REPORTS: "export_compliance_reports",
  VIEW_OWN_REPORTS: "view_own_reports", // New: View own attendance reports

  // User Management (Admin permissions)
  VIEW_USERS: "view_users",
  CREATE_USER: "create_user",
  UPDATE_USER: "update_user",
  DELETE_USER: "delete_user",

  // Role & Permissions Management (Admin permissions)
  CREATE_ROLE: "create_role",
  VIEW_ROLES: "view_roles",
  UPDATE_ROLES: "manage_roles",
  DELETE_ROLE: "delete_role",
  MANAGE_PERMISSIONS: "manage_permissions",



  // System Settings (Admin permissions)
  VIEW_SETTINGS: "view_settings",
  UPDATE_SETTINGS: "update_settings",
  SYSTEM_CONFIGURATION: "system_configuration",

  // Notifications (New section)
  VIEW_NOTIFICATIONS: "view_notifications", // New: View system notifications
  MARK_NOTIFICATIONS_READ: "mark_notifications_read", // New: Mark notifications as read

  // Support
  VIEW_HELP: "view_help",
  CONTACT_SUPPORT: "contact_support", // New: Contact support/HR
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

interface User {
  id: string
  name?: string
  email?: string
  role?: {
    roleName: string
    displayName: string
    description?: string
    id?: string
    permissions?: Permission[] | Record<string, boolean>
  }
  permissions?: Permission[]
}

interface PermissionContextType {
  user: User | null
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  canAccessSection: (sectionType: string) => boolean
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export function PermissionProvider({
  children,
  user,
}: {
  children: ReactNode
  user: User | null
}) {
  const getUserPermissions = (): Permission[] => {
    if (!user) return []

    // Method 1: Direct permissions array on user
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions
    }

    // Method 2: Permissions in role object as array
    if (user.role?.permissions && Array.isArray(user.role.permissions)) {
      return user.role.permissions
    }

    // Method 3: Permissions in role object as object
    if (user.role?.permissions && typeof user.role.permissions === "object") {
      return Object.keys(user.role.permissions).filter((key) => user.role!.permissions![key] === true) as Permission[]
    }

    // Method 4: Super admin check
    if (user.role?.roleName?.toLowerCase() === "admin" || user.role?.roleName?.toLowerCase() === "super_admin") {
      return Object.values(PERMISSIONS)
    }

    return []
  }

  const hasPermission = (permission: Permission): boolean => {
    const userPermissions = getUserPermissions()
    return userPermissions.includes(permission)
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((permission) => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((permission) => hasPermission(permission))
  }

  const canAccessSection = (sectionType: string): boolean => {
    switch (sectionType) {
      case "employeeManagement":
        return hasAnyPermission([
          PERMISSIONS.VIEW_EMPLOYEES,
          PERMISSIONS.CREATE_EMPLOYEE,
          PERMISSIONS.UPDATE_EMPLOYEE,
          PERMISSIONS.DELETE_EMPLOYEE,
        ])

      case "attendanceTracking":
        return hasAnyPermission([
          PERMISSIONS.VIEW_ATTENDANCE,
          PERMISSIONS.CREATE_ATTENDANCE,
          PERMISSIONS.VIEW_OWN_ATTENDANCE,
          PERMISSIONS.MANAGE_ATTENDANCE,
          PERMISSIONS.EDIT_ATTENDANCE,
        ])

      case "leaveManagement":
        return hasAnyPermission([
          PERMISSIONS.VIEW_LEAVE_REQUESTS,
          PERMISSIONS.CREATE_LEAVE_REQUEST,
          PERMISSIONS.EDIT_OWN_LEAVE_REQUEST,
          PERMISSIONS.APPROVE_LEAVE_REQUESTS,
          PERMISSIONS.MANAGE_LEAVE_REQUESTS,
        ])

      case "scheduleManagement":
        return hasAnyPermission([
          PERMISSIONS.VIEW_SCHEDULES,
          PERMISSIONS.VIEW_OWN_SCHEDULE,
          PERMISSIONS.EDIT_SCHEDULES,
          PERMISSIONS.CREATE_SCHEDULE,
        ])

      case "profileManagement":
        return hasAnyPermission([
          PERMISSIONS.VIEW_OWN_PROFILE,
          PERMISSIONS.EDIT_OWN_PROFILE,
          PERMISSIONS.CHANGE_PASSWORD,
        ])

      case "complianceReports":
        return hasAnyPermission([
          PERMISSIONS.VIEW_COMPLIANCE_REPORTS,
          PERMISSIONS.GENERATE_COMPLIANCE_REPORTS,
          PERMISSIONS.EXPORT_REPORTS,
          PERMISSIONS.VIEW_OWN_REPORTS,
        ])

      case "userManagement":
        return hasAnyPermission([
          PERMISSIONS.VIEW_USERS,
          PERMISSIONS.CREATE_USER,
          PERMISSIONS.UPDATE_USER,
          PERMISSIONS.DELETE_USER,
        ])

      case "roleManagement":
        return hasAnyPermission([
          PERMISSIONS.CREATE_ROLE,
          PERMISSIONS.VIEW_ROLES,
          PERMISSIONS.UPDATE_ROLES,
          PERMISSIONS.DELETE_ROLE,
        ])

      case "support":
        return hasAnyPermission([PERMISSIONS.VIEW_SETTINGS, PERMISSIONS.VIEW_HELP, PERMISSIONS.CONTACT_SUPPORT])

      default:
        return true
    }
  }

  return (
    <PermissionContext.Provider
      value={{
        user,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessSection,
      }}
    >
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider")
  }
  return context
}

// Predefined role templates for common use cases
export const ROLE_TEMPLATES = {
  EMPLOYEE: {
    displayName: "Employee",
    roleName: "employee",
    description: "Standard employee with basic attendance and profile access",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.CREATE_ATTENDANCE,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.EDIT_ATTENDANCE,
      PERMISSIONS.CREATE_LEAVE_REQUEST,
      PERMISSIONS.EDIT_OWN_LEAVE_REQUEST,
      PERMISSIONS.CANCEL_LEAVE_REQUEST,
      PERMISSIONS.VIEW_OWN_SCHEDULE,
      PERMISSIONS.VIEW_OWN_PROFILE,
      PERMISSIONS.EDIT_OWN_PROFILE,
      PERMISSIONS.CHANGE_PASSWORD,
      PERMISSIONS.VIEW_OWN_REPORTS,
      PERMISSIONS.VIEW_NOTIFICATIONS,
      PERMISSIONS.MARK_NOTIFICATIONS_READ,
      PERMISSIONS.VIEW_HELP,
      PERMISSIONS.CONTACT_SUPPORT,
    ],
  },
  SUPERVISOR: {
    displayName: "Supervisor",
    roleName: "supervisor",
    description: "Team supervisor with approval permissions",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_EMPLOYEES,
      PERMISSIONS.VIEW_ATTENDANCE,
      PERMISSIONS.CREATE_ATTENDANCE,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.EDIT_ATTENDANCE,
      PERMISSIONS.APPROVE_ATTENDANCE,
      PERMISSIONS.VIEW_LEAVE_REQUESTS,
      PERMISSIONS.CREATE_LEAVE_REQUEST,
      PERMISSIONS.EDIT_OWN_LEAVE_REQUEST,
      PERMISSIONS.APPROVE_LEAVE_REQUESTS,
      PERMISSIONS.VIEW_SCHEDULES,
      PERMISSIONS.VIEW_OWN_SCHEDULE,
      PERMISSIONS.VIEW_OWN_PROFILE,
      PERMISSIONS.EDIT_OWN_PROFILE,
      PERMISSIONS.CHANGE_PASSWORD,
      PERMISSIONS.VIEW_OWN_REPORTS,
      PERMISSIONS.VIEW_NOTIFICATIONS,
      PERMISSIONS.MARK_NOTIFICATIONS_READ,
      PERMISSIONS.VIEW_HELP,
      PERMISSIONS.CONTACT_SUPPORT,
    ],
  },
  HR_MANAGER: {
    displayName: "HR Manager",
    roleName: "hr_manager",
    description: "HR manager with employee and attendance management permissions",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_EMPLOYEES,
      PERMISSIONS.CREATE_EMPLOYEE,
      PERMISSIONS.UPDATE_EMPLOYEE,
      PERMISSIONS.VIEW_ATTENDANCE,
      PERMISSIONS.CREATE_ATTENDANCE,
      PERMISSIONS.MANAGE_ATTENDANCE,
      PERMISSIONS.APPROVE_ATTENDANCE,
      PERMISSIONS.VIEW_LEAVE_REQUESTS,
      PERMISSIONS.APPROVE_LEAVE_REQUESTS,
      PERMISSIONS.MANAGE_LEAVE_REQUESTS,
      PERMISSIONS.VIEW_DEPARTMENTS,
      PERMISSIONS.CREATE_DEPARTMENT,
      PERMISSIONS.UPDATE_DEPARTMENT,
      PERMISSIONS.VIEW_SCHEDULES,
      PERMISSIONS.EDIT_SCHEDULES,
      PERMISSIONS.CREATE_SCHEDULE,
      PERMISSIONS.VIEW_COMPLIANCE_REPORTS,
      PERMISSIONS.GENERATE_COMPLIANCE_REPORTS,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.CREATE_USER,
      PERMISSIONS.UPDATE_USER,
      PERMISSIONS.VIEW_HELP,
    ],
  },
} as const
