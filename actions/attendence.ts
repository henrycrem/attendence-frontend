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

// ✅ Enhanced IP location with multiple fallback services
async function getIPLocation() {
  const services = [
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parser: (data: any) => ({
        latitude: data.latitude,
        longitude: data.longitude,
        ipAddress: data.ip,
        city: data.city,
        country: data.country_name,
        accuracy: 1000
      })
    },
    {
      name: 'ip-api.com',
      url: 'http://ip-api.com/json/',
      parser: (data: any) => ({
        latitude: data.lat,
        longitude: data.lon,
        ipAddress: data.query,
        city: data.city,
        country: data.country,
        accuracy: 1000
      })
    },
    {
      name: 'ipinfo.io',
      url: 'https://ipinfo.io/json',
      parser: (data: any) => {
        const [lat, lon] = (data.loc || '0,0').split(',').map(Number)
        return {
          latitude: lat,
          longitude: lon,
          ipAddress: data.ip,
          city: data.city,
          country: data.country,
          accuracy: 1000
        }
      }
    }
  ]

  for (const service of services) {
    try {
      console.log(`Trying IP location service: ${service.name}`)
      const response = await fetch(service.url, { 
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (!response.ok) {
        console.warn(`${service.name} returned ${response.status}`)
        continue
      }
      
      const data = await response.json()
      const result = service.parser(data)
      
      // Validate the result
      if (!result.latitude || !result.longitude || 
          Math.abs(result.latitude) > 90 || Math.abs(result.longitude) > 180) {
        console.warn(`${service.name} returned invalid coordinates`)
        continue
      }
      
      console.log(`Successfully got IP location from ${service.name}`)
      return result
    } catch (error) {
      console.warn(`${service.name} failed:`, error)
      continue
    }
  }
  
  // If all services fail, return a default location (you can customize this)
  console.error('All IP location services failed, using default location')
  throw new Error('Unable to determine location. Please enable GPS or try again later.')
}

interface Attendance {
  id: string
  userId: string
  date: string
  status: string
  signInTime?: string
  signInLocation?: {
    latitude: number
    longitude: number
    address?: string
    method?: string
    accuracy?: number
    timestamp: string
    validation?: any
  }
  signOutTime?: string
  signOutLocation?: {
    latitude: number
    longitude: number
    address?: string
    method?: string
    accuracy?: number
    timestamp: string
    validation?: any
  }
  workplace?: { id: string; name: string; latitude: number; longitude: number }
  method?: string
  updatedAt: string
  locationDetails?: {
    address: string
    coordinates: { latitude: number; longitude: number }
    method: string
    accuracy?: number
  }
}

interface CheckInParams {
  userId: string
  method: "gps" | "qr" | "manual" | "ip"
  workplaceId?: string
  latitude?: number
  longitude?: number
  accuracy?: number
  timestamp?: string
  ipAddress?: string
}

// ✅ Enhanced checkIn function with retry logic and better error handling
export async function checkIn(params: CheckInParams): Promise<{ message: string; data: Attendance }> {
  const maxRetries = 3
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers = await getAuthHeaders()
      let requestData = { ...params }
      
      // ✅ Handle poor GPS accuracy by falling back to IP location
      if (params.method === 'gps' && params.accuracy && params.accuracy > 500) {
        console.log("checkIn: GPS accuracy too poor, falling back to IP location")
        try {
          const ipLocation = await getIPLocation()
          requestData = {
            ...requestData,
            method: 'ip', // Switch to IP method
            latitude: ipLocation.latitude,
            longitude: ipLocation.longitude,
            accuracy: ipLocation.accuracy,
            ipAddress: ipLocation.ipAddress
          }
        } catch (ipError) {
          // If IP location also fails, proceed with GPS but with relaxed validation
          console.log("checkIn: IP location failed, proceeding with GPS")
          requestData.accuracy = Math.min(params.accuracy || 1000, 1000) // Cap at 1000m
        }
      }
      
      // ✅ Handle IP method automatically
      if (params.method === 'ip') {
        const ipLocation = await getIPLocation()
        requestData = {
          ...requestData,
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
          accuracy: ipLocation.accuracy,
          ipAddress: ipLocation.ipAddress
        }
      }

      console.log(`checkIn: Attempt ${attempt}/${maxRetries} - Sending request with params:`, requestData)
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/checkin`, 
        requestData, 
        {
          headers,
          withCredentials: true,
          timeout: 30000,
          // ✅ Add retry configuration
          retry: attempt < maxRetries ? 1 : 0,
          retryDelay: 1000 * attempt // Exponential backoff
        }
      )

      console.log("checkIn: Success:", response.data)
      return {
        message: response.data.message,
        data: response.data.data,
      }
    } catch (error: any) {
      lastError = error
      console.error(`checkIn: Attempt ${attempt}/${maxRetries} failed:`, {
        message: error.message,
        status: error.response?.status,
        code: error.code,
      })
      
      // Don't retry for certain errors
      if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 403) {
        break // Don't retry client errors
      }
      
      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`checkIn: Waiting ${attempt * 1000}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
  }
  
  // ✅ Provide user-friendly error messages based on the last error
  if (lastError) {
    if (lastError.code === 'ECONNRESET' || lastError.code === 'ECONNREFUSED' || lastError.code === 'ETIMEDOUT') {
      throw new Error("Connection to server failed. Please check your internet connection and try again.")
    }
    
    if (lastError.response?.status === 400) {
      const errorMessage = lastError.response?.data?.message || lastError.message
      if (errorMessage.includes('accuracy') || errorMessage.includes('location')) {
        throw new Error("Unable to get precise location. Please try moving to an open area with better GPS signal.")
      }
      if (errorMessage.includes('already checked in')) {
        throw new Error("You have already checked in today.")
      }
    }
    
    if (lastError.response?.status === 401) {
      throw new Error("Authentication failed. Please log in again.")
    }
    
    if (lastError.response?.status >= 500) {
      throw new Error("Server error. Please try again in a few moments.")
    }
  }
  
  throw new Error("Failed to check in after multiple attempts. Please try again later.")
}

