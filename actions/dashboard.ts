"use server"
import { cookies } from "next/headers"
import { getCurrentUserAction } from "./auth"

class AuthenticationError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = "AuthenticationError"
  }
}

// ✅ Get auth headers
const getAuthHeaders = async () => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  
  if (!accessToken) {
    console.error("getAuthHeaders: No access token found")
    throw new AuthenticationError("No access token found. Please log in.", 401)
  }
  
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }
}

// ✅ Check user role helper
const checkUserRole = async () => {
  try {
    const user = await getCurrentUserAction()
    return {
      user,
      role: user?.role?.roleName,
      isAdmin: user?.role?.roleName === 'super_admin',
      isEmployee: user?.role?.roleName === 'employee'
    }
  } catch (error) {
    throw new AuthenticationError("Unable to verify user role", 401)
  }
}

// ✅ Admin Dashboard Actions (Only for super_admin)
export async function getAdminDashboardStats() {
  try {
    const { isAdmin } = await checkUserRole()
    
    if (!isAdmin) {
      throw new AuthenticationError("Access denied. Admin privileges required.", 403)
    }

    const headers = await getAuthHeaders()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/stats`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("getAdminDashboardStats: Error response:", errorText)
      throw new Error(`Failed to fetch dashboard stats: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data: data.data }
  } catch (error: any) {
    console.error("getAdminDashboardStats: Error:", error)
    throw new Error(error.message || "Failed to fetch dashboard statistics")
  }
}

// ✅ Get today's attendance records (Admin only)
export async function getTodayAttendanceRecords(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
} = {}) {
  try {
    const { isAdmin } = await checkUserRole()
    
    if (!isAdmin) {
      throw new AuthenticationError("Access denied. Admin privileges required.", 403)
    }

    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.search) searchParams.append('search', params.search)
    if (params.status && params.status !== 'All') searchParams.append('status', params.status)
    
    console.log("getTodayAttendanceRecords: Fetching with params:", params)
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/attendance/today?${searchParams}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("getTodayAttendanceRecords: Error response:", errorText)
      throw new Error(`Failed to fetch attendance records: ${response.status}`)
    }

    const data = await response.json()
    console.log("getTodayAttendanceRecords: Success")
    return { success: true, data: data.data }
  } catch (error: any) {
    console.error("getTodayAttendanceRecords: Error:", error)
    throw new Error(error.message || "Failed to fetch attendance records")
  }
}

// ✅ Get hourly attendance flow (Admin only)
export async function getHourlyAttendanceFlow(date?: string) {
  try {
    const { isAdmin } = await checkUserRole()
    
    if (!isAdmin) {
      throw new AuthenticationError("Access denied. Admin privileges required.", 403)
    }

    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams()
    
    if (date) searchParams.append('date', date)
    
    console.log("getHourlyAttendanceFlow: Fetching for date:", date || 'today')
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/attendance/hourly-flow?${searchParams}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("getHourlyAttendanceFlow: Error response:", errorText)
      throw new Error(`Failed to fetch hourly flow data: ${response.status}`)
    }

    const data = await response.json()
    console.log("getHourlyAttendanceFlow: Success")
    return { success: true, data: data.data }
  } catch (error: any) {
    console.error("getHourlyAttendanceFlow: Error:", error)
    throw new Error(error.message || "Failed to fetch hourly attendance flow")
  }
}

// ✅ Export attendance data (Admin only)
export async function exportAttendanceData(params: {
  format?: 'csv' | 'excel'
  date?: string
  search?: string
  status?: string
} = {}) {
  try {
    const { isAdmin } = await checkUserRole()
    
    if (!isAdmin) {
      throw new AuthenticationError("Access denied. Admin privileges required.", 403)
    }

    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams()
    
    if (params.format) searchParams.append('format', params.format)
    if (params.date) searchParams.append('date', params.date)
    if (params.search) searchParams.append('search', params.search)
    if (params.status && params.status !== 'All') searchParams.append('status', params.status)
    
    console.log("exportAttendanceData: Exporting with params:", params)
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/attendance/export?${searchParams}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("exportAttendanceData: Error response:", errorText)
      throw new Error(`Failed to export attendance data: ${response.status}`)
    }

    // Return the blob data for download
    const blob = await response.blob()
    console.log("exportAttendanceData: Success")
    return { success: true, blob, filename: `attendance-${new Date().toISOString().split('T')[0]}.csv` }
  } catch (error: any) {
    console.error("exportAttendanceData: Error:", error)
    throw new Error(error.message || "Failed to export attendance data")
  }
}

// ✅ Employee Dashboard Actions (For employees)
export async function getEmployeeAttendanceData() {
  try {
    const { isEmployee } = await checkUserRole()
    
    if (!isEmployee) {
      throw new AuthenticationError("Access denied. Employee privileges required.", 403)
    }

    const headers = await getAuthHeaders()
    
    console.log("getEmployeeAttendanceData: Fetching employee data")
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/employee/attendance-data`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("getEmployeeAttendanceData: Error response:", errorText)
      throw new Error(`Failed to fetch employee attendance data: ${response.status}`)
    }

    const data = await response.json()
    console.log("getEmployeeAttendanceData: Success")
    return { success: true, data: data.data }
  } catch (error: any) {
    console.error("getEmployeeAttendanceData: Error:", error)
    throw new Error(error.message || "Failed to fetch employee attendance data")
  }
}

// ✅ Get employee attendance history
export async function getEmployeeAttendanceHistory({
  page = 1,
  limit = 10,
  month,
  year,
}: {
  page?: number
  limit?: number
  month?: string
  year?: string
} = {}) {
  try {
    const { isEmployee } = await checkUserRole()
    
    if (!isEmployee) {
      throw new AuthenticationError("Access denied. Employee privileges required.", 403)
    }

    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams()
    
    searchParams.append('page', page.toString())
    searchParams.append('limit', limit.toString())
    if (month) searchParams.append('month', month)
    if (year) searchParams.append('year', year)

    console.log("getEmployeeAttendanceHistory: Fetching with params:", { page, limit, month, year })

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employee/attendance-history?${searchParams}`
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('getEmployeeAttendanceHistory: Error response:', response.status, errorText)
      throw new Error(`Failed to fetch attendance history: ${response.status}`)
    }

    const data = await response.json()
    console.log("getEmployeeAttendanceHistory: Success")
    return { success: true, data: data.data }
  } catch (error: any) {
    console.error("getEmployeeAttendanceHistory: Error:", error)
    throw new Error(error.message || "Failed to fetch attendance history")
  }
}

// ✅ Universal dashboard stats (works for both admin and employee)
export async function getDashboardStats() {
  try {
    const { role, isAdmin, isEmployee } = await checkUserRole()
    
    if (isAdmin) {
      // Return admin stats
      return await getAdminDashboardStats()
    } else if (isEmployee) {
      // Return employee stats
      return await getEmployeeAttendanceData()
    } else {
      throw new AuthenticationError("Access denied. Invalid user role.", 403)
    }
  } catch (error: any) {
    console.error("getDashboardStats: Error:", error)
    throw new Error(error.message || "Failed to fetch dashboard statistics")
  }
}

// ✅ Get user role information
export async function getUserRole() {
  try {
    const roleInfo = await checkUserRole()
    return { success: true, data: roleInfo }
  } catch (error: any) {
    console.error("getUserRole: Error:", error)
    throw new Error(error.message || "Failed to get user role")
  }
}
