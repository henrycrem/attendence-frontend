"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { MapPin, Users, Wifi, WifiOff, Eye } from "lucide-react"
import { Toaster, toast } from "react-hot-toast"
import { getAllEmployees } from "@/actions/attendence"

interface Employee {
  id: string
  name: string
  email: string
  position: string
  department: string | null
  isOnline: boolean
  lastSeen: string | null
  lastLocation?: { latitude: number; longitude: number; timestamp?: string; address?: string }
}

const EmployeeListPage = () => {
  const { socket, isAuthenticated } = useAuth()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch employees data
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true)
        console.log("Employees: Fetching all employees")
        const response = await getAllEmployees()
        setEmployees(response.data.employees)
        console.log("Employees: Loaded employees:", response.data.employees)
      } catch (err: any) {
        console.error("Employees: Error fetching employees:", err.message)
        setError(err.message)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchEmployees()
    }
  }, [isAuthenticated])

  // Handle WebSocket updates for employee status and location
  useEffect(() => {
    if (!isAuthenticated || !socket) {
      console.log("Employees: WebSocket not connected, isAuthenticated:", isAuthenticated)
      return
    }

    console.log("Employees: Setting up WebSocket listeners")

    // Listen for location updates for all employees
    const handleLocationUpdate = (data: any) => {
      console.log("Employees: Received locationUpdate:", data)
      const { userId, latitude, longitude, address, timestamp } = data

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === userId
            ? {
                ...emp,
                isOnline: true,
                lastSeen: timestamp,
                lastLocation: { latitude, longitude, address, timestamp },
              }
            : emp,
        ),
      )
    }

    // Listen for user status updates
    const handleUserStatusUpdate = (data: any) => {
      console.log("Employees: Received userStatusUpdate:", data)
      const { userId, isOnline, lastSeen } = data

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === userId
            ? {
                ...emp,
                isOnline,
                lastSeen,
              }
            : emp,
        ),
      )
    }

    // Listen for location errors
    const handleLocationError = ({ error }: { error: string }) => {
      console.error("Employees: Location error from server:", error)
      setError(error)
      toast.error(error)
    }

    // Set up listeners
    socket.on("locationUpdate", handleLocationUpdate)
    socket.on("userStatusUpdate", handleUserStatusUpdate)
    socket.on("locationError", handleLocationError)

    // Listen for individual employee location updates
    employees.forEach((employee) => {
      socket.on(`locationUpdated:${employee.id}`, handleLocationUpdate)
    })

    return () => {
      console.log("Employees: Cleaning up WebSocket listeners")
      socket.off("locationUpdate", handleLocationUpdate)
      socket.off("userStatusUpdate", handleUserStatusUpdate)
      socket.off("locationError", handleLocationError)

      employees.forEach((employee) => {
        socket.off(`locationUpdated:${employee.id}`)
      })
    }
  }, [socket, isAuthenticated, employees])

  // Navigate to employee map page
 // In apps/user-ui/src/app/attendance/employees/page.tsx
const handleEmployeeClick = (userId: string) => {
  console.log("EmployeeListPage: Navigating to employee map for userId:", userId);
  router.push(`/dashboard/users/employee-map/${userId}`);
};

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "N/A"

    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString("en-US", { dateStyle: "medium" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading employees...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: { background: "#1e293b", color: "#e5e7eb", border: "1px solid #475569" },
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-200 mb-2 flex items-center justify-center">
            <Users className="mr-3 text-red-500" size={36} />
            Employee Tracking Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Employees</p>
                <p className="text-2xl font-bold text-gray-200">{employees.length}</p>
              </div>
              <Users className="text-red-500" size={32} />
            </div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Online Now</p>
                <p className="text-2xl font-bold text-green-400">{employees.filter((emp) => emp.isOnline).length}</p>
              </div>
              <Wifi className="text-green-400" size={32} />
            </div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Offline</p>
                <p className="text-2xl font-bold text-red-400">{employees.filter((emp) => !emp.isOnline).length}</p>
              </div>
              <WifiOff className="text-red-400" size={32} />
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {socket && socket.connected ? (
          <div className="bg-green-500/20 border border-green-400/50 rounded-2xl p-4 text-center mb-6">
            <p className="text-green-400 font-medium">✅ Real-time tracking active</p>
          </div>
        ) : (
          <div className="bg-red-500/20 border border-red-400/50 rounded-2xl p-4 text-center mb-6">
            <p className="text-red-400 font-medium">❌ Real-time tracking disconnected</p>
          </div>
        )}

        {/* Employees Table */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-xl font-semibold text-gray-200 flex items-center">
              <MapPin className="mr-2 text-red-500" size={20} />
              Employee Locations
            </h3>
            <p className="text-gray-400 text-sm mt-1">Click on any employee to view their location tracking</p>
          </div>

          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Position</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Last Seen</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-slate-700/20 cursor-pointer"
                      onClick={() => handleEmployeeClick(employee.id)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-200">
                        {employee.isOnline ? (
                          <div className="flex items-center">
                            <Wifi className="mr-2 text-green-400" size={16} />
                            Online
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <WifiOff className="mr-2 text-red-400" size={16} />
                            Offline
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-200">{employee.name}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-200">{employee.position}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-200">
                        {formatLastSeen(employee.lastSeen)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-200">
                        {employee.lastLocation ? (
                          <div className="flex items-center">
                            <MapPin className="mr-2 text-red-500" size={16} />
                            {employee.lastLocation.address ||
                              `${employee.lastLocation.latitude.toFixed(4)}, ${employee.lastLocation.longitude.toFixed(4)}`}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Eye className="mr-2 text-gray-400" size={16} />
                            Not Available
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeeListPage
