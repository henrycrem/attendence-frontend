import EmployeeForm from "@/components/employee/employee-form"
import { getEmployeeById } from "@/actions/employee"
import { notFound } from "next/navigation"

interface EditEmployeePageProps {
  params: {
    id: string
  }
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { id } = params
  const result = await getEmployeeById(id)

  if (result.status === "error" || !result.data.employee) {
    notFound() // Or render an error message
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Employee</h1>
        <EmployeeForm employee={result.data.employee} />
      </div>
    </div>
  )
}
