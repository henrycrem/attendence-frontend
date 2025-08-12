import { CreateDepartmentForm } from "@/components/departments/create-department-form"
import { Building2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default function NewDepartmentPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Add New Department</h1>
        </div>
        <CreateDepartmentForm />
      </div>
    </div>
  )
}
