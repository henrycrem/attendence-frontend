"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Menu, X, LogOut, Clock } from "lucide-react"
import EmployeeSearch from "@/components/employee-search"
import Link from "next/link"

interface TopBarProps {
  user: any
  error: string | null
  onMenuClick: () => void
}

const getAvatarUrl = (avatarPath: string | null | undefined): string => {
  if (!avatarPath) {
    return "/user-profile-avatar.png"
  }

  // If it's already a full URL, return as is
  if (avatarPath.startsWith("http")) {
    return avatarPath
  }

  // If it's a relative path, construct the full backend URL
  const backendUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"
  return `${backendUrl}${avatarPath}`
}

export default function TopBar({ user, error, onMenuClick }: TopBarProps) {
  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(false);
   const [currentTime, setCurrentTime] = useState(new Date());
   const [isOnline, setIsOnline] = useState(true);
   
  const router = useRouter()




  const toggleUserSheet = () => {
    setIsUserSheetOpen(!isUserSheetOpen)
  }

  const closeSheet = () => {
    setIsUserSheetOpen(false)
  }

  const handleLogout = async () => {
    try {
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
      router.push("/")
    }
  }



  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 border-b border-red-200 relative z-40">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

             

  // Determine what to show in center section based on user role
  const renderCenterSection = () => {
    if (user?.role?.roleName === "super_admin") {
      return (
        <div className="w-full max-w-sm lg:max-w-md">
          <EmployeeSearch className="w-full" />
        </div>
      )
    } else if (user?.role?.roleName === "admin") {
      return (
        <div className="hidden sm:block text-center">
          <h1 className="text-lg lg:text-xl font-semibold text-gray-800">Attendance Dashboard</h1>
        </div>
      )
    } else {
      return (
        <div className="hidden sm:block text-center">
          <h1 className="text-lg lg:text-xl font-semibold text-gray-800">Attendance Tracking System</h1>
        </div>
      )
    }
  }

  return (
    <div className="relative z-40">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        {/* Left Section */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="text-gray-600 lg:hidden focus:outline-none hover:text-gray-800 transition-colors duration-200 p-1"
            aria-label="Toggle menu"
          >
            <Menu size={20} className="sm:w-6 sm:h-6" />
          </button>

          {/* Clock - Hidden on mobile if super_admin */}
          <div
            className={`items-center space-x-2 ${user?.role?.roleName === "super_admin" ? "hidden lg:flex" : "flex"}`}
          >
            <Clock size={16} className="sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-red-900 whitespace-nowrap"> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          </div>
        </div>

        {/* Center Section - Responsive Search/Title */}
        <div className="flex-1 flex justify-center items-center min-w-0">{renderCenterSection()}</div>

        {/* Right Section - User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* User Info - Hidden on mobile */}
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-700 truncate max-w-32 lg:max-w-none">{user?.name || "User"}</p>
            <div className="flex items-center justify-end">
              <div className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 flex-shrink-0"></div>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>

          {/* Profile Button */}
          <button
            onClick={toggleUserSheet}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg overflow-hidden shadow-sm border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 transform hover:scale-105 flex-shrink-0"
            aria-label="User menu"
          >
            <img
              src={getAvatarUrl(user?.avatar) || "/placeholder.svg"}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Overlay for User Sheet */}
      {isUserSheetOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-20 z-30 lg:hidden"
    onClick={closeSheet}
    aria-hidden="true"
  />
)}

      {/* User Profile Sheet */}

    <div
          className={`fixed right-2 sm:right-4 top-14 sm:top-16 w-72 sm:w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden transition-all duration-300 transform ${
            isUserSheetOpen
              ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
              : "translate-y-2 opacity-0 scale-95 pointer-events-none"
          }`}
        >
        <div className="relative p-4 sm:p-6">
          <button
            onClick={closeSheet}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

          {/* User Header */}
          <div className="flex flex-col items-center pb-4 sm:pb-6">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden shadow-sm border-4 border-gray-100 mb-3 sm:mb-4">
              <img
                src={getAvatarUrl(user?.avatar) || "/placeholder.svg"}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 text-center">{user?.name || "User"}</h3>
            <p className="text-sm text-gray-600 mb-2 text-center">{user?.role?.displayName || "Employee"}</p>
            <div className="flex items-center">
              <div className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
          </div>

          {/* User Menu */}
          <div className="space-y-2">
            <Link
                  href="/dashboard/profile"
                  onClick={closeSheet}
                  className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                >
                  <User size={16} className="mr-3 text-gray-500" />
                  <span>View Profile</span>
                </Link>
            <button
              onClick={handleLogout}
              className="flex cursor-pointer items-center px-3 sm:px-4 py-2 sm:py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full text-left transition-colors duration-200"
            >
              <LogOut size={16} className="mr-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
