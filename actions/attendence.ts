"use server"

import { cookies } from "next/headers"
import type { PaginatedAttendanceResponse, ExportAttendanceResponse } from "@/types/attendance"
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

// ✅ REAL checkIn function (calls your backend)
export async function checkIn(params: {
  userId: string
  method: "gps" | "qr" | "manual"
  latitude: number
  longitude: number
  accuracy: number
  workplaceId?: string
}) {
  const headers = await getAuthHeaders()

  const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/check-in`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
    cache: "no-store"
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Check-in failed" }))
    throw new Error(errorData.message || "Failed to check in")
  }

  return await response.json()
}

// ✅ REAL checkOut function
export async function checkOut(params: {
  userId: string
  method: "gps" | "qr" | "manual"
  latitude: number
  longitude: number
  accuracy: number
  workplaceId?: string
}) {
  const headers = await getAuthHeaders()

  const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/check-out`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
    cache: "no-store"
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Check-out failed" }))
    throw new Error(errorData.message || "Failed to check out")
  }

  return await response.json()
}

// ✅ Get today's attendance
export async function getTodayAttendance(userId: string): Promise<{ data: any | null }> {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/attendance/today/${userId}`,
      {
        headers,
        cache: "no-store"
      }
    )

    if (response.status === 404) return { data: null }
    if (!response.ok) throw new Error("Failed to fetch attendance")

    const result = await response.json()
    return { data: result.data }
  } catch (error: any) {
    if (error instanceof AuthenticationError) throw error
    console.error("getTodayAttendance error:", error.message)
    throw new Error("Unable to load attendance data. Please try again.")
  }
}

// ✅ Get workplaces
export async function getWorkplaces(): Promise<{ data: { id: string; name: string; latitude: number; longitude: number }[] }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/workplaces`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    })

    if (!response.ok) throw new Error("Failed to fetch workplaces")
    const result = await response.json()
    return { data: result.data || [] }
  } catch (error: any) {
    console.error("getWorkplaces error:", error.message)
    throw new Error("Unable to load workplaces")
  }
}

// ✅ Get employee details
export async function getEmployeeDetails(employeeId: string): Promise<{ data: any }> {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/${employeeId}`,
      {
        headers,
        cache: "no-store"
      }
    )

    if (!response.ok) throw new Error("Employee not found")
    const result = await response.json()
    return { data: result.data }
  } catch (error: any) {
    if (error.message.includes("404")) throw new Error(`Employee not found: ${employeeId}`)
    throw new Error("Failed to load employee details")
  }
}

// ✅ Get user ID from employee ID
export async function getUserIdFromEmployeeId(employeeId: string): Promise<{ data: { userId: string } }> {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/${employeeId}/user-id`,
      {
        headers,
        cache: "no-store"
      }
    )

    if (!response.ok) throw new Error("User not found")
    const result = await response.json()
    return { data: result.data }
  } catch (error: any) {
    throw new Error(error.message || "Failed to get user ID")
  }
}

// ✅ Get all attendance records (admin)
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
  data?: any[]
  pagination?: { total: number; page: number; limit: number; totalPages: number }
  message?: string
}> {
  try {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (startDate) searchParams.append("startDate", startDate.toISOString())
    if (endDate) searchParams.append("endDate", endDate.toISOString())
    if (search) searchParams.append("search", search)
    if (status && status !== "All") searchParams.append("status", status)

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/attendance/all?${searchParams.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!response.ok) throw new Error("Failed to load records")

    const result: PaginatedAttendanceResponse = await response.json()
    return { success: true, data: result.data, pagination: result.pagination }
  } catch (error: any) {
    console.error("getAllAttendanceRecordsAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}

// ✅ Export attendance to CSV
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

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/attendance/export?${searchParams.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!response.ok) throw new Error("Export failed")

    const blob = await response.blob()
    const filename =
      response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "attendance_report.csv"

    return { success: true, blob, filename }
  } catch (error: any) {
    console.error("exportAttendanceRecordsAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}