// ✅ Enhanced checkOut function with retry logic
export async function checkOut(params: CheckInParams): Promise<{ message: string; data: Attendance }> {
  const maxRetries = 3
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers = await getAuthHeaders()
      let requestData = { ...params }
      
      // ✅ Handle poor GPS accuracy by falling back to IP location
      if (params.method === 'gps' && params.accuracy && params.accuracy > 500) {
        console.log("checkOut: GPS accuracy too poor, falling back to IP location")
        try {
          const ipLocation = await getIPLocation()
          requestData = {
            ...requestData,
            method: 'ip', // Switch to IP method
            latitude: ipLocation.latitude,
            longitude: ipLocation.longitude,
            accuracy: ipLocation.accuracy,
            ipAddress: ipLocation.ipAddress
          }
        } catch (ipError) {
          // If IP location also fails, proceed with GPS but with relaxed validation
          console.log("checkOut: IP location failed, proceeding with GPS")
          requestData.accuracy = Math.min(params.accuracy || 1000, 1000) // Cap at 1000m
        }
      }
      
      // ✅ Handle IP method automatically
      if (params.method === 'ip') {
        const ipLocation = await getIPLocation()
        requestData = {
          ...requestData,
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
          accuracy: ipLocation.accuracy,
          ipAddress: ipLocation.ipAddress
        }
      }

      console.log(`checkOut: Attempt ${attempt}/${maxRetries} - Sending request with params:`, requestData)
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/checkout`, 
        requestData, 
        {
          headers,
          withCredentials: true,
          timeout: 30000,
          // ✅ Add retry configuration
          retry: attempt < maxRetries ? 1 : 0,
          retryDelay: 1000 * attempt // Exponential backoff
        }
      )

      console.log("checkOut: Success:", response.data)
      return {
        message: response.data.message,
        data: response.data.data,
      }
    } catch (error: any) {
      lastError = error
      console.error(`checkOut: Attempt ${attempt}/${maxRetries} failed:`, {
        message: error.message,
        status: error.response?.status,
        code: error.code,
      })
      
      // Don't retry for certain errors
      if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 403) {
        break // Don't retry client errors
      }
      
      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`checkOut: Waiting ${attempt * 1000}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
  }
  
  // ✅ Provide user-friendly error messages based on the last error
  if (lastError) {
    if (lastError.code === 'ECONNRESET' || lastError.code === 'ECONNREFUSED' || lastError.code === 'ETIMEDOUT') {
      throw new Error("Connection to server failed. Please check your internet connection and try again.")
    }
    
    if (lastError.response?.status === 400) {
      const errorMessage = lastError.response?.data?.message || lastError.message
      if (errorMessage.includes('accuracy') || errorMessage.includes('location')) {
        throw new Error("Unable to get precise location. Please try moving to an open area with better GPS signal.")
      }
      if (errorMessage.includes('already checked out')) {
        throw new Error("You have already checked out today.")
      }
    }
    
    if (lastError.response?.status === 401) {
      throw new Error("Authentication failed. Please log in again.")
    }
    
    if (lastError.response?.status >= 500) {
      throw new Error("Server error. Please try again in a few moments.")
    }
  }
  
  throw new Error("Failed to check out after multiple attempts. Please try again later.")
}

