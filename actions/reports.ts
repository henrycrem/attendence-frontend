// actions/reports.ts
"use server";

import { cookies } from "next/headers";
import { handleError, errorHandlers } from "../errorHandler";
import { getCurrentUserAction } from "./auth";

class AuthenticationError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = "AuthenticationError"
  }
}

// ✅ Get auth headers with better error handling
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

// ✅ Check user role helper with better error handling
const checkUserRole = async () => {
  try {
    const user = await getCurrentUserAction()
    return {
      user,
      role: user?.role?.roleName,
      isAdmin: user?.role?.roleName === 'super_admin',
      isEmployee: user?.role?.roleName === 'employee',
      isSales: user?.role?.roleName === 'sales'
    }
  } catch (error) {
    throw new AuthenticationError("Unable to verify your account. Please log in again.", 401)
  }
}

// ✅ Enhanced fetch with retry mechanism
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
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
  
  throw new Error("Maximum retries exceeded")
}

export async function generateAttendanceReport({
  startDate,
  endDate,
  format = 'json',
}: {
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'csv' | 'pdf' | 'excel';
}) {
  try {
    const { isAdmin } = await checkUserRole();

    if (!isAdmin) {
      throw new AuthenticationError(
        "Access denied. Administrator privileges required.",
        403
      );
    }

    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    if (format) searchParams.append('format', format);

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/reports/attendance?${searchParams}`,
      { method: "GET", headers, cache: "no-store" }
    );

    if (format === 'csv' || format === 'excel') {
      const blob = await response.blob();
      return { 
        success: true, 
        blob, 
        filename: `attendance-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
      };
    } else {
      const data = await response.json();
      
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to generate attendance report");
      }

      return { 
        success: true, 
        data: data.data 
      };
    }
  } catch (error: any) {
    console.error("generateAttendanceReport: Error:", error);
    const friendlyMessage = errorHandlers.auth(error, false);
    throw new Error(friendlyMessage);
  }
}

// Generate Sales Report
export async function generateSalesReport({
  startDate,
  endDate,
  format = 'json',
}: {
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'csv' | 'pdf' | 'excel';
}) {
  try {
    const { isAdmin } = await checkUserRole();

    if (!isAdmin) {
      throw new AuthenticationError(
        "Access denied. Administrator privileges required.",
        403
      );
    }

    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    if (format) searchParams.append('format', format);

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/reports/sales?${searchParams}`,
      { method: "GET", headers, cache: "no-store" }
    );

    if (format === 'csv' || format === 'excel') {
      const blob = await response.blob();
      return { 
        success: true, 
        blob, 
        filename: `sales-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
      };
    } else {
      const data = await response.json();
      
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to generate sales report");
      }

      return { 
        success: true, 
        data: data.data 
      };
    }
  } catch (error: any) {
    console.error("generateSalesReport: Error:", error);
    const friendlyMessage = errorHandlers.auth(error, false);
    throw new Error(friendlyMessage);
  }
}

// Generate Team Report
export async function generateTeamReport({
  startDate,
  endDate,
  format = 'json',
}: {
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'csv' | 'pdf' | 'excel';
}) {
  try {
    const { isAdmin } = await checkUserRole();

    if (!isAdmin) {
      throw new AuthenticationError(
        "Access denied. Administrator privileges required.",
        403
      );
    }

    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    if (format) searchParams.append('format', format);

    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/reports/team?${searchParams}`,
      { method: "GET", headers, cache: "no-store" }
    );

    if (format === 'csv' || format === 'excel') {
      const blob = await response.blob();
      return { 
        success: true, 
        blob, 
        filename: `team-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
      };
    } else {
      const data = await response.json();
      
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to generate team report");
      }

      return { 
        success: true, 
        data: data.data 
      };
    }
  } catch (error: any) {
    console.error("generateTeamReport: Error:", error);
    const friendlyMessage = errorHandlers.auth(error, false);
    throw new Error(friendlyMessage);
  }
}