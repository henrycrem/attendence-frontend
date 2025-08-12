"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Building2, Eye, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { getAllDepartmentsAction, deleteDepartmentAction } from "@/actions/department"
import type { Department, Pagination } from "@/types/department"

export default function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null) // Track which department is being deleted

  // Filters and pagination
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNext: false,
    hasPrev: false,
  })

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getAllDepartmentsAction({
        page: currentPage,
        limit: 10,
        search: search.trim(),
      })
      if (response.success) {
        setDepartments(response.data)
        setPagination(
          response.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalRecords: response.data.length,
            hasNext: false,
            hasPrev: false,
          }
        )
      } else {
        setError(response.error)
      }
    } catch (err: any) {
      console.error("Failed to fetch departments:", err)
      setError(err.message || "Failed to load departments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [currentPage, search])

  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleDeleteDepartment = async (departmentId: string, departmentName: string) => {
    const previousDepartments = [...departments]
    const previousPagination = { ...pagination }

    // Optimistically remove from UI
    setDepartments(previousDepartments.filter(dep => dep.id !== departmentId))
    setPagination({
      ...previousPagination,
      totalRecords: previousPagination.totalRecords - 1,
    })

    // Show loader only for this row
    setDeletingId(departmentId)

    try {
      const result = await deleteDepartmentAction(departmentId)

      if (result.success) {
        toast.success(result.message || `Department '${departmentName}' deleted successfully!`)
      } else {
        // Revert on failure
        setDepartments(previousDepartments)
        setPagination(previousPagination)
        toast.error(result.error || `Failed to delete department '${departmentName}'.`)
      }
    } catch (err: any) {
      setDepartments(previousDepartments)
      setPagination(previousPagination)
      toast.error(err.message || `An unexpected error occurred while deleting '${departmentName}'.`)
    } finally {
      setDeletingId(null) // Stop loading
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDepartments}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
              <p className="text-gray-600">Manage and view company departments</p>
            </div>
          </div>
          <Link href="/dashboard/departments/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Department
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search departments by name or description..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Departments ({pagination.totalRecords})</span>
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? "Try adjusting your search criteria." : "No departments have been added yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Updated At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((department) => (
                        <TableRow key={department.id}>
                          <TableCell className="font-medium">{department.name}</TableCell>
                          <TableCell>{department.description || "N/A"}</TableCell>
                          <TableCell>{department.userCount ?? "N/A"}</TableCell>
                          <TableCell>{department.employeeCount ?? "N/A"}</TableCell>
                          <TableCell>{formatDate(department.createdAt)}</TableCell>
                          <TableCell>{formatDate(department.updatedAt)}</TableCell>
                          <TableCell className="flex gap-2">
                            <Link href={`/dashboard/departments/${department.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/dashboard/departments/edit/${department.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletingId === department.id}
                                >
                                  {deletingId === department.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-1" />
                                  )}
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the department{" "}
                                    <span className="font-semibold">{department.name}</span> and remove its data from
                                    our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteDepartment(department.id, department.name)}
                                  >
                                    Continue
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {(pagination.currentPage - 1) * 10 + 1} to{" "}
                      {Math.min(pagination.currentPage * 10, pagination.totalRecords)} of {pagination.totalRecords}{" "}
                      results
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        disabled={!pagination.hasPrev}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-gray-700">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={!pagination.hasNext}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}