'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import type { Role, Pagination } from '@/types/role' // Assuming types are in this path

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL

// ✅ Get access token from cookies
async function getAccessToken() {
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

// ✅ Create Role Server Action
export async function createRoleAction(formData: FormData) {
  try {
    const displayName = formData.get('displayName') as string
    const roleName = formData.get('roleName') as string
    const description = formData.get('description') as string | null

    if (!displayName || !roleName) {
      return { success: false, error: 'Display Name and Role Name are required.' }
    }

    const data = await makeAuthenticatedRequest('/api/create-role', {
      method: 'POST',
      body: JSON.stringify({ displayName, roleName, description }),
    })

    revalidatePath('/dashboard/users-role') // Revalidate the roles list page
    return { success: true, message: data.message, role: data.role }
  } catch (error) {
    
    console.error('createRoleAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create role',
    }
  }
}

// ✅ Get All Roles Server Action
export async function getAllRolesAction(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)

    const url = `/api/tableRoles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const data = await makeAuthenticatedRequest(url)

    // Assuming the API returns { roles: Role[], status: "success", pagination?: Pagination }
    return { success: true, data: data.roles, pagination: data.pagination }
  } catch (error) {
    console.error('getAllRolesAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch roles',
      data: [],
      pagination: { currentPage: 1, totalPages: 1, totalRecords: 0, hasNext: false, hasPrev: false }
    }
  }
}

// ✅ Get Role by ID Server Action
export async function getRoleByIdAction(roleId: string) {
  try {
    const data = await makeAuthenticatedRequest(`/api/roles/${roleId}`)
    return { success: true, data: data.role }
  } catch (error) {
    console.error('getRoleByIdAction error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch role',
      data: null
    }
  }
}

// ✅ Update Role Server Action
export async function updateRoleAction(roleId: string, formData: FormData) {
  try {
    const displayName = formData.get('displayName') as string
    const roleName = formData.get('roleName') as string
    const description = formData.get('description') as string | null

    const data = await makeAuthenticatedRequest(`/api/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify({ displayName, roleName, description }),
    })

    revalidatePath('/dashboard/users-role')
    revalidatePath(`/dashboard/users-role/edit/${roleId}`)
    revalidatePath(`/dashboard/users-role/${roleId}`) // If there's a view page
    return { success: true, message: data.message, role: data.role }
  } catch (error) {
    console.error('updateRoleAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role',
    }
  }
}

// ✅ Delete Role Server Action
export async function deleteRoleAction(roleId: string) {
  try {
    const data = await makeAuthenticatedRequest(`/api/roles/${roleId}`, {
      method: 'DELETE',
    })

    revalidatePath('/dashboard/users-role')
    return { success: true, message: data.message }
  } catch (error) {
    console.error('deleteRoleAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete role',
    }
  }
}