"use server"

import { cookies } from "next/headers"
import { errorHandlers } from "@/errorHandler"

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

// ✅ Fetch with retry for reliability
const fetchWithRetry = async (url: string, options: RequestInit, retries = 2): Promise<Response> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options)

      if (response.status === 401) {
        throw new AuthenticationError("Your session has expired. Please log in again.", 401)
      }

      return response
    } catch (error) {
      if (i === retries) throw error
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
  throw new Error("Maximum retries exceeded")
}

// ✅ Create task
export async function createTaskAction(params: {
  userId: string
  title: string
  description?: string
  taskType: "CLIENT_VISIT" | "FOLLOW_UP" | "INSTALLATION" | "SURVEY" | "COMPLAINT"
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  notes?: string
  clientId?: string
  latitude: number
  longitude: number
  accuracy?: number
  address: string
  attachments?: string[]
}) {
  try {
    const headers = await getAuthHeaders()

    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to create task" }))
      throw new Error(errorData.message || "Failed to create task")
    }

    const result = await response.json()
    return { success: true, data: result.data }
  } catch (error: any) {
    console.error("createTaskAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}

// ✅ Get all tasks
export async function getAllTasksAction({
  page = 1,
  limit = 10,
  search,
  taskType,
  priority,
}: {
  page?: number
  limit?: number
  search?: string
  taskType?: string
  priority?: string
} = {}) {
  try {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (search) searchParams.append("search", search)
    if (taskType) searchParams.append("taskType", taskType)
    if (priority) searchParams.append("priority", priority)

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tasks?${searchParams.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    )

    if (!response.ok) throw new Error("Failed to load tasks")

    const result = await response.json()
    return { success: true, data: result.data, pagination: result.pagination }
  } catch (error: any) {
    console.error("getAllTasksAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}

// ✅ Get tasks by user
export async function getTasksByUserAction({
  userId,
  page = 1,
  limit = 10,
  search,
  taskType,
  priority,
}: {
  userId: string
  page?: number
  limit?: number
  search?: string
  taskType?: string
  priority?: string
}) {
  try {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (search) searchParams.append("search", search)
    if (taskType) searchParams.append("taskType", taskType)
    if (priority) searchParams.append("priority", priority)

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tasks/user/${userId}?${searchParams.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    )

    if (!response.ok) throw new Error("Failed to load user's tasks")

    const result = await response.json()
    return { success: true, data: result.data, pagination: result.pagination }
  } catch (error: any) {
    console.error("getTasksByUserAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}

// ✅ Get task by ID
export async function getTaskByIdAction(id: string) {
  try {
    const headers = await getAuthHeaders()

    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/tasks/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (response.status === 404) {
      return { success: false, message: "Task not found" }
    }

    if (!response.ok) throw new Error("Failed to load task")

    const result = await response.json()
    return { success: true, data: result.data }
  } catch (error: any) {
    console.error("getTaskByIdAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}

// ✅ Update task completion status
export async function updateTaskCompletionAction(id: string, isCompleted: boolean) {
  try {
    const headers = await getAuthHeaders()

    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/tasks/${id}/completion`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isCompleted }),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to update task" }))
      throw new Error(errorData.message || "Failed to update task")
    }

    const result = await response.json()
    return { success: true, data: result.data }
  } catch (error: any) {
    console.error("updateTaskCompletionAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}
