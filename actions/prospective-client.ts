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

// ✅ Create prospective client
export async function createProspectiveClientAction(params: {
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  notes?: string
  userId: string
}) {
  try {
    const headers = await getAuthHeaders()

    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/prospective-clients`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to create prospective client" }))
      throw new Error(errorData.message || "Failed to create prospective client")
    }

    const result = await response.json()
    return { success: true, data: result.data }
  } catch (error: any) {
    console.error("createProspectiveClientAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}

// ✅ Get all prospective clients
export async function getAllProspectiveClientsAction({
  page = 1,
  limit = 10,
  search,
}: {
  page?: number
  limit?: number
  search?: string
} = {}) {
  try {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (search) searchParams.append("search", search)

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/prospective-clients?${searchParams.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    )

    if (!response.ok) throw new Error("Failed to load prospective clients")

    const result = await response.json()
    return { success: true, data: result.data, pagination: result.pagination }
  } catch (error: any) {
    console.error("getAllProspectiveClientsAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}

// ✅ Get prospective client by ID
export async function getProspectiveClientByIdAction(userId: string, clientId: string) {
  try {
    const headers = await getAuthHeaders();
    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/prospective-clients/${clientId}?userId=${userId}`;

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (response.status === 404) {
      return { success: false, message: "Prospective client not found" };
    }

    if (!response.ok) {
      throw new Error("Failed to load prospective client");
    }

    const result = await response.json();
    console.log("getProspectiveClientByIdAction response:", result); // Debug log
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("getProspectiveClientByIdAction error:", error.message);
    const message = errorHandlers.auth(error, false);
    return { success: false, message };
  }
}
// ✅ Get prospective clients by user
export async function getProspectiveClientsByUserAction({
  userId,
  page = 1,
  limit = 10,
  search,
}: {
  userId: string
  page?: number
  limit?: number
  search?: string
}) {
  try {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (search) searchParams.append("search", search)

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/prospective-clients/user/${userId}?${searchParams.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    )

    if (!response.ok) throw new Error("Failed to load user's prospective clients")

    const result = await response.json()
    return { success: true, data: result.data, pagination: result.pagination }
  } catch (error: any) {
    console.error("getProspectiveClientsByUserAction error:", error)
    const message = errorHandlers.auth(error, false)
    return { success: false, message }
  }
}

export const getProspectiveClientsByUser = getProspectiveClientsByUserAction
