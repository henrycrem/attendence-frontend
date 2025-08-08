'use server'

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

// ✅ Search employees by name (for super_admin)
export async function searchEmployeesAction(query: string) {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: { employees: [] } }
    }

    const accessToken = await getAccessToken()
    
    console.log('searchEmployeesAction: Searching for:', query.trim())
    
    const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query.trim())}&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Telecel-Attendance-System/1.0',
      },
    })

    console.log('searchEmployeesAction: Response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error('searchEmployeesAction: API Error:', errorData)
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('searchEmployeesAction: Success, found employees:', data.employees?.length || 0)
    
    return { success: true, data }
  } catch (error) {
    console.error('searchEmployeesAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search employees' 
    }
  }
}
