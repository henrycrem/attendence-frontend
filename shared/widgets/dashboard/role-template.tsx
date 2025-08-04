"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Save, UserCheck, Shield } from "lucide-react"
import { usePermissions } from "apps/user-ui/src/hooks/permissions" 
import toast from "react-hot-toast"

interface RoleTemplate {
  displayName: string
  roleName: string
  description: string
  permissions: string[]
}

export default function RoleTemplateManagementPage() {
  const { hasPermission } = usePermissions()
  const [templates, setTemplates] = useState<Record<string, RoleTemplate>>({})
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    displayName: "",
    roleName: "",
    description: "",
    permissions: [] as string[],
  })

  useEffect(() => {
    if (hasPermission("manage_permissions")) {
      fetchTemplates()
    }
  }, [hasPermission])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/role-templates")
      if (!response.ok) throw new Error("Failed to fetch templates")

      const data = await response.json()
      setTemplates(data.templates || {})
    } catch (error) {
      toast.error("Failed to fetch role templates")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch("/api/role-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      })

      if (!response.ok) throw new Error("Failed to create template")

      toast.success("Role template created successfully!")
      setNewTemplate({ displayName: "", roleName: "", description: "", permissions: [] })
      setIsCreating(false)
      await fetchTemplates()
    } catch (error) {
      toast.error("Failed to create role template")
      console.error(error)
    }
  }

  if (!hasPermission("manage_permissions")) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage role templates.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading role templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Role Template Management</h1>
                <p className="text-gray-600 mt-2">Manage reusable role templates for quick role creation</p>
              </div>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Template
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(templates).map(([key, template]) => (
            <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{template.displayName}</h3>
                    <p className="text-sm text-gray-500">{template.roleName}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <div className="text-xs text-purple-600 font-medium">
                {template.permissions.length} permissions included
              </div>
            </div>
          ))}
        </div>

        {/* Create Template Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Create New Role Template</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.displayName}
                    onChange={(e) => setNewTemplate({ ...newTemplate, displayName: e.target.value })}
                    placeholder="e.g., Senior Manager"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={newTemplate.roleName}
                    onChange={(e) => setNewTemplate({ ...newTemplate, roleName: e.target.value })}
                    placeholder="e.g., senior_manager"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Describe this role template..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.displayName || !newTemplate.roleName}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Create Template
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
