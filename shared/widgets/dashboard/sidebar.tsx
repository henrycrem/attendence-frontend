"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect } from "react"
import {
  HomeIcon,
  InboxIcon,
  Users2Icon,
  CalendarIcon,
  FileTextIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  ChevronDown,
  ChevronUp,
  UserIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  KeyIcon,
  ClockIcon,
  Building2Icon,
  Calendar,
} from "lucide-react"
import { PERMISSIONS } from "@/hooks/permissions" 

interface SidebarUser {
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
  stats?: {
    employees?: number
    attendanceRecords?: number
    leaveRequests?: number
  }
  lastLogin?: string
  permissions?: string[]
}

interface SidebarProps {
  user: SidebarUser | null
  error: string | null
}

export default function AppSidebar({ user, error }: SidebarProps) {
  const [activeSection, setActiveSection] = useState("main")
  const [expandedSections, setExpandedSections] = useState({
    employeeManagement: true,
    attendanceTracking: true, // Changed to true for employees
    leaveManagement: true, // New section for employees
    scheduleManagement: true, // New section for employees
    profileManagement: true, // New section for employees
    complianceReports: false,
    userManagement: false,
    roleManagement: false,
    support: false,
  })

  // Debug the user object
  useEffect(() => {
    console.log("Sidebar user object:", user)
    console.log("User role:", user?.role)
    console.log("User permissions:", user?.permissions)
  }, [user])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  // Helper function to check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) {
      console.log(`hasPermission(${permission}): No user, returning false`)
      return false
    }

    if (user.permissions && Array.isArray(user.permissions)) {
      console.log(`hasPermission(${permission}): Checking user.permissions`, user.permissions)
      return user.permissions.includes(permission)
    }

    if (user.role?.permissions && Array.isArray(user.role.permissions)) {
      console.log(`hasPermission(${permission}): Checking user.role.permissions`, user.role.permissions)
      return user.role.permissions.includes(permission)
    }

    if (user.role?.roleName?.toLowerCase() === "admin" || user.role?.roleName?.toLowerCase() === "super_admin") {
      console.log(`hasPermission(${permission}): User is admin, granting permission`)
      return true
    }

    console.log(`hasPermission(${permission}): No permissions found, returning false`)
    return false
  }

  // Helper function to check multiple permissions (OR logic)
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission))
  }

  // Updated helper function to check if user can view a section
  const canViewSection = (
    sectionType:
      | "employeeManagement"
      | "attendanceTracking"
      | "leaveManagement"
      | "scheduleManagement"
      | "profileManagement"
      | "complianceReports"
      | "userManagement"
      | "roleManagement"
      | "support",
  ): boolean => {
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
          // Admin permissions
          PERMISSIONS.VIEW_ATTENDANCE,
          PERMISSIONS.MANAGE_ATTENDANCE,
          // Employee permissions
          PERMISSIONS.CREATE_ATTENDANCE,
          PERMISSIONS.VIEW_OWN_ATTENDANCE,
          PERMISSIONS.EDIT_ATTENDANCE,
          // Legacy permissions (from your user's data)
          "edit_attendance",
          "create_attendance",
          "view_own_attendance",
        ])

      case "leaveManagement":
        return hasAnyPermission([
          // Admin permissions
          PERMISSIONS.VIEW_LEAVE_REQUESTS,
          PERMISSIONS.APPROVE_LEAVE_REQUESTS,
          PERMISSIONS.MANAGE_LEAVE_REQUESTS,
          // Employee permissions
          PERMISSIONS.CREATE_LEAVE_REQUEST,
          PERMISSIONS.EDIT_OWN_LEAVE_REQUEST,
          PERMISSIONS.CANCEL_LEAVE_REQUEST,
          // Legacy permissions (from your user's data)
          "create_leave_request",
          "edit_own_leave_request",
          "cancel_leave_request",
        ])

      case "scheduleManagement":
        return hasAnyPermission([
          // Admin permissions
          PERMISSIONS.VIEW_SCHEDULES,
          PERMISSIONS.EDIT_SCHEDULES,
          PERMISSIONS.CREATE_SCHEDULE,
          // Employee permissions
          PERMISSIONS.VIEW_OWN_SCHEDULE,
          // Legacy permissions (from your user's data)
          "view_own_schedule",
        ])

      case "profileManagement":
        return hasAnyPermission([
          // Employee permissions
          PERMISSIONS.VIEW_OWN_PROFILE,
          PERMISSIONS.EDIT_OWN_PROFILE,
          PERMISSIONS.CHANGE_PASSWORD,
          // Legacy permissions (from your user's data)
          "view_own_profile",
          "edit_own_profile",
          "change_password",
        ])

      case "complianceReports":
        return hasAnyPermission([
          // Admin permissions
          PERMISSIONS.VIEW_COMPLIANCE_REPORTS,
          PERMISSIONS.GENERATE_COMPLIANCE_REPORTS,
          PERMISSIONS.EXPORT_REPORTS,
          // Employee permissions
          PERMISSIONS.VIEW_OWN_REPORTS,
          // Legacy permissions (from your user's data)
          "view_own_reports",
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
          PERMISSIONS.MANAGE_PERMISSIONS,
        ])

      case "support":
        return hasAnyPermission([
          PERMISSIONS.VIEW_SETTINGS,
          PERMISSIONS.VIEW_HELP,
          PERMISSIONS.CONTACT_SUPPORT,
          // Legacy permissions (from your user's data)
          "view_help",
          "contact_support",
        ])

      default:
        return true
    }
  }

  if (error) {
    return (
      <div className="w-60 h-full bg-slate-800/80 backdrop-blur-xl border-r border-slate-700/50 shadow-lg flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="w-60 h-full bg-slate-800/80 backdrop-blur-xl border-r border-slate-700/50 shadow-lg flex flex-col transform-gpu">
      {/* Telecel Logo */}
      <div className="flex items-center p-4 border-b border-slate-700/50 shadow-sm">
        <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center text-white mr-3 transform transition-all duration-500 hover:rotate-[360deg] hover:scale-110">
          <span className="font-semibold">TL</span>
        </div>
        <div className="flex items-center">
          <h1 className="text-sm font-semibold text-red-400">Telecel Liberia Attendance</h1>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
        <nav className="flex-1 px-2 py-4">
          {/* Main Navigation - Always visible */}
          <div className="mb-1">
            <NavItem
              href="/dashboard"
              icon={<HomeIcon size={18} />}
              label="Home"
              active={activeSection === "main"}
              onClick={() => setActiveSection("main")}
            />
            <NavItem href="/dashboard/inbox" icon={<InboxIcon size={18} />} label="Inbox" />
          </div>

          {/* Employee Management - Admin only */}
          {canViewSection("employeeManagement") && (
            <Section
              title="EMPLOYEE MANAGEMENT"
              isExpanded={expandedSections.employeeManagement}
              onToggle={() => toggleSection("employeeManagement")}
            >
              {hasPermission(PERMISSIONS.VIEW_EMPLOYEES) && (
                <NavItem href="/dashboard/employees" icon={<Users2Icon size={18} />} label="Employees" />
              )}
              {hasPermission(PERMISSIONS.CREATE_EMPLOYEE) && (
                <NavItem href="/dashboard/employees/new" icon={<UserPlusIcon size={18} />} label="New Employee" />
              )}
              {hasPermission(PERMISSIONS.VIEW_DEPARTMENTS) && (
                <NavItem href="/dashboard/departments" icon={<Building2Icon size={18} />} label="Departments" />
              )}
            </Section>
          )}

          {/* Attendance Tracking - For both admin and employees */}
          {canViewSection("attendanceTracking") && (
            <Section
              title="ATTENDANCE TRACKING"
              isExpanded={expandedSections.attendanceTracking}
              onToggle={() => toggleSection("attendanceTracking")}
            >
              {/* Admin attendance views */}
              {hasPermission(PERMISSIONS.VIEW_ATTENDANCE) && (
                <NavItem href="/dashboard/attendance" icon={<ClockIcon size={18} />} label="All Attendance" />
              )}
              {hasPermission(PERMISSIONS.MANAGE_ATTENDANCE) && (
                <NavItem href="/dashboard/attendance/record" icon={<ClockIcon size={18} />} label="Record Attendance" />
              )}

              {/* Employee attendance views */}
              {(hasPermission(PERMISSIONS.CREATE_ATTENDANCE) || hasPermission("create_attendance")) && (
                <NavItem href="/dashboard/attendance/clock-in" icon={<ClockIcon size={18} />} label="Clock In/Out" />
              )}
              {(hasPermission(PERMISSIONS.VIEW_OWN_ATTENDANCE) || hasPermission("view_own_attendance")) && (
                <NavItem href="/dashboard/attendance/my-records" icon={<ClockIcon size={18} />} label="My Attendance" />
              )}
            </Section>
          )}

          {/* Leave Management - For both admin and employees */}
          {canViewSection("leaveManagement") && (
            <Section
              title="LEAVE MANAGEMENT"
              isExpanded={expandedSections.leaveManagement}
              onToggle={() => toggleSection("leaveManagement")}
            >
              {/* Admin leave views */}
              {hasPermission(PERMISSIONS.VIEW_LEAVE_REQUESTS) && (
                <NavItem
                  href="/dashboard/leave-requests"
                  icon={<CalendarIcon size={18} />}
                  label="All Leave Requests"
                />
              )}

              {/* Employee leave views */}
              {(hasPermission(PERMISSIONS.CREATE_LEAVE_REQUEST) || hasPermission("create_leave_request")) && (
                <NavItem href="/dashboard/leave/request" icon={<CalendarIcon size={18} />} label="Request Leave" />
              )}
              {(hasPermission(PERMISSIONS.EDIT_OWN_LEAVE_REQUEST) || hasPermission("edit_own_leave_request")) && (
                <NavItem
                  href="/dashboard/leave/my-requests"
                  icon={<CalendarIcon size={18} />}
                  label="My Leave Requests"
                />
              )}
            </Section>
          )}

          {/* Schedule Management - For both admin and employees */}
          {canViewSection("scheduleManagement") && (
            <Section
              title="SCHEDULE MANAGEMENT"
              isExpanded={expandedSections.scheduleManagement}
              onToggle={() => toggleSection("scheduleManagement")}
            >
              {/* Admin schedule views */}
              {hasPermission(PERMISSIONS.VIEW_SCHEDULES) && (
                <NavItem href="/dashboard/schedules" icon={<Calendar size={18} />} label="All Schedules" />
              )}
              {hasPermission(PERMISSIONS.CREATE_SCHEDULE) && (
                <NavItem href="/dashboard/schedules/create" icon={<Calendar size={18} />} label="Create Schedule" />
              )}

              {/* Employee schedule views */}
              {(hasPermission(PERMISSIONS.VIEW_OWN_SCHEDULE) || hasPermission("view_own_schedule")) && (
                <NavItem href="/dashboard/schedule/my-schedule" icon={<Calendar size={18} />} label="My Schedule" />
              )}
            </Section>
          )}

          {/* Profile Management - For employees */}
          {canViewSection("profileManagement") && (
            <Section
              title="PROFILE MANAGEMENT"
              isExpanded={expandedSections.profileManagement}
              onToggle={() => toggleSection("profileManagement")}
            >
              {(hasPermission(PERMISSIONS.VIEW_OWN_PROFILE) || hasPermission("view_own_profile")) && (
                <NavItem href="/dashboard/profile" icon={<UserIcon size={18} />} label="My Profile" />
              )}
              {(hasPermission(PERMISSIONS.EDIT_OWN_PROFILE) || hasPermission("edit_own_profile")) && (
                <NavItem href="/dashboard/profile/edit" icon={<UserIcon size={18} />} label="Edit Profile" />
              )}
              {(hasPermission(PERMISSIONS.CHANGE_PASSWORD) || hasPermission("change_password")) && (
                <NavItem href="/dashboard/profile/password" icon={<KeyIcon size={18} />} label="Change Password" />
              )}
            </Section>
          )}

          {/* Compliance Reports - For both admin and employees */}
          {canViewSection("complianceReports") && (
            <Section
              title="REPORTS"
              isExpanded={expandedSections.complianceReports}
              onToggle={() => toggleSection("complianceReports")}
            >
              {/* Admin report views */}
              {hasPermission(PERMISSIONS.VIEW_COMPLIANCE_REPORTS) && (
                <NavItem href="/dashboard/compliance" icon={<FileTextIcon size={18} />} label="All Reports" />
              )}
              {hasPermission(PERMISSIONS.GENERATE_COMPLIANCE_REPORTS) && (
                <NavItem
                  href="/dashboard/compliance/generate"
                  icon={<FileTextIcon size={18} />}
                  label="Generate Report"
                />
              )}

              {/* Employee report views */}
              {(hasPermission(PERMISSIONS.VIEW_OWN_REPORTS) || hasPermission("view_own_reports")) && (
                <NavItem href="/dashboard/reports/my-reports" icon={<FileTextIcon size={18} />} label="My Reports" />
              )}
            </Section>
          )}

          {/* User Management - Admin only */}
          {canViewSection("userManagement") && (
            <Section
              title="USER MANAGEMENT"
              isExpanded={expandedSections.userManagement}
              onToggle={() => toggleSection("userManagement")}
            >
              {hasPermission(PERMISSIONS.VIEW_USERS) && (
                <NavItem href="/dashboard/users" icon={<UserIcon size={18} />} label="Users List" />
              )}
              {hasPermission(PERMISSIONS.CREATE_USER) && (
                <NavItem href="/dashboard/users/new" icon={<UserPlusIcon size={18} />} label="New User" />
              )}
            </Section>
          )}

          {/* Role Management - Admin only */}
          {canViewSection("roleManagement") && (
            <Section
              title="ROLE MANAGEMENT"
              isExpanded={expandedSections.roleManagement}
              onToggle={() => toggleSection("roleManagement")}
            >
              {hasPermission(PERMISSIONS.VIEW_ROLES) && (
                <NavItem href="/dashboard/roles" icon={<ShieldCheckIcon size={18} />} label="View Roles" />
              )}
              {hasPermission(PERMISSIONS.CREATE_ROLE) && (
                <NavItem href="/dashboard/create_role" icon={<ShieldCheckIcon size={18} />} label="Create Role" />
              )}
              {hasPermission(PERMISSIONS.UPDATE_ROLES) && (
                <NavItem href="/dashboard/user-roles" icon={<ShieldCheckIcon size={18} />} label="Manage Roles" />
              )}
              {hasPermission(PERMISSIONS.MANAGE_PERMISSIONS) && (
                <NavItem href="/dashboard/permissions" icon={<KeyIcon size={18} />} label="Permissions" />
              )}
            </Section>
          )}

          {/* Support - For everyone */}
          {canViewSection("support") && (
            <Section title="SUPPORT" isExpanded={expandedSections.support} onToggle={() => toggleSection("support")}>
              {hasPermission(PERMISSIONS.VIEW_SETTINGS) && (
                <NavItem href="/dashboard/settings" icon={<SettingsIcon size={18} />} label="Settings" />
              )}
              {(hasPermission(PERMISSIONS.VIEW_HELP) || hasPermission("view_help")) && (
                <NavItem href="/dashboard/help" icon={<HelpCircleIcon size={18} />} label="Help" />
              )}
              <div className="mt-4">
                <NavItem href="/logout" icon={<LogOutIcon size={18} />} label="Log Out" isLogout />
              </div>
            </Section>
          )}

          {/* Debug info in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="px-3 py-2 mt-4 text-xs text-red-400 border-t border-slate-700/50">
              <div>Role: {user?.role?.roleName || "No role"}</div>
              <div>Permissions: {user?.permissions?.length || user?.role?.permissions?.length || 0}</div>
              <div>Can create attendance: {hasPermission("create_attendance") ? "Yes" : "No"}</div>
              <div>Can view own attendance: {hasPermission("view_own_attendance") ? "Yes" : "No"}</div>
              <div>Can view attendance section: {canViewSection("attendanceTracking") ? "Yes" : "No"}</div>
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}

// Section component for collapsing groups
function Section({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const hasVisibleChildren = Array.isArray(children)
    ? children.some((child) => child !== null && child !== false)
    : children !== null && children !== false

  if (!hasVisibleChildren) return null

  return (
    <div className="mb-1 perspective-500">
      <div
        className="px-3 py-2 mt-2 flex justify-between items-center cursor-pointer text-xs font-medium text-red-400 uppercase tracking-wider hover:text-red-500 transition-colors"
        onClick={onToggle}
      >
        <span>{title}</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {isExpanded && (
        <div className="transform-gpu transition-all duration-300 ease-in-out animate-slideDown">{children}</div>
      )}
    </div>
  )
}

// NavItem component — uses Next.js Link
type NavItemProps = {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
  isLogout?: boolean
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

function NavItem({ href, icon, label, active = false, isLogout = false, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md transition-all duration-300 transform hover:translate-x-1 ${
        active
          ? "bg-red-50 text-red-600 shadow-sm"
          : isLogout
            ? "text-red-600 hover:bg-red-50 hover:text-red-700"
            : "text-gray-200 hover:bg-slate-700/50 hover:text-red-400"
      }`}
    >
      <span className={`mr-3 ${active ? "text-red-500" : "text-gray-400"}`}>{icon}</span>
      {label}
    </Link>
  )
}
