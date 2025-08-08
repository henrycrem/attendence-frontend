'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { LoginState } from '../types/auth'



const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL

// ✅ Add input sanitization
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"']/g, '') // Remove potential XSS characters
}

// ✅ Enhanced password validation
function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" }
  }
  
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return { 
      isValid: false, 
      message: "Password must contain uppercase, lowercase, and numbers" 
    }
  }
  
  // ✅ Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123']
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    return { isValid: false, message: "Password is too common. Please choose a stronger password" }
  }
  
  return { isValid: true, message: "" }
}

// ✅ Simplified rate limiting (fallback to basic checks until backend endpoints are ready)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function isAccountLocked(email: string): boolean {
  const attempts = loginAttempts.get(email)
  if (!attempts) return false
  
  const now = Date.now()
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email)
    return false
  }
  
  return attempts.count >= MAX_LOGIN_ATTEMPTS
}

function recordFailedAttempt(email: string): void {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 }
  attempts.count++
  attempts.lastAttempt = Date.now()
  loginAttempts.set(email, attempts)
  console.warn(`Failed login attempt for email: ${email}. Count: ${attempts.count}`)
}

function clearFailedAttempts(email: string): void {
  loginAttempts.delete(email)
}

export async function verifyUserAction(formData: FormData) {
  const email = sanitizeInput(formData.get('email') as string || '')
  const otp = sanitizeInput(formData.get('otp') as string || '')
  const password = formData.get('password') as string || ''
  const name = sanitizeInput(formData.get('name') as string || '')
  const roleId = sanitizeInput(formData.get('roleId') as string || '')

  if (!email || !otp || !password || !name || !roleId) {
    return { error: 'All fields are required' }
  }

  // ✅ Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address' }
  }

  // ✅ Validate OTP format (assuming 6 digits)
  const otpRegex = /^\d{6}$/
  if (!otpRegex.test(otp)) {
    return { error: 'OTP must be 6 digits' }
  }

  // ✅ Validate password strength
  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.message }
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify-user`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Telecel-Attendance-System/1.0'
      },
      body: JSON.stringify({ email, otp, password, name, roleId }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Verification failed')
    }

    console.log(`Successful user verification for: ${email}`)
    return { success: true, message: 'Verification successful! Redirecting to login...' }
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'An error occurred during verification'
    console.error('Verification error:', errorMessage)
    return { error: errorMessage }
  }
}

export async function loginUserAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = sanitizeInput(formData.get("email") as string || '')
  const password = formData.get("password") as string || ''

  // ✅ Check basic rate limiting
  if (isAccountLocked(email)) {
    console.warn(`Login attempt on locked account: ${email}`)
    return { 
      error: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.", 
      success: false, 
      message: null, 
      redirect: undefined 
    }
  }

  // Validate input
  if (!email || !password) {
    return { 
      error: "Email and password are required", 
      success: false, 
      message: null, 
      redirect: undefined 
    }
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) {
    return { 
      error: "Please enter a valid email address", 
      success: false, 
      message: null, 
      redirect: undefined 
    }
  }

  if (password.length < 6) {
    return { 
      error: "Password must be at least 6 characters long", 
      success: false, 
      message: null, 
      redirect: undefined 
    }
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/login`
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "Telecel-Attendance-System/1.0",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.error("Non-JSON response:", text)
      recordFailedAttempt(email)
      return { 
        error: "Invalid email or password", 
        success: false, 
        message: null, 
        redirect: undefined 
      }
    }

    const data = await response.json()

    if (!response.ok) {
      recordFailedAttempt(email)
      
      // ✅ Normalize ALL failed login responses to same message
      return { 
        error: "Invalid email or password", 
        success: false, 
        message: null, 
        redirect: undefined 
      }
    }

    // ✅ Clear failed attempts on successful login
    clearFailedAttempts(email)

    // ✅ Get the cookie store
    const cookieStore = await cookies()

    // ✅ Parse and set cookies
    const cookieHeader = response.headers.get("set-cookie")
    if (cookieHeader) {
      const cookieStrings = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader]
      
      cookieStrings.forEach((cookieStr) => {
        if (!cookieStr) return
        
        const parts = cookieStr.split(";")
        const [name, value] = parts[0].split("=")
        
        if (name && value) {
          cookieStore.set(name.trim(), value.trim(), {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
            maxAge: 60 * 60 * 8, // 8 hours
          })
        }
      })
    } else {
      // ✅ Fallback: extract tokens from response data
      if (data.accessToken) {
        cookieStore.set("access_token", data.accessToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 8,
        })
      }
      
      if (data.refreshToken) {
        cookieStore.set("refresh_token", data.refreshToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        })
      }
    }

    // ✅ Fetch user data
    const accessToken = cookieStore.get("access_token")?.value
    if (!accessToken) {
      // ✅ Even on success, if we can't get user data, treat as failure
      return { 
        error: "Invalid email or password", 
        success: false, 
        message: null, 
        redirect: undefined 
      }
    }

    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Telecel-Attendance-System/1.0"
      },
    })

    if (!userResponse.ok) {
      return { 
        error: "Invalid email or password", 
        success: false, 
        message: null, 
        redirect: undefined 
      }
    }

    const userData = await userResponse.json()
    const role = userData.user?.role?.roleName

    console.log(`Successful login for user: ${email} with role: ${role}`)

    // ✅ Return redirect based on role
    if (role === "employee") {
      return {
        success: true,
        message: "Login successful!",
        error: "",
        redirect: "/dashboard/attendance/my-records"
      }
    }

    if (role === "super_admin") {
      return {
        success: true,
        message: "Login successful!",
        error: "",
        redirect: "/dashboard"
      }
    }

    // Fallback
    return {
      success: true,
      message: "Login successful!",
      error: "",
      redirect: "/dashboard"
    }

  } catch (error) {
    console.error("Login error:", error)
    recordFailedAttempt(email)
    
    // ✅ Generic error for ALL exceptions
    return { 
      error: "Invalid email or password", 
      success: false, 
      message: null, 
      redirect: undefined 
    }
  }
}

export async function getCurrentUserAction() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  const refreshToken = cookieStore.get("refresh_token")?.value

  console.log("getCurrentUserAction: Checking cookies...")
  console.log("getCurrentUserAction: Access token exists:", !!accessToken)
  console.log("getCurrentUserAction: Refresh token exists:", !!refreshToken)

  if (!accessToken) {
    console.error("getCurrentUserAction: No access token found")
    throw new Error("No access token found. Please log in.")
  }

  try {
    console.log("getCurrentUserAction: Making request to /api/me...")
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/me`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "Telecel-Attendance-System/1.0",
      },
      credentials: 'include',
      cache: 'no-store', // ✅ Prevent caching issues
    })

    console.log("getCurrentUserAction: Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("getCurrentUserAction: Error response:", errorText)
      
      // ✅ Handle token expiration more gracefully
      if (response.status === 401) {
        console.log("getCurrentUserAction: Token expired, attempting refresh...")
        
        // Try to refresh token if we have a refresh token
        if (refreshToken) {
          try {
            await refreshTokenAction()
            console.log("getCurrentUserAction: Token refreshed successfully, retrying...")
            
            // Retry the request with new token
            const newAccessToken = (await cookies()).get("access_token")?.value
            if (newAccessToken) {
              const retryResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/me`, {
                method: 'GET',
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${newAccessToken}`,
                  "User-Agent": "Telecel-Attendance-System/1.0",
                },
                credentials: 'include',
                cache: 'no-store',
              })
              
              if (retryResponse.ok) {
                const data = await retryResponse.json()
                console.log("getCurrentUserAction: Successfully fetched user data after refresh")
                return data.user
              }
            }
          } catch (refreshError) {
            console.error("getCurrentUserAction: Token refresh failed:", refreshError)
          }
        }
        
        throw new Error("Session expired. Please log in again.")
      }
      
      throw new Error(`Failed to fetch current user: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("getCurrentUserAction: Successfully fetched user data")
    
    return data.user
  } catch (error) {
    console.error("getCurrentUserAction: Error:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch current user"
    throw new Error(message)
  }
}

export async function checkAuthStatus() {
  try {
    const user = await getCurrentUserAction()
    return { isAuthenticated: true, user, error: null }
  } catch (error: any) {
    return { isAuthenticated: false, user: null, error: error.message }
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value

    // ✅ Call logout endpoint to invalidate token on server
    if (accessToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/logout`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "User-Agent": "Telecel-Attendance-System/1.0"
          },
          credentials: 'include',
        })
      } catch (error) {
        console.error("Error calling logout endpoint:", error)
        // Continue with local logout even if server logout fails
      }
    }

    // ✅ Clear cookies
    cookieStore.delete("access_token")
    cookieStore.delete("refresh_token")
    
    console.log("User logged out successfully")
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "Failed to logout" }
  }
}

export async function getClientToken() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  console.log("getClientToken: Access token:", accessToken ? `${accessToken.slice(0, 20)}...` : "null")

  if (!accessToken) {
    throw new Error("No access token found")
  }

  return accessToken
}

// ✅ Enhanced token refresh function
export async function refreshTokenAction() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get("refresh_token")?.value

  console.log("refreshTokenAction: Attempting token refresh...")

  if (!refreshToken) {
    console.error("refreshTokenAction: No refresh token found")
    throw new Error("No refresh token found")
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/refresh`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Telecel-Attendance-System/1.0"
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
      cache: 'no-store',
    })

    console.log("refreshTokenAction: Refresh response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("refreshTokenAction: Refresh failed:", errorText)
      throw new Error("Failed to refresh token")
    }

    const data = await response.json()
    console.log("refreshTokenAction: Refresh successful")
    
    // ✅ Set new tokens with same settings as login
    if (data.accessToken) {
      cookieStore.set("access_token", data.accessToken, {
        httpOnly: false, // ✅ Must be false for middleware
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours
      })
    }

    if (data.refreshToken) {
      cookieStore.set("refresh_token", data.refreshToken, {
        httpOnly: false, // ✅ Must be false for middleware
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    console.log("refreshTokenAction: New tokens set successfully")
    return { success: true }
  } catch (error) {
    console.error("refreshTokenAction: Error:", error)
    // ✅ Clear invalid tokens
    cookieStore.delete("access_token")
    cookieStore.delete("refresh_token")
    throw error
  }
}


export async function getDepartments() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/departments`, {
      headers: {
        'User-Agent': 'Telecel-Attendance-System/1.0',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch departments')
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('getDepartments error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch departments' 
    }
  }
}


export async function getRoles() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/roles`, {
      headers: {
        'User-Agent': 'Telecel-Attendance-System/1.0',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch roles')
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('getRoles error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch roles' 
    }
  }
}


export async function forgetPasswordAction(email: string) {
  try {
    if (!email) {
      return { 
        success: false, 
        error: 'Email is required' 
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/forgot-password-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    // ✅ Case 1: Success (200)
    if (response.ok) {
      return { 
        success: true, 
        data,
        error: null 
      }
    }

    // ✅ Case 2: Known validation error from backend
    if (data.error || data.message) {
      // Only pass through safe messages
      const userFacingMessage = data.message || data.error

      // Allow known safe messages
      if (
        userFacingMessage === "Email is required" ||
        userFacingMessage === "Failed to send password reset email. Please try again."
      ) {
        return { 
          success: false, 
          error: userFacingMessage 
        }
      }
    }

    // ✅ Case 3: Any other error (500, network, unknown) → generic message
    return { 
      success: false, 
      error: 'Failed to send password reset email. Please try again.' 
    }

  } catch (error) {
    console.error('forgetPasswordAction error:', error)

    // ✅ Never show raw error (e.g., network failure, CORS, JSON parse)
    return { 
      success: false, 
      error: 'Failed to send password reset email. Please check your connection and try again.' 
    }
  }
}

// ✅ Verify Reset Password OTP
export async function verifyResetPasswordOtpAction(email: string, otp: string) {
  try {
    if (!email || !otp) {
      return { success: false, error: 'Email and OTP are required' }
    }

    const response = await fetch(`${API_BASE_URL}/api/verify-reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('verifyResetPasswordOtpAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify OTP' 
    }
  }
}

// ✅ Reset Password
export async function resetPasswordAction(email: string, newPassword: string) {
  try {
    if (!email || !newPassword) {
      return { success: false, error: 'Email and new password are required' }
    }

    const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, newPassword }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('resetPasswordAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reset password' 
    }
  }
}