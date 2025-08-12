'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from "next/cache"
import type { EmployeeFormData,  Role } from "@/types/employee"
import { redirect } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

class AuthenticationError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = "AuthenticationError"
  }
}

interface ApiResponse<T> {
  message: string
  data: T
  status: "success" | "error"
}

// Helper to handle API responses
async function handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.statusText}`)
  }
  return data
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



// ✅ Updated: Create Employee Server Action
export async function createEmployeeAction(
  prevState: any,
  formData: FormData,
): Promise<{ message: string; status: "success" | "error" }> {
  const userId = formData.get("userId") as string
  const hireDateString = formData.get("hireDate") as string
  const hireDate = hireDateString ? new Date(hireDateString) : null
  const salaryString = formData.get("salary") as string
  const salary = salaryString ? parseFloat(salaryString) : null
  const departmentId = formData.get("departmentId") as string | null

  try {
    const response = await fetch(`${API_BASE_URL}/api/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth header if needed
      },
      body: JSON.stringify({ userId, hireDate, salary, departmentId }),
    })

    const result = await handleApiResponse(response)
    if (result.status === "success") {
      revalidatePath("/dashboard/employees")
      redirect("/dashboard/employees")
    }
    return { message: result.message, status: result.status }
  } catch (error: any) {
    console.error("Error creating employee:", error)
    return { message: error.message || "Failed to create employee.", status: "error" }
  }
}

// ✅ New: Update Employee Server Action
export async function updateEmployeeAction(
  employeeId: string,
  prevState: any,
  formData: FormData,
): Promise<{ message: string; status: "success" | "error" }> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const position = formData.get("position") as string
  const departmentId = formData.get("departmentId") as string
  const roleId = formData.get("roleId") as string
  const hireDateString = formData.get("hireDate") as string
  const hireDate = hireDateString ? new Date(hireDateString) : null

  const updateData: Partial<EmployeeFormData> = {
    name,
    email,
    position,
    departmentId,
    roleId,
    hireDate,
  }
  if (password) {
    updateData.password = password
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Add authorization header if needed
      },
      body: JSON.stringify(updateData),
    })

    const result = await handleApiResponse(response)
    if (result.status === "success") {
      revalidatePath("/dashboard/employees") // Revalidate the employee list page
      revalidatePath(`/dashboard/employees/edit/${employeeId}`) // Revalidate the edit page
      redirect("/dashboard/employees") // Redirect to the employee list
    }
    return { message: result.message, status: result.status }
  } catch (error: any) {
    console.error(`Error updating employee ${employeeId}:`, error)
    return { message: error.message || "Failed to update employee.", status: "error" }
  }
}

// ✅ New: Delete Employee Server Action
export async function deleteEmployeeAction(
  employeeId: string,
): Promise<{ message: string; status: "success" | "error" }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Add authorization header if needed
      },
    })

    const result = await handleApiResponse(response)
    if (result.status === "success") {
      revalidatePath("/dashboard/employees") // Revalidate the employee list page
    }
    return { message: result.message, status: result.status }
  } catch (error: any) {
    console.error(`Error deleting employee ${employeeId}:`, error)
    return { message: error.message || "Failed to delete employee.", status: "error" }
  }
}


export async function getRolesAction(): Promise<ApiResponse<{ roles: Role[] }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/roles`, {
      headers: {
        "Content-Type": "application/json",
        // Add authorization header if needed
      },
      next: {
        tags: ["roles"], // Tag for revalidation
      },
    })
    return handleApiResponse(response)
  } catch (error: any) {
    console.error("Error fetching roles:", error)
    return {
      message: error.message || "Failed to fetch roles.",
      data: { roles: [] },
      status: "error",
    }
  }
}


