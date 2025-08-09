"use server"

import { cookies } from "next/headers"
import { errorHandlers } from "@/errorHandler"
import type { PaginatedAttendanceResponse, ExportAttendanceResponse, LocationData } from "@/types/attendance"


class AuthenticationError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = "AuthenticationError"
  }
}
// Re-using existing auth and fetch helpers from actions/dashboard.ts
// You might need to adjust paths if these are not globally available or move them to a shared lib folder in the directory included
const getAuthHeaders = async () => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  if (!accessToken) {
    console.error("getAuthHeaders: No access token found")
    throw new AuthenticationError("Your session has expired. Please log in again.", 401)
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }
}

const fetchWithRetry = async (url: string, options: RequestInit, retries = 2): Promise<Response> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options)

      // If it's a 401, don't retry - it's an auth issue
      if (response.status === 401) {
        throw new AuthenticationError("Your session has expired. Please log in again.", 401)
      }

      return response
    } catch (error) {
      if (i === retries) throw error

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }

  throw new Error("Maximum retries exceeded")
}

// ✅ Server Action to fetch all attendance records
export async function getAllAttendanceRecordsAction({
  page = 1,
  limit = 10,
  startDate,
  endDate,
  search,
  status,
}: {
  page?: number
  limit?: number
  startDate?: Date
  endDate?: Date
  search?: string
  status?: string
}): Promise<{
  success: boolean
  data?: PaginatedAttendanceResponse["data"]
  pagination?: PaginatedAttendanceResponse["pagination"]
  message?: string
}> {
  try {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams()

    searchParams.append("page", page.toString())
    searchParams.append("limit", limit.toString())
    if (startDate) searchParams.append("startDate", startDate.toISOString())
    if (endDate) searchParams.append("endDate", endDate.toISOString())
    if (search) searchParams.append("search", search)
    if (status && status !== "All") searchParams.append("status", status)

    // Corrected URL: Removed the extra '/api' prefix
    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/attendance/all?${searchParams.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("getAllAttendanceRecordsAction: Error response:", errorText)
      throw new Error(`Failed to load attendance records: ${response.status} - ${errorText}`)
    }

    const result: PaginatedAttendanceResponse = await response.json()
    return { success: true, data: result.data, pagination: result.pagination }
  } catch (error: any) {
    console.error("getAllAttendanceRecordsAction: Error:", error)
    const friendlyMessage = errorHandlers.auth(error, false) // Use auth handler for general errors
    return { success: false, message: friendlyMessage }
  }
}

// ✅ Server Action to export attendance records
export async function exportAttendanceRecordsAction({
  startDate,
  endDate,
  search,
  status,
}: {
  startDate?: Date
  endDate?: Date
  search?: string
  status?: string
}): Promise<ExportAttendanceResponse> {
  try {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams()

    if (startDate) searchParams.append("startDate", startDate.toISOString())
    if (endDate) searchParams.append("endDate", endDate.toISOString())
    if (search) searchParams.append("search", search)
    if (status && status !== "All") searchParams.append("status", status)

    // Corrected URL: Removed the extra '/api' prefix
    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/attendance/export?${searchParams.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("exportAttendanceRecordsAction: Error response:", errorText)
      throw new Error(`Failed to export attendance data: ${response.status} - ${errorText}`)
    }

    const blob = await response.blob()
    const filename =
      response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "attendance_report.csv"

    return { success: true, blob, filename }
  } catch (error: any) {
    console.error("exportAttendanceRecordsAction: Error:", error)
    const friendlyMessage = errorHandlers.auth(error, false)
    return { success: false, message: friendlyMessage }
  }
}

// Assuming checkInAction and checkOutAction are also in this file or a similar actions file
export async function checkInAction(userId: string, location: LocationData) {
  try {
    const headers = await getAuthHeaders()
    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/checkin`, // Corrected URL
      {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, ...location }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Failed to check in: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, message: data.message, data: data.data }
  } catch (error: any) {
    console.error("checkInAction: Error:", error)
    const friendlyMessage = errorHandlers.network(error, false) // Use network handler for fetch errors
    return { success: false, message: friendlyMessage }
  }
}

export async function checkOutAction(userId: string, location: LocationData) {
  try {
    const headers = await getAuthHeaders()
    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout`, // Corrected URL
      {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, ...location }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Failed to check out: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, message: data.message, data: data.data }
  } catch (error: any) {
    console.error("checkOutAction: Error:", error)
    const friendlyMessage = errorHandlers.network(error, false) // Use network handler for fetch errors
    return { success: false, message: friendlyMessage }
  }
}
