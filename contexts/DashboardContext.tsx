"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface DashboardContextType {
  isRightSidebarCollapsed: boolean
  setIsRightSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  toggleRightSidebar: () => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)

  const toggleRightSidebar = () => {
    setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
  }

  return (
    <DashboardContext.Provider
      value={{
        isRightSidebarCollapsed,
        setIsRightSidebarCollapsed,
        toggleRightSidebar,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider")
  }
  return context
}