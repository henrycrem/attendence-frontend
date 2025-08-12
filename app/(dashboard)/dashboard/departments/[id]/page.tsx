import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDepartmentByIdAction } from "@/actions/department"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit, Users, Briefcase } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DepartmentDetailsPage({ params }: { params: { id: string } }) {
  const result = await getDepartmentByIdAction(params.id)

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{result.error || "Department not found."}</p>
            <Link href="/dashboard/departments">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Departments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const department = result.data

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-gray-900">Department Details</h1>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{department.name}</CardTitle>
            <CardDescription>Details for the department: {department.name}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <h3 className="font-semibold">Description:</h3>
              <p>{department.description || "No description provided."}</p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold">Users in Department:</h3>
              <p>{department.userCount ?? "N/A"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold">Employees in Department:</h3>
              <p>{department.employeeCount ?? "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold">Created At:</h3>
              <p>{formatDate(department.createdAt)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Updated At:</h3>
              <p>{formatDate(department.updatedAt)}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Link href={`/dashboard/departments/edit/${department.id}`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Department
                </Button>
              </Link>
              <Link href="/dashboard/departments">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
