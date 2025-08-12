import { EditRoleForm } from "@/components/roles/edit-role-form"


export const dynamic = "force-dynamic"

export default function EditRolePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-gray-900">Edit Role</h1>
        </div>
        <EditRoleForm roleId={params.id} />
      </div>
    </div>
  )
}
