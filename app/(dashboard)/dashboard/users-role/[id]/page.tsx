import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getRoleByIdAction } from "@/actions/role"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"


export const dynamic = "force-dynamic"

export default async function RoleDetailsPage({ params }: { params: { id: string } }) {
  const result = await getRoleByIdAction(params.id)

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{result.error || "Role not found."}</p>
            <Link href="/dashboard/users-role">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roles
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const role = result.data

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-gray-900">Role Details</h1>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{role.displayName}</CardTitle>
            <CardDescription>Details for the role: {role.roleName}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <h3 className="font-semibold">Role Name:</h3>
              <p>{role.roleName}</p>
            </div>
            <div>
              <h3 className="font-semibold">Description:</h3>
              <p>{role.description || "No description provided."}</p>
            </div>
            <div>
              <h3 className="font-semibold">Created At:</h3>
              <p>{formatDate(role.createdAt)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Updated At:</h3>
              <p>{formatDate(role.updatedAt)}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Link href={`/dashboard/users-role/edit/${role.id}`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Role
                </Button>
              </Link>
              <Link href="/dashboard/users-role">
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