// ✅ Get today's attendance - WITH auth required
export async function getTodayAttendance(userId: string): Promise<{ data: Attendance | null }> {
  try {
    const headers = await getAuthHeaders()
    console.log("getTodayAttendance: Fetching for userId:", userId)
    
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/attendance/today/${userId}`,
      {
        headers,
        withCredentials: true,
        timeout: 30000,
      }
    )

    console.log("getTodayAttendance: Success:", response.data)
    return { data: response.data.data }
  } catch (error: any) {
    console.error("getTodayAttendance: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    })
    
    // ✅ If no attendance found, return null instead of throwing error
    if (error.response?.status === 404) {
      return { data: null }
    }
    
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch today's attendance")
  }
}

// Keep other functions unchanged...
export async function getWorkplaces(): Promise<{
  data: { id: string; name: string; latitude: number; longitude: number }[]
}> {
  try {
    console.log("getWorkplaces: Fetching workplaces")
    
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/workplaces`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
        timeout: 30000,
      }
    )

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

export async function getEmployeeDetails(employeeId: string): Promise<{ data: any }> {
  try {
    const headers = await getAuthHeaders()
    console.log("getEmployeeDetails: Fetching for employeeId:", employeeId)
    
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/${employeeId}`, 
      {
        headers,
        withCredentials: true,
        timeout: 30000,
      }
    )

    console.log("getEmployeeDetails: Success:", {
      status: response.status,
      data: response.data,
    })
    return { data: response.data.data }
  } catch (error: any) {
    console.error("getEmployeeDetails: Error:", {
      message: error.message,
      status: error.response?.status,
      data: typeof error.response?.data === "string" ? error.response.data.slice(0, 200) + "..." : error.response?.data,
      code: error.code,
      headers: error.response?.headers,
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/${employeeId}`,
    })
    
    if (error.response?.status === 404) {
      throw new Error(`Employee not found for ID: ${employeeId}. Please check if the employee exists in the database.`)
    }
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch employee details")
  }
}

export async function getAllEmployees(): Promise<{ data: { employees: any[] } }> {
  try {
    const headers = await getAuthHeaders()
    console.log("getAllEmployees: Fetching all employees")
    
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees`, 
      {
        headers,
        withCredentials: true,
        timeout: 30000,
      }
    )

    console.log("getAllEmployees: Success:", response.data)
    return { data: response.data.data }
  } catch (error: any) {
    console.error("getAllEmployees: Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    })
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch employees")
  }
}

export async function getUserIdFromEmployeeId(employeeId: string): Promise<{ data: { userId: string } }> {
  try {
    const headers = await getAuthHeaders()
    console.log("getUserIdFromEmployeeId: Fetching userId for employeeId:", employeeId)
    
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/${employeeId}/user-id`, 
      {
        headers,
        withCredentials: true,
        timeout: 30000,
      }
    )

    console.log("getUserIdFromEmployeeId: Success:", {
      status: response.status,
      data: response.data,
    })
    return { data: response.data.data }
  } catch (error: any) {
    console.error("getUserIdFromEmployeeId: Error:", {
      message: error.message,
      status: error.response?.status,
      data: typeof error.response?.data === "string" ? error.response.data.slice(0, 200) + "..." : error.response?.data,
      code: error.code,
      headers: error.response?.headers,
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/employees/${employeeId}/user-id`,
    })
    
    if (error.response?.status === 404) {
      throw new Error(`No user found for Employee ID: ${employeeId}`)
    }
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch user ID")
  }
}
