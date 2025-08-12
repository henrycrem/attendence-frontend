// app/actions/user-registration-action.ts
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

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
    // Ensure credentials are not lost if needed
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// 🔐 Server Action: Register a new user (only callable from server or server actions)
export async function registerUser(formData: FormData) {
  try {
    const rawFormData = {
      name: formData.get('name'),
      email: formData.get('email'),
      roleId: formData.get('roleId'),
      departmentId: formData.get('departmentId'),
      position: formData.get('position'),
    }

    // Validate required fields
    if (!rawFormData.name || !rawFormData.email || !rawFormData.roleId) {
      return {
        success: false,
        message: 'Name, email, and role ID are required.',
      }
    }

    // Forward request to backend API
    const result = await makeAuthenticatedRequest('/api/user-registration', {
      method: 'POST',
      body: JSON.stringify(rawFormData),
    })

    // Optionally revalidate cached data (e.g., user list)
    revalidatePath('/dashboard') // or wherever needed

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('Server Action Error - registerUser:', error.message)
    return {
      success: false,
      message: error.message || 'Failed to register user. Please try again.',
    }
  }
}