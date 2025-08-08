"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import TopBar from "../../shared/widgets/dashboard/topbar"
import Sidebar from "../../shared/widgets/dashboard/sidebar"

interface ClientDashboardLayoutProps {
  children: React.ReactNode
}

export default function ClientDashboardLayout({ children }: ClientDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // 🔥 Use AuthContext to get user and auth state
  const { user, token, isAuthenticated, loading, error } = useAuth()

  // Set mounted flag after initial render (client-only)
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

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      console.log("ClientDashboardLayout: Redirecting to / because user is not authenticated")
      router.push("/")
    }
  }, [mounted, isAuthenticated, loading, router])

  // 🚫 Render nothing until mounted to avoid hydration mismatch
  if (!mounted || loading) {
    return null
  }

  // Show error or redirect if not authenticated
  if (error || !isAuthenticated || !user) {
    console.log("ClientDashboardLayout: Rendering error state", { error, isAuthenticated, user })
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Error</h2>
          <p className="text-gray-600 mb-6">{error || "Unable to load user data"}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Backdrop for mobile sidebar */}
      {mounted && sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative transform ease-in-out transition-all duration-300 z-30 ${
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
          token={token}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 perspective-1000 transform-gpu">
          {children}
        </main>
      </div>
    </div>
  )
}