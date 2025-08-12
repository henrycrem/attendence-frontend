import type { Role } from "./role" // Assuming role type is defined
import type { Department } from "./department" // Assuming department type is defined

export type User = {
  id: string
  name: string
  email: string
  avatar: string | null
  roleId: string | null
  role?: Role // Include full role object
  departmentId: string | null
  department?: Department // Include full department object
  createdAt: string
  updatedAt: string
  position: string | null
  lastLogin?: string // From backend response
}

export type UserProfileResponse = {
  message: string
  user: User
  status: string
}
