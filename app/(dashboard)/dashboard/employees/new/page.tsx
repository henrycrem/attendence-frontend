import EmployeeForm from "@/components/employee/employee-form"
import { getAllUsersAction } from "@/actions/user"

type UserOption = {
  id: string
  name: string
  email: string
  departmentName: string | null
}

export default async function CreateEmployeePage() {
  const usersResponse = await getAllUsersAction({ limit: 100 })
  if (!usersResponse.success) {
    console.error('Failed to fetch users:', usersResponse.error)
    return <div>Error loading users: {usersResponse.error}</div>
  }

  // Log to inspect the response structure
  console.log('usersResponse.data:', JSON.stringify(usersResponse.data, null, 2))

  // Extract the array from the response, handling common patterns
  const rawUsers = usersResponse.data.users || // Case 1: { users: [...] }
                  usersResponse.data.data ||  // Case 2: { data: [...] }
                  usersResponse.data.results || // Case 3: { results: [...] }
                  usersResponse.data || // Case 4: Direct array
                  []

  // Ensure it's an array and transform to UserOption[]
  const users: UserOption[] = Array.isArray(rawUsers)
    ? rawUsers.map((user: any) => ({
        id: user.id || user.userId || '', // Handle key variations
        name: user.name || 'Unknown',
        email: user.email || 'Unknown',
        departmentName: user.departmentName || user.department?.name || null,
      }))
    : []

  if (users.length === 0) {
    console.warn('No users found in API response')
  }

  return <EmployeeForm users={users} />
}