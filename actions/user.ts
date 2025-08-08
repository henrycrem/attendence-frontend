'use server'

import { revalidatePath } from 'next/cache'

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL

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

// ✅ Make authenticated API request
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken()
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Telecel-Attendance-System/1.0',
      ...options.headers,
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
