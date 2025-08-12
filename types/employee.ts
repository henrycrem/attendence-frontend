export interface Employee {
  id: string
  employeeId: string
  name: string
  email: string
  department: string
  role: string
  position: string
  totalAttendance: number
  lastOnlineStatus: string
  lastStatusUpdate: string | null
  hireDate: string | null
  createdAt: string
}

export interface Department {
  id: string
  name: string
  employeeCount: number
}

export interface Role {
  id: string
  displayName: string
  roleName: string
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalRecords: number
  hasNext: boolean
  hasPrev: boolean
}

export interface EmployeeFormData {
  name: string
  email: string
  password?: string // Optional for update
  position: string
  departmentId: string
  roleId: string
  hireDate?: Date | null
}
