export type Department = {
  id: string
  name: string
  description: string | null
  createdAt: string // Assuming ISO string
  updatedAt: string // Assuming ISO string
  userCount?: number // Optional, for display in list/details
  employeeCount?: number // Optional, for display in list/details
}

export type Pagination = {
  currentPage: number
  totalPages: number
  totalRecords: number
  hasNext: boolean
  hasPrev: boolean
}
