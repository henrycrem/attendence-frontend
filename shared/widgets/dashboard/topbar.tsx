"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, BellRing, User, Menu, X, Settings, LogOut, HelpCircle } from "lucide-react";

import { getCurrentUserAction } from "@/actions/auth";
import {  PERMISSIONS, usePermissions } from '../../../hooks/permissions';
interface TopBarProps {
  user: any;
  error: string | null;
  onMenuClick: () => void;
}

export default function TopBar({ user, error, onMenuClick }: TopBarProps) {
  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Mock notifications (replace with actual notification system)
  const notifications = [
    { id: "1", title: "New Leave Request", message: "John Doe requested leave for next week.", read: false, timestamp: new Date().toISOString(), type: "LEAVE_REQUEST" },
    { id: "2", title: "Attendance Recorded", message: "Attendance for IT department updated.", read: true, timestamp: new Date().toISOString(), type: "ATTENDANCE_UPDATE" },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleUserSheet = () => {
    setIsUserSheetOpen(!isUserSheetOpen);
    if (isNotificationSheetOpen) setIsNotificationSheetOpen(false);
  };

  const toggleNotificationSheet = () => {
    setIsNotificationSheetOpen(!isNotificationSheetOpen);
    if (isUserSheetOpen) setIsUserSheetOpen(false);
  };

  const closeAll = () => {
    setIsUserSheetOpen(false);
    setIsNotificationSheetOpen(false);
  };

  const handleNotificationClick = async (notification: any) => {
    // Mock action: navigate to relevant page
    if (notification.type === "LEAVE_REQUEST") {
      router.push("/dashboard/leave-requests");
    } else if (notification.type === "ATTENDANCE_UPDATE") {
      router.push("/dashboard/attendance");
    }
    setIsNotificationSheetOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Assume getCurrentUserAction handles logout logic
      await getCurrentUserAction({ action: "logout" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 shadow-sm">
        {/* Mobile Menu Button and Page Title */}
        <div className="flex items-center">
          <button onClick={onMenuClick} className="mr-4 text-red-400 lg:hidden focus:outline-none">
            <Menu size={24} />
          </button>
          <h1 className="text-xl sm:text-2xl font-semibold text-red-400 transition-all duration-300 hover:text-red-500">
            Attendance Dashboard
          </h1>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Bar - Hidden on mobile */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-red-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees or records"
              className="block w-48 lg:w-64 pl-10 pr-3 py-2 border border-slate-700/50 rounded-md leading-5 bg-slate-700/50 text-red-400 placeholder-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all duration-300 hover:shadow-md"
            />
          </div>

          {/* Search Icon - Mobile only */}
          <button className="md:hidden text-red-400 hover:text-red-500">
            <Search size={20} />
          </button>

          {/* Icon Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              className="relative text-red-400 hover:text-red-500 transform transition hover:scale-110 p-2"
              onClick={toggleNotificationSheet}
            >
              {unreadCount > 0 ? <BellRing className="w-6 h-6 text-red-600" /> : <Bell className="w-6 h-6" />}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center">
            <div className="mr-2 sm:mr-3 text-right hidden sm:block">
              <p className="text-sm font-medium text-red-400">{user?.name || "User"}</p>
              <p className="text-xs text-green-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Online
              </p>
            </div>
            <button
              onClick={toggleUserSheet}
              className="h-10 w-10 rounded-full overflow-hidden shadow-md border-2 border-slate-700/50 hover:border-red-500 transition-all duration-300 transform hover:scale-105"
            >
              <img
                src={user?.avatar || "/api/placeholder/400/400"}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for clicking outside to close sheets */}
      {(isUserSheetOpen || isNotificationSheetOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-10" onClick={closeAll} />
      )}

      {/* User Profile Sheet */}
      <div
        className={`fixed right-4 top-16 w-72 bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-xl z-20 overflow-hidden transition-all duration-500 transform ${
          isUserSheetOpen
            ? "translate-y-0 opacity-100 rotate-0 scale-100"
            : "translate-y-4 opacity-0 rotate-3 scale-95 pointer-events-none"
        }`}
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
      >
        <div className="relative p-1">
          <button
            onClick={() => setIsUserSheetOpen(false)}
            className="absolute top-2 right-2 text-red-400 hover:text-red-500"
          >
            <X size={18} />
          </button>

          {/* User Header */}
          <div className="flex flex-col items-center pt-6 pb-4">
            <div className="h-20 w-20 rounded-full overflow-hidden shadow-lg border-4 border-red-500/20 mb-3">
              <img
                src={user?.avatar || "/api/placeholder/400/400"}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <h3 className="text-lg font-semibold text-red-400">{user?.name || "User"}</h3>
            <p className="text-sm text-red-400/70">{user?.role?.displayName || "HR Admin"}</p>
            <div className="mt-1 flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              <span className="text-xs text-green-500">Online</span>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-3 border-t border-b border-slate-700/50 divide-x divide-slate-700/50">
            <div className="p-3 text-center">
              <p className="text-lg font-semibold text-red-400">{user?.stats?.employees || 0}</p>
              <p className="text-xs text-red-400/70">Employees</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-semibold text-red-400">{user?.stats?.attendanceRecords || 0}</p>
              <p className="text-xs text-red-400/70">Records</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-semibold text-red-400">{user?.stats?.leaveRequests || 0}</p>
              <p className="text-xs text-red-400/70">Leave Requests</p>
            </div>
          </div>

          {/* User Menu */}
          <ul className="py-2">
            {hasPermission(PERMISSIONS.VIEW_USERS) && (
              <li>
                <a
                  href="/dashboard/profile"
                  className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-700/50 hover:text-red-500"
                >
                  <User size={16} className="mr-3 text-red-400/70" />
                  <span>My Profile</span>
                </a>
              </li>
            )}
            {hasPermission(PERMISSIONS.VIEW_SETTINGS) && (
              <li>
                <a
                  href="/dashboard/settings"
                  className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-700/50 hover:text-red-500"
                >
                  <Settings size={16} className="mr-3 text-red-400/70" />
                  <span>Account Settings</span>
                </a>
              </li>
            )}
            {hasPermission(PERMISSIONS.VIEW_HELP) && (
              <li>
                <a
                  href="/dashboard/help"
                  className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-700/50 hover:text-red-500"
                >
                  <HelpCircle size={16} className="mr-3 text-red-400/70" />
                  <span>Help Center</span>
                </a>
              </li>
            )}
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 hover:text-red-700 w-full text-left"
              >
                <LogOut size={16} className="mr-3" />
                <span>Sign Out</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Notifications Sheet */}
      <div
        className={`fixed right-4 top-16 w-96 bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-xl z-20 overflow-hidden transition-all duration-500 transform ${
          isNotificationSheetOpen
            ? "translate-y-0 opacity-100 rotate-0 scale-100"
            : "translate-y-4 opacity-0 -rotate-3 scale-95 pointer-events-none"
        }`}
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
      >
        <div className="relative">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-700/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-red-400">Notifications</h3>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{unreadCount} new</span>
            </div>
            <button onClick={() => setIsNotificationSheetOpen(false)} className="text-red-400 hover:text-red-500">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-red-400/50 mx-auto mb-3" />
                <p className="text-red-400/70">No notifications yet</p>
                <p className="text-sm text-red-400/50">You'll see new notifications here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-700/50 cursor-pointer transition-colors ${
                      !notification.read ? "bg-red-50/20 border-l-4 border-l-red-500" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === "LEAVE_REQUEST"
                            ? "bg-red-500"
                            : notification.type === "ATTENDANCE_UPDATE"
                              ? "bg-green-500"
                              : "bg-gray-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-red-400 truncate">{notification.title}</h4>
                        <p className="text-sm text-red-400/70 mt-1 line-clamp-2">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              notification.type === "LEAVE_REQUEST"
                                ? "bg-red-100 text-red-800"
                                : notification.type === "ATTENDANCE_UPDATE"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {notification.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-red-400/50">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-700/50 bg-slate-700/50">
              <div className="flex justify-between items-center">
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                  Clear All
                </button>
                <span className="text-xs text-red-400/50">
                  Showing {Math.min(notifications.length, 10)} of {notifications.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}