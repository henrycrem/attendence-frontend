import { CreateRoleForm } from "@/components/roles/create-role-form"



export const dynamic = "force-dynamic"

export default function NewRolePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-gray-900">Add New Role</h1>
        </div>
        <CreateRoleForm />
      </div>
    </div>
  )
}
