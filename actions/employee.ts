'use server'

import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

class AuthenticationError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = "AuthenticationError"
  }
}

// ✅ Get auth headers - now required for attendance operations
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

interface ApiResponse<T> {
  message: string
  data: T
  status: string
}

interface Employee {
  id: string
  employeeId: string
  name: string
  email: string
  department: string
  role: string
  position: string
  totalAttendance: number
  lastOnlineStatus: string
  lastStatusUpdate: string | null
  hireDate: string | null
  createdAt: string
}

interface AttendanceRecord {
  id: string
  date: string
  clockIn: string | null
  clockOut: string | null
  hoursWorked: string
  status: string
  workplace: string
  signInLocation: any
  signOutLocation: any
  method: string
}

interface AttendanceDetails {
  id: string
  date: string
  clockIn: string | null
  clockOut: string | null
  hoursWorked: string
  status: string
  workplace: string
  workplaceAddress: string
  signInLocation: any
  signOutLocation: any
  method: string
  employee: {
    id: string
    name: string
    email: string
    position: string
    department: string
  }
}

interface Department {
  id: string
  name: string
  employeeCount: number
}

export async function getAllEmployeesReal(params?: {
  page?: number
  limit?: number
  search?: string
  department?: string
  status?: string
}): Promise<ApiResponse<{
  employees: Employee[]
  pagination: {
    currentPage: number
    totalPages: number
    totalRecords: number
    hasNext: boolean
    hasPrev: boolean
  }
}>> {
  try {
    const headers = await getAuthHeaders()
    
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.department) searchParams.append('department', params.department)
    if (params?.status) searchParams.append('status', params.status)

    const response = await fetch(`${API_BASE_URL}/api/employeesreal?${searchParams}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('getAllEmployees error:', error)
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new Error(error.message || 'Failed to fetch employees')
  }
}

export async function getEmployeeById(employeeId: string): Promise<ApiResponse<{
  employee: Employee
}>> {
  try {
    const headers = await getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/api/employeesReal/${employeeId}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('getEmployeeById error:', error)
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new Error(error.message || 'Failed to fetch employee details')
  }
}

export async function getEmployeeAttendance(
  employeeId: string,
  params?: {
    page?: number
    limit?: number
    month?: number
    year?: number
    status?: string
  }
): Promise<ApiResponse<{
  employee: { id: string; name: string; email: string }
  records: AttendanceRecord[]
  pagination: {
    currentPage: number
    totalPages: number
    totalRecords: number
    hasNext: boolean
    hasPrev: boolean
  }
}>> {
  try {
    const headers = await getAuthHeaders()
    
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.month) searchParams.append('month', params.month.toString())
    if (params?.year) searchParams.append('year', params.year.toString())
    if (params?.status) searchParams.append('status', params.status)

    const response = await fetch(`${API_BASE_URL}/api/employeesReal/${employeeId}/attendance?${searchParams}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('getEmployeeAttendance error:', error)
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new Error(error.message || 'Failed to fetch employee attendance')
  }
}

export async function getAttendanceDetails(attendanceId: string): Promise<ApiResponse<{
  attendance: AttendanceDetails
}>> {
  try {
    const headers = await getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/api/attendance/${attendanceId}/details`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('getAttendanceDetails error:', error)
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new Error(error.message || 'Failed to fetch attendance details')
  }
}

export async function getDepartments(): Promise<ApiResponse<{
  departments: Department[]
}>> {
  try {
    const headers = await getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/api/departments`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('getDepartments error:', error)
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new Error(error.message || 'Failed to fetch departments')
  }
}

export async function getUserIdFromEmployeeId(employeeId: string): Promise<ApiResponse<{
  userId: string
}>> {
  try {
    const headers = await getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/user-id`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('getUserIdFromEmployeeId error:', error)
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new Error(error.message || 'Failed to fetch user ID')
  }
}
