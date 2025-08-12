"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL

// ✅ Get access token from cookies (re-used from actions/role.ts)
async function getAccessToken() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  if (!accessToken) {
    throw new Error("No access token found. Please log in.")
  }

  return accessToken
}

// ✅ Make authenticated API request (re-used from actions/role.ts)
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken()

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Telecel-Attendance-System/1.0",
      ...options.headers,
    },
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// ✅ Create Department Server Action
export async function createDepartmentAction(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string | null

    if (!name) {
      return { success: false, error: "Department Name is required." }
    }

    const data = await makeAuthenticatedRequest("/api/create-Department", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    })

    revalidatePath("/dashboard/departments") // Revalidate the departments list page
    return { success: true, message: data.message, department: data.department }
  } catch (error) {
    console.error("createDepartmentAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create department",
    }
  }
}

// ✅ Get All Departments Server Action
export async function getAllDepartmentsAction(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)

    const url = `/api/alldepartments${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    const data = await makeAuthenticatedRequest(url)

    // Assuming the API returns { departments: Department[], status: "success", pagination?: Pagination }
    return { success: true, data: data.departments, pagination: data.pagination }
  } catch (error) {
    console.error("getAllDepartmentsAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch departments",
      data: [],
      pagination: { currentPage: 1, totalPages: 1, totalRecords: 0, hasNext: false, hasPrev: false },
    }
  }
}

// ✅ Get Department by ID Server Action
export async function getDepartmentByIdAction(departmentId: string) {
  try {
    const data = await makeAuthenticatedRequest(`/api/departments/${departmentId}`)
    return { success: true, data: data.department }
  } catch (error) {
    console.error("getDepartmentByIdAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch department",
      data: null,
    }
  }
}

// ✅ Update Department Server Action
export async function updateDepartmentAction(departmentId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string | null

    const data = await makeAuthenticatedRequest(`/api/departments/${departmentId}`, {
      method: "PUT",
      body: JSON.stringify({ name, description }),
    })

    revalidatePath("/dashboard/departments")
    revalidatePath(`/dashboard/departments/edit/${departmentId}`)
    revalidatePath(`/dashboard/departments/${departmentId}`) // If there's a view page
    return { success: true, message: data.message, department: data.department }
  } catch (error) {
    console.error("updateDepartmentAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update department",
    }
  }
}

// ✅ Delete Department Server Action
export async function deleteDepartmentAction(departmentId: string) {
  try {
    const data = await makeAuthenticatedRequest(`/api/departments/${departmentId}`, {
      method: "DELETE",
    })

    revalidatePath("/dashboard/departments")
    return { success: true, message: data.message }
  } catch (error) {
    console.error("deleteDepartmentAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete department",
    }
  }
}
