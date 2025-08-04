"use server"

import { cookies } from "next/headers"
import axios from "axios"

class AuthenticationError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = "AuthenticationError"
  }
}

const getAuthHeaders = async () => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  if (!accessToken) {
    console.error("getAuthHeaders: No access token found")
    throw new AuthenticationError("No access token found.", 401)
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }
}

interface Attendance {
  id: string
  userId: string
  date: string
  status: string
  signInTime?: string
  signInLocation?: { latitude: number; longitude: number }
  signOutTime?: string
  signOutLocation?: { latitude: number; longitude: number }
  workplace?: { id: string; name: string; latitude: number; longitude: number }
  updatedAt: string
}

interface LocationMovement {
  id: string
  userId: string
  latitude: number
  longitude: number
  source: string
  accuracy?: number
  timestamp: string
}

interface LocationAudit {
  id: string
  userId: string
  event: string
  details?: string
  timestamp: string
}

interface EmployeeDetails {
  employee: {
    id: string
    name: string
    email: string
    position: string
    department: string | null
    isOnline: boolean
    lastSeen: string | null
    lastLocation?: { latitude: number; longitude: number; timestamp: string }
  }
  locations: LocationMovement[]
  audits: LocationAudit[]
  attendance: Attendance[]
}

interface CheckInParams {
  userId: string
  method: "gps" | "qr" | "manual" | "ip"
  locationId?: string
  latitude?: number
  longitude?: number
  accuracy?: number
  timestamp?: string
  ipAddress?: string
}

export async function checkIn(params: CheckInParams): Promise<{ message: string; data: Attendance }> {
  try {
    const headers = await getAuthHeaders()
    console.log("checkIn: Sending request with params:", params)

    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/checkin`, params, {
      headers,
      withCredentials: true,
      timeout: 30000,
    })

    console.log("checkIn: Success:", response.data)
    return {
      message: response.data.message,
      data: response.data.data,
    }
  } catch (error: any) {
    console.error("checkIn: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    })
    throw new Error(error.response?.data?.message || error.message || "Failed to check in")
  }
}

export async function checkOut(params: CheckInParams): Promise<{ message: string; data: Attendance }> {
  try {
    const headers = await getAuthHeaders()
    console.log("checkOut: Sending request with params:", params)

    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/checkout`, params, {
      headers,
      withCredentials: true,
      timeout: 30000,
    })

    console.log("checkOut: Success:", response.data)
    return {
      message: response.data.message,
      data: response.data.data,
    }
  } catch (error: any) {
    console.error("checkOut: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    })
    throw new Error(error.response?.data?.message || error.message || "Failed to check out")
  }
}

export async function getEmployeeDetails(employeeId: string): Promise<{ data: EmployeeDetails }> {
  try {
    const headers = await getAuthHeaders();
    console.log("getEmployeeDetails: Fetching for employeeId:", employeeId, "with headers:", headers);

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/${employeeId}`, {
      headers,
      withCredentials: true,
      timeout: 30000,
    });

    console.log("getEmployeeDetails: Success:", {
      status: response.status,
      data: response.data,
    });
    return { data: response.data.data };
  } catch (error: any) {
    console.error("getEmployeeDetails: Error:", {
      message: error.message,
      status: error.response?.status,
      data: typeof error.response?.data === "string" ? error.response.data.slice(0, 200) + "..." : error.response?.data,
      code: error.code,
      headers: error.response?.headers,
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/by-employee/${employeeId}`,
    });

    if (error.response?.status === 404) {
      throw new Error(`Employee not found for ID: ${employeeId}. Please check if the employee exists in the database.`);
    }
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch employee details");
  }
}

export async function getWorkplaces(): Promise<{
  data: { id: string; name: string; latitude: number; longitude: number }[]
}> {
  try {
    const headers = await getAuthHeaders()
    console.log("getWorkplaces: Fetching workplaces")

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/workplaces`, {
      headers,
      withCredentials: true,
      timeout: 30000,
    })

    console.log("getWorkplaces: Success:", response.data)
    return { data: response.data.data || [] }
  } catch (error: any) {
    console.error("getWorkplaces: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    })
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch workplaces")
  }
}

export async function getAllEmployees(): Promise<{ data: { employees: any[] } }> {
  try {
    const headers = await getAuthHeaders();
    console.log("getAllEmployees: Fetching all employees");

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees`, {
      headers,
      withCredentials: true,
      timeout: 30000,
    });

    console.log("getAllEmployees: Success:", response.data);
    return { data: response.data.data };
  } catch (error: any) {
    console.error("getAllEmployees: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    });
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch employees");
  }
}


export async function getUserIdFromEmployeeId(employeeId: string): Promise<{ data: { userId: string } }> {
  try {
    const headers = await getAuthHeaders();
    console.log("getUserIdFromEmployeeId: Fetching userId for employeeId:", employeeId, "with headers:", headers);

    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/${employeeId}/user-id`, {
      headers,
      withCredentials: true,
      timeout: 30000,
    });

    console.log("getUserIdFromEmployeeId: Success:", {
      status: response.status,
      data: response.data,
    });
    return { data: response.data.data };
  } catch (error: any) {
    console.error("getUserIdFromEmployeeId: Error:", {
      message: error.message,
      status: error.response?.status,
      data: typeof error.response?.data === "string" ? error.response.data.slice(0, 200) + "..." : error.response?.data,
      code: error.code,
      headers: error.response?.headers,
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/${employeeId}/user-id`,
    });

    if (error.response?.status === 404) {
      throw new Error(`No user found for Employee ID: ${employeeId}`);
    }
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch user ID");
  }
}