'use server'

import { revalidatePath } from 'next/cache'
import type { User, UserProfileResponse } from "@/types/user"
const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL
import { parseError } from "@/lib/error-handler"
import { errorHandlers } from '@/errorHandler'

// ✅ Get access token from cookies
async function getAccessToken() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  
  if (!accessToken) {
    throw new Error('No access token found. Please log in.')
  }
  
  return accessToken
}

async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken()

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Telecel-Attendance-System/1.0",
      ...options.headers,
      // Content-Type is handled by FormData for file uploads, or explicitly set for JSON
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
  })
    if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// ✅ Get All Users
export async function getAllUsersAction(params?: {
  page?: number
  limit?: number
  search?: string
  role?: string
  department?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.role) queryParams.append('role', params.role)
    if (params?.department) queryParams.append('department', params.department)

    const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const data = await makeAuthenticatedRequest(url)
    
    return { success: true, data }
  } catch (error) {
    console.error('getAllUsersAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch users' 
    }
  }
}

// ✅ Get User by ID
export async function getUserByIdAction(userId: string) {
  try {
    const data = await makeAuthenticatedRequest(`/api/user/${userId}`)
    return { success: true, data }
  } catch (error) {
    console.error('getUserByIdAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user' 
    }
  }
}

// ✅ Update User
export async function updateUserAction(userId: string, userData: {
  name?: string
  email?: string
  roleId?: string
  departmentId?: string | null
  position?: string | null
}) {
  try {
    const data = await makeAuthenticatedRequest(`/api/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
    
    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${userId}`)
    
    return { success: true, data }
  } catch (error) {
    console.error('updateUserAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user' 
    }
  }
}

// ✅ Delete User
export async function deleteUserAction(userId: string) {
  try {
    const data = await makeAuthenticatedRequest(`/api/user/${userId}`, {
      method: 'DELETE',
    })
    
    revalidatePath('/dashboard/users')
    
    return { success: true, data }
  } catch (error) {
    console.error('deleteUserAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete user' 
    }
  }
}

// ✅ Update User Status
export async function updateUserStatusAction(userId: string, status: 'online' | 'offline') {
  try {
    const data = await makeAuthenticatedRequest(`/api/user/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    
    revalidatePath('/dashboard/users')
    
    return { success: true, data }
  } catch (error) {
    console.error('updateUserStatusAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user status' 
    }
  }
}

// ✅ Get User Statistics
export async function getUserStatsAction() {
  try {
    const data = await makeAuthenticatedRequest('/api/userstats')
    return { success: true, data }
  } catch (error) {
    console.error('getUserStatsAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user statistics' 
    }
  }
}



export async function getCurrentUserActionProfile(): Promise<
  { success: true; data: User } | { success: false; error: string }
> {
  try {
    const data: UserProfileResponse = await makeAuthenticatedRequest("/api/me")
    return { success: true, data: data.user }
  } catch (error) {
    console.error("getCurrentUserAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch user profile",
    }
  }
}



export async function updateUserNameAction(
  formData: FormData,
): Promise<{ success: true; message: string; user: User } | { success: false; error: string }> {
  try {
    const name = formData.get("name") as string
    if (!name) {
      return { success: false, error: "Name is required." }
    }

    const data: UserProfileResponse = await makeAuthenticatedRequest("/api/me/profile", {
      method: "PUT",
      body: JSON.stringify({ name }),
    })

    revalidatePath("/dashboard/profile")
    return { success: true, message: data.message, user: data.user }
  } catch (error) {
    console.error("updateUserNameAction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}

// ✅ Reset Password Action
// ✅ Reset Password Action (Logged-in user changing password)
export async function resetPasswordAction(
  formData: FormData,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmNewPassword = formData.get("confirmNewPassword") as string

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return { success: false, error: "Please fill in all password fields." }
    }

    if (newPassword !== confirmNewPassword) {
      return { success: false, error: "The new password and confirmation password do not match." }
    }

    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." }
    }

    const data = await makeAuthenticatedRequest("/api/me/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    return { success: true, message: data.message || "Password updated successfully!" }
  } catch (error) {
    console.error("updateUserAvatarAction error:", error)
    const parsedError = parseError(error)

    return {
       success: false,
      error: parsedError.message,
    }
  }
}

// ✅ Update User Avatar Action
export async function updateUserAvatarAction(
  formData: FormData,
): Promise<{ success: true; message: string; user: User } | { success: false; error: string }> {
  try {
    const file = formData.get("avatar") as File
    if (!file || file.size === 0) {
      return { success: false, error: "Please select an image file to upload." }
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "The file is too large. Please choose an image smaller than 5MB." }
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Please upload a valid image file (JPEG, PNG, GIF, or WEBP)." }
    }

    const data: UserProfileResponse = await makeAuthenticatedRequest("/api/me/avatar", {
      method: "POST",
      body: formData,
    })

    revalidatePath("/dashboard/profile")
    return { success: true, message: data.message || "Profile picture updated successfully!", user: data.user }
  } catch (error) {
    console.error("updateUserAvatarAction error:", error)
    const parsedError = parseError(error)

    return {
      success: false,
      error: parsedError.message,
    }
  }
}
