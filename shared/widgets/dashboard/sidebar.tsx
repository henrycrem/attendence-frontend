"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Home,
  Clock,
  Users2,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  User2
} from "lucide-react"

interface SidebarUser {
  id: string
  name?: string
  email?: string
  role?: {
    roleName: string
    displayName: string
    description?: string
  }
}

interface SidebarProps {
  user: SidebarUser | null
  error: string | null
}

export default function AppSidebar({ user, error }: SidebarProps) {
  const [activeSection, setActiveSection] = useState("main")
  const [expandedSections, setExpandedSections] = useState({
    attendanceTracking: false,
    employeeManagement: false,
    reports: false,
    profileManagement: false,
    support: false,
  })

  const role = user?.role?.roleName
  const isAdmin = role === "super_admin"
  const isEmployee = role === "employee"

  useEffect(() => {
    if (isEmployee) {
      setExpandedSections((prev) => ({
        ...prev,
        attendanceTracking: true,
        profileManagement: true,
      }))
    } else if (isAdmin) {
      setExpandedSections((prev) => ({
        ...prev,
        attendanceTracking: true,
        employeeManagement: true,
        reports: true,
        profileManagement: true,
      }))
    }
  }, [isEmployee, isAdmin])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (error) {
    return (
      <div className="w-64 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-sm flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="w-64 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-sm flex flex-col">
      <div className="flex items-center p-6 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white mr-3 shadow-sm">
          <span className="font-semibold text-sm">TL</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-800">Telecel Liberia</h1>
          <p className="text-xs text-gray-500">Attendance System</p>
        </div>
      </div>

      <div className="flex flex-col h-full overflow-y-auto">
        <nav className="flex-1 px-4 py-6">
          <div className="mb-6">
            <NavItem
              href="/dashboard"
              icon={<Home size={18} />}
              label="Dashboard"
              active={activeSection === "main"}
              onClick={() => setActiveSection("main")}
            />
          </div>

          {(isAdmin || isEmployee) && (
            <Section
              title="User"
              isExpanded={expandedSections.attendanceTracking}
              onToggle={() => toggleSection("attendanceTracking")}
            >
              {isAdmin && (
                <>
                  <NavItem href="/dashboard/new-user" icon={<User2 size={18} />} label="New User" />
                  {/* <NavItem href="/dashboard/create-role" icon={<Clock size={18} />} label="User Role" /> */}
                  <NavItem href="/dashboard/users" icon={<Users2 size={18} />} label="All User" />
                </>
              )}
              {isEmployee && (
                <>
                  <NavItem href="/dashboard/attendance/clock-in" icon={<Clock size={18} />} label="Clock In/Out" />
                  <NavItem href="/dashboard/attendance/my-records" icon={<Clock size={18} />} label="My Records" />
                </>
              )}
            </Section>
          )}

          {isAdmin && (
            <Section
              title="EMPLOYEES"
              isExpanded={expandedSections.employeeManagement}
              onToggle={() => toggleSection("employeeManagement")}
            >
              <NavItem href="/dashboard/employees" icon={<Users2 size={18} />} label="All Employees" />
              {/* <NavItem href="/dashboard/departments" icon={<Building2 size={18} />} label="Departments" /> */}
            </Section>
          )}

          {isAdmin && (
            <Section
              title="REPORTS"
              isExpanded={expandedSections.reports}
              onToggle={() => toggleSection("reports")}
            >
              <NavItem href="/dashboard/attendance-report" icon={<FileText size={18} />} label="Attendance Reports" />
              
            </Section>
          )}

          {(isAdmin || isEmployee) && (
            <Section
              title="PROFILE"
              isExpanded={expandedSections.profileManagement}
              onToggle={() => toggleSection("profileManagement")}
            >
              <NavItem href="/dashboard/profile" icon={<User size={18} />} label="My Profile" />
              <NavItem href="/dashboard/profile/edit" icon={<User size={18} />} label="Edit Profile" />
            </Section>
          )}

          <Section
            title="SUPPORT"
            isExpanded={expandedSections.support}
            onToggle={() => toggleSection("support")}
          >
            <NavItem href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" />
            <NavItem href="/dashboard/help" icon={<HelpCircle size={18} />} label="Help Center" />
            <div className="mt-4 pt-4 border-t border-gray-100">
              <NavItem href="/logout" icon={<LogOut size={18} />} label="Sign Out" isLogout />
            </div>
          </Section>

          {process.env.NODE_ENV === "development" && (
            <div className="px-3 py-4 mt-6 text-xs text-gray-400 border-t border-gray-100 bg-gray-50/50 rounded-lg mx-2">
              <div>Role: {user?.role?.roleName || "No role"}</div>
              <div>Access: {isAdmin ? "Administrator" : isEmployee ? "Employee" : "Unknown"}</div>
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}

function Section({ title, isExpanded, onToggle, children }: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const hasVisibleChildren = Array.isArray(children)
    ? children.some(Boolean)
    : children !== null && children !== false

  if (!hasVisibleChildren) return null

  return (
    <div className="mb-6">
      <div
        className="px-3 py-2 flex justify-between items-center cursor-pointer text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-600 transition-colors duration-200"
        onClick={onToggle}
      >
        <span>{title}</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {isExpanded && (
        <div className="mt-2 space-y-1 transition-all duration-300 ease-out">
          {children}
        </div>
      )}
    </div>
  )
}

function NavItem({ href, icon, label, active = false, isLogout = false, onClick }: {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
  isLogout?: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
        active
          ? "bg-gray-100 text-gray-900 shadow-sm border border-gray-200"
          : isLogout
            ? "text-red-600 hover:bg-red-50 hover:text-red-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className={`mr-3 ${active ? "text-gray-700" : isLogout ? "text-red-500" : "text-gray-400"}`}>
        {icon}
      </span>
      {label}
    </Link>
  )
}