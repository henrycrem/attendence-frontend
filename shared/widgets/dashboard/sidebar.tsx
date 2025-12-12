"use client";

import React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
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
  User2,
  UserCog,
  Plus,
  Handshake,
  Currency,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  DollarSign,
  Group,
} from "lucide-react";

interface SidebarUser {
  id: string;
  name?: string;
  email?: string;
  role?: {
    roleName: string;
    displayName: string;
    description?: string;
  };
}

interface SidebarProps {
  user: SidebarUser | null;
  error: string | null;
}

export default function AppSidebar({ user, error }: SidebarProps) {
  const [activeSection, setActiveSection] = useState("main");
  const [expandedSections, setExpandedSections] = useState({
    attendanceTracking: false,
    employeeManagement: false,
    reports: false,
    profileManagement: false,
    support: false,
    taskManagement: false,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = user?.role?.roleName;
  const isAdmin = role === "super_admin";
  const isEmployee = role === "employee";
  const isSales = role === "sales";

  // Auto-expand relevant sections based on role
  useEffect(() => {
    const newExpanded = { ...expandedSections };

    if (isEmployee || isSales) {
      newExpanded.attendanceTracking = true;
      newExpanded.profileManagement = true;
    }

    if (isSales) {
      newExpanded.taskManagement = true;
    }

    if (isAdmin) {
      newExpanded.employeeManagement = true;
      newExpanded.reports = true;
    }

    setExpandedSections(newExpanded);
  }, [isEmployee, isSales, isAdmin]);

  if (error) {
    return (
      <div className="w-64 h-full bg-white border-r border-gray-200 shadow-sm flex items-center justify-center">
        <p className="text-red-600 text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <div
      className={`${isCollapsed ? "w-16" : "w-64"} h-full bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300 relative`}
    >
      {/* Brand Header */}
      {!isCollapsed && (
        <div className="flex items-center p-6 border-b border-gray-100 bg-red-600">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mr-3 shadow-sm border border-white/20">
            <span className="font-bold text-sm">TL</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Telecel Liberia</h1>
            <p className="text-xs text-red-100">Attendance System</p>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="flex items-center justify-center p-4 border-b border-gray-100 bg-red-600">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-sm border border-white/20">
            <span className="font-bold text-sm">TL</span>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:shadow-md transition-shadow z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Navigation */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? "p-2" : "px-4 py-6"}`}>
        <nav className="flex flex-col h-full space-y-6">
          {/* Dashboard */}
          <NavItem
            href="/dashboard"
            icon={<Home size={18} />}
            label="Dashboard"
            active={activeSection === "main"}
            onClick={() => setActiveSection("main")}
            isCollapsed={isCollapsed}
          />

          {/* Attendance Tracking (Employee & Sales) */}
          {(isEmployee || isSales) && (
            <CollapsibleSection
              title="ATTENDANCE"
              isExpanded={expandedSections.attendanceTracking}
              onToggle={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  attendanceTracking: !prev.attendanceTracking,
                }))
              }
              isCollapsed={isCollapsed}
            >
              <NavItem
                href="/dashboard/attendance/clock-in"
                icon={<Clock size={18} />}
                label="Clock In/Out"
                isCollapsed={isCollapsed}
              />
              {isEmployee && (
                <NavItem
                  href="/dashboard/attendance/my-records"
                  icon={<Clock size={18} />}
                  label="My Records"
                  isCollapsed={isCollapsed}
                />
              )}
              {isSales && (
                <NavItem
                  href="/dashboard/sales/attendance-records"
                  icon={<Clock size={18} />}
                  label="Attendance Records"
                  isCollapsed={isCollapsed}
                />
              )}
            </CollapsibleSection>
          )}

          {/* Task Management (Sales Only) */}
          {isSales && (
            <CollapsibleSection
              title="TASKS"
              isExpanded={expandedSections.taskManagement}
              onToggle={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  taskManagement: !prev.taskManagement,
                }))
              }
              isCollapsed={isCollapsed}
            >
              <NavItem
                href="/dashboard/tasks"
                icon={<FileText size={18} />}
                label="All Tasks"
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/dashboard/tasks/new"
                icon={<Plus size={18} />}
                label="New Task"
                isCollapsed={isCollapsed}
              />
            </CollapsibleSection>
          )}

          {/* Clients (Sales Only) */}
          {isSales && (
            <CollapsibleSection
              title="CLIENTS"
              isExpanded={expandedSections.taskManagement}
              onToggle={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  taskManagement: !prev.taskManagement,
                }))
              }
              isCollapsed={isCollapsed}
            >
              <NavItem
                href="/dashboard/prospective-client"
                icon={<UserCog size={18} />}
                label="All Clients"
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/dashboard/engagements"
                icon={<Handshake size={18} />}
                label="All Engagements"
                isCollapsed={isCollapsed}
              />
            </CollapsibleSection>
          )}

          {/* Employee Management (Admin Only) */}
          {isAdmin && (
            <CollapsibleSection
              title="EMPLOYEES"
              isExpanded={expandedSections.employeeManagement}
              onToggle={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  employeeManagement: !prev.employeeManagement,
                }))
              }
              isCollapsed={isCollapsed}
            >
              <NavItem
                href="/dashboard/new-user"
                icon={<User2 size={18} />}
                label="New User"
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/dashboard/users-role"
                icon={<UserCog size={18} />}
                label="User Role"
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/dashboard/users"
                icon={<Users2 size={18} />}
                label="All Users"
                isCollapsed={isCollapsed}
              />
            </CollapsibleSection>
          )}

          {/* Reports (Admin Only) */}
          {isAdmin && (
            <CollapsibleSection
              title="REPORTS"
              isExpanded={expandedSections.reports}
              onToggle={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  reports: !prev.reports,
                }))
              }
              isCollapsed={isCollapsed}
            >
              <NavItem
                href="/dashboard/employees"
                icon={<Group size={18} />}
                label="Remote Attendence Records"
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/dashboard/attendance-report"
                icon={<FileText size={18} />}
                label="Unified Attendance Report"
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/dashboard/sales-report"
                icon={<Currency size={18} />}
                label="Sales Reports"
                isCollapsed={isCollapsed}
              />
               <NavItem
                href="/dashboard/clients-report"
                icon={<UserCheck size={18} />}
                label="Clients Reports"
                isCollapsed={isCollapsed}
              />
            </CollapsibleSection>
          )}

          {isAdmin && (
            <CollapsibleSection
              title="SALES SETTINGS"
              isExpanded={expandedSections.reports}
              onToggle={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  reports: !prev.reports,
                }))
              }
              isCollapsed={isCollapsed}
            >
         
              <NavItem
                href="/dashboard/sales-settings"
                icon={<DollarSign size={18} />}
                label="Sales Settings"
                isCollapsed={isCollapsed}
              />
            </CollapsibleSection>
          )}

          {/* Profile Management (All Roles) */}
          {(isEmployee || isSales || isAdmin) && (
            <CollapsibleSection
              title="PROFILE"
              isExpanded={expandedSections.profileManagement}
              onToggle={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  profileManagement: !prev.profileManagement,
                }))
              }
              isCollapsed={isCollapsed}
            >
              <NavItem
                href="/dashboard/profile"
                icon={<User size={18} />}
                label="My Profile"
                isCollapsed={isCollapsed}
              />
            </CollapsibleSection>
          )}

          {/* Support & Logout */}
          <CollapsibleSection
            title="SUPPORT"
            isExpanded={expandedSections.support}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                support: !prev.support,
              }))
            }
            isCollapsed={isCollapsed}
          >
            <NavItem
              href="/dashboard/settings"
              icon={<Settings size={18} />}
              label="Settings"
              isCollapsed={isCollapsed}
            />
            <NavItem
              href="/dashboard/help"
              icon={<HelpCircle size={18} />}
              label="Help Center"
              isCollapsed={isCollapsed}
            />
            <div className={`mt-4 pt-4 ${!isCollapsed && "border-t border-gray-100"}`}>
              <NavItem
                href="/logout"
                icon={<LogOut size={18} />}
                label="Sign Out"
                isLogout
                isCollapsed={isCollapsed}
              />
            </div>
          </CollapsibleSection>

          {/* Dev Mode: Role Debug Panel */}
          {process.env.NODE_ENV === "development" && !isCollapsed && (
            <div className="px-3 py-4 mt-6 text-xs text-gray-500 border-t bg-red-50 rounded-lg mx-2 border border-red-100">
              <div className="font-medium text-red-800">Role: {user?.role?.roleName || "No role"}</div>
              <div className="text-red-700">
                Access: {isAdmin ? "Administrator" : isSales ? "Sales" : isEmployee ? "Employee" : "Unknown"}
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}

// Reusable Collapsible Section Component
function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
  isCollapsed,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isCollapsed: boolean;
}) {
  // Only render section if it has visible children
  const hasChildren = React.Children.toArray(children).some(Boolean);
  if (!hasChildren) return null;

  return (
    <div>
      {!isCollapsed && (
        <div
          className="px-3 py-2 flex justify-between items-center cursor-pointer text-xs font-semibold text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors duration-200"
          onClick={onToggle}
        >
          <span>{title}</span>
          <span className="text-red-500">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
        </div>
      )}

      {(isCollapsed || isExpanded) && (
        <div className={`mt-2 space-y-1 transition-all duration-300 ease-out ${isCollapsed ? "px-1" : ""}`}>
          {children}
        </div>
      )}
    </div>
  );
}

// Reusable NavItem Component with Collapsed Support
function NavItem({
  href,
  icon,
  label,
  active = false,
  isLogout = false,
  onClick,
  isCollapsed,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isLogout?: boolean;
  onClick?: () => void;
  isCollapsed: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center ${
        isCollapsed
          ? "justify-center w-10 h-10 rounded-lg"
          : "px-3 py-2.5 text-sm font-medium rounded-lg"
      } transition-all duration-200 ${
        active
          ? "bg-red-50 text-red-700 shadow-sm border border-red-200"
          : isLogout
          ? "text-red-600 hover:bg-red-50 hover:text-red-700"
          : "text-gray-600 hover:bg-red-50 hover:text-red-700"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <span
        className={`${
          active
            ? "text-red-600"
            : isLogout
            ? "text-red-500"
            : "text-gray-500 group-hover:text-red-500"
        }`}
      >
        {icon}
      </span>
      {!isCollapsed && <span className="ml-3">{label}</span>}

      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
          {label}
        </div>
      )}
    </Link>
  );
}