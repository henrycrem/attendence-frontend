"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import TopBar from "../../shared/widgets/dashboard/topbar"
import Sidebar from "../../shared/widgets/dashboard/sidebar"
import RightSidebar from "../../shared/widgets/dashboard/RightSidebar"
import { DashboardProvider, useDashboard } from "../../contexts/DashboardContext"

interface ClientDashboardLayoutProps {
  children: React.ReactNode
  user: any
  error: string | null
}

function DashboardContent({ children, user, error }: ClientDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { isRightSidebarCollapsed, toggleRightSidebar } = useDashboard()

  useEffect(() => {
    setMounted(true)

    const handleResize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 1024) {
          setSidebarOpen(false)
        } else {
          setSidebarOpen(true)
        }
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Backdrop for mobile sidebar */}
      {mounted && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative transform ease-in-out transition-all duration-300 z-[100] ${
          mounted && sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } shadow-2xl lg:shadow-xl`}
      >
        <Sidebar user={user} error={error} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 w-full overflow-hidden transform transition-all duration-300 ease-in-out">
        <TopBar
          user={user}
          error={error}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          token={null} // Pass token if needed
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 perspective-1000 transform-gpu">
          {children}
        </main>
      </div>

      {/* Right Sidebar */}
      <div className="flex-shrink-0 z-50">
        <RightSidebar isCollapsed={isRightSidebarCollapsed} onToggle={toggleRightSidebar} />
      </div>
    </div>
  )
}

export default function ClientDashboardLayout({ children, user, error }: ClientDashboardLayoutProps) {
  return (
    <DashboardProvider>
      <DashboardContent user={user} error={error} children={children} />
    </DashboardProvider>
  )
}