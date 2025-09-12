"use server"

import { cookies } from "next/headers"

class AuthenticationError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = "AuthenticationError"
  }
}

interface AnalyticsResponse {
  success: boolean;
  message?: string;
  data?: any;
}


interface RevenueTrendsResponse {
  success: boolean;
  message?: string;
  data?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000"

// ✅ Get auth headers — SAME METHOD AS WORKING attendance/tasks actions
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

// ✅ Fetch with retry — SAME METHOD AS WORKING actions
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options)

      if (response.status === 401) {
        throw new AuthenticationError("Your session has expired. Please log in again.", 401)
      }

      if (response.ok) return response

      if (i === retries) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      if (i === retries) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error("Max retries exceeded")
}

// ✅ Get sales dashboard analytics for individual sales member — FIXED
export async function getSalesDashboardAnalytics(userId?: string, period = "month") {
  try {
    const headers = await getAuthHeaders() // ✅ Use cookie-based auth

    const queryParams = new URLSearchParams()
    if (userId) queryParams.append("userId", userId)
    queryParams.append("period", period)

    const url = `${API_BASE_URL}/api/dashboard/sales?${queryParams.toString()}`

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    const data = await response.json()

    if (data.status === "success") {
      return { success: true, data: data.data }
    } else {
      return { success: false, error: data.message || "Failed to fetch sales analytics" }
    }
  } catch (error: any) {
    console.error("getSalesDashboardAnalytics error:", error.message)
    return { success: false, error: error.message || "Failed to fetch sales analytics" }
  }
}

// ✅ Get team analytics for admin dashboard — FIXED
export async function getTeamAnalytics(period = "month", departmentId?: string) {
  try {
    const headers = await getAuthHeaders()

    const queryParams = new URLSearchParams()
    queryParams.append("period", period)
    if (departmentId) queryParams.append("departmentId", departmentId)

    const url = `${API_BASE_URL}/api/dashboard/team?${queryParams.toString()}`

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    const data = await response.json()

    if (data.status === "success") {
      return { success: true, data: data.data }
    } else {
      return { success: false, error: data.message || "Failed to fetch team analytics" }
    }
  } catch (error: any) {
    console.error("getTeamAnalytics error:", error.message)
    return { success: false, error: error.message || "Failed to fetch team analytics" }
  }
}

// ✅ Get revenue analytics — FIXED
export async function getRevenueAnalytics(userId?: string, period = "month") {
  try {
    const headers = await getAuthHeaders()

    const queryParams = new URLSearchParams()
    if (userId) queryParams.append("userId", userId)
    queryParams.append("period", period)

    const url = `${API_BASE_URL}/api/dashboard/revenue?${queryParams.toString()}`

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    const data = await response.json()

    if (data.status === "success") {
      return { success: true, data: data.data }
    } else {
      return { success: false, error: data.message || "Failed to fetch revenue analytics" }
    }
  } catch (error: any) {
    console.error("getRevenueAnalytics error:", error.message)
    return { success: false, error: error.message || "Failed to fetch revenue analytics" }
  }
}

// ✅ Get all prospective clients with filtering — FIXED
export async function getAllProspectiveClients(
  page = 1,
  limit = 10,
  search?: string,
  status?: string,
  serviceInterest?: string,
  neighborhood?: string,
) {
  try {
    const headers = await getAuthHeaders()

    const queryParams = new URLSearchParams()
    queryParams.append("page", page.toString())
    queryParams.append("limit", limit.toString())
    if (search) queryParams.append("search", search)
    if (status) queryParams.append("status", status)
    if (serviceInterest) queryParams.append("serviceInterest", serviceInterest)
    if (neighborhood) queryParams.append("neighborhood", neighborhood)

    const url = `${API_BASE_URL}/api/prospective-clients?${queryParams.toString()}`

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    const data = await response.json()

    if (data.status === "success") {
      return { success: true, data: data.data }
    } else {
      return { success: false, error: data.message || "Failed to fetch prospective clients" }
    }
  } catch (error: any) {
    console.error("getAllProspectiveClients error:", error.message)
    return { success: false, error: error.message || "Failed to fetch prospective clients" }
  }
}

// ✅ Get prospective clients by user — FIXED
export async function getProspectiveClientsByUser(
  userId: string,
  page = 1,
  limit = 10,
  search?: string,
  status?: string
) {
  try {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (search) queryParams.append("search", search);
    if (status) queryParams.append("status", status);

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/prospective-clients/user/${userId}?${queryParams.toString()}`;

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();
    console.log("getProspectiveClientsByUser response:", data);

    if (data.status === "success") {
      return { success: true, data: data.data };
    } else {
      console.error("getProspectiveClientsByUser failed:", data.message);
      return { success: false, error: data.message || "Failed to fetch user's prospective clients" };
    }
  } catch (error: any) {
    console.error("getProspectiveClientsByUser error:", error.message);
    return { success: false, error: error.message || "Failed to fetch user's prospective clients" };
  }
}


export async function getSalesDashboardAnalyticsChart({
  userId,
  period = "month",
}: {
  userId: string;
  period?: "day" | "week" | "month" | "year";
}): Promise<AnalyticsResponse> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    const headers = await getAuthHeaders();

    const searchParams = new URLSearchParams();
    if (period) searchParams.append("period", period);

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/dashboard/sales?userId=${encodeURIComponent(
      userId
    )}&${searchParams.toString()}`;

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to load analytics" }));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}: Failed to load analytics`,
      };
    }

    const result = await response.json();

    // Backend returns { message, data, status: "success" }
    // We map it to { success: true, data, message }
    if (result.status === "success") {
      return {
        success: true,
        data: result.data,
        message: result.message,
      };
    } else {
      return {
        success: false,
        message: result.message || "Unknown error from server",
      };
    }
  } catch (error: any) {
    console.error("getSalesDashboardAnalyticsChart error:", error);
    return {
      success: false,
      message: error.message || "Failed to load analytics due to network error",
    };
  }
}


export async function getDailyRevenueTrendsAction({
  userId,
  period = "month",
}: {
  userId: string;
  period?: "day" | "week" | "month" | "year";
}): Promise<RevenueTrendsResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    const headers = await getAuthHeaders();

    const searchParams = new URLSearchParams();
    if (period) searchParams.append("period", period);

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/analytics/daily-revenue?userId=${encodeURIComponent(
      userId
    )}&${searchParams.toString()}`;

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to load revenue trends" }));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}: Failed to load revenue trends`,
      };
    }

    const result = await response.json();

    return {
      success: result.status === "success",
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("getDailyRevenueTrendsAction error:", error);
    return {
      success: false,
      message: error.message || "Failed to load revenue trends due to network error",
    };
  }
}