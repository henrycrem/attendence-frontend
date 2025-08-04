"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Users, Shield, Settings, Calendar, FileText, Check, X, Save, Clock, User, Bell, UserCheck } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"

import { usePermissions, PERMISSIONS  } from "apps/user-ui/src/hooks/permissions"

// Dynamic interfaces for API data
interface DynamicPermission {
  id: number
  key: string
  name: string
  description?: string
  category_id: number
  is_active: boolean
}

interface DynamicPermissionCategory {
  id: number
  name: string
  description?: string
  icon: string
  sort_order: number
  is_active: boolean
  permissions: DynamicPermission[]
}

interface RoleTemplate {
  displayName: string
  roleName: string
  description: string
  permissions: string[]
}

const CreateRoleForm = () => {
  const { hasPermission } = usePermissions()

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    roleName: "",
    description: "",
    permissions: {} as Record<string, boolean>,
  })

  // Dynamic data state
  const [permissionCategories, setPermissionCategories] = useState<DynamicPermissionCategory[]>([])
  const [roleTemplates, setRoleTemplates] = useState<Record<string, RoleTemplate>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  // Icon mapping for dynamic categories
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      Users,
      Shield,
      Settings,
      Calendar,
      FileText,
      Clock,
      User,
      Bell,
      UserCheck,
    }
    return iconMap[iconName] || Users
  }

  // Fetch dynamic permissions and templates
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        setLoading(true)

        // Fetch permissions
        const permissionsResponse = await fetch("/api/permissions")
        if (!permissionsResponse.ok) throw new Error("Failed to fetch permissions")
        const permissionsData = await permissionsResponse.json()

        // Fetch role templates
        const templatesResponse = await fetch("/api/role-templates")
        if (!templatesResponse.ok) throw new Error("Failed to fetch role templates")
        const templatesData = await templatesResponse.json()

        setPermissionCategories(permissionsData.categories || [])
        setRoleTemplates(templatesData.templates || {})
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        console.error("Error fetching dynamic data:", err)

        // Fallback to static data if API fails
        setPermissionCategories([
          {
            id: 1,
            name: "Dashboard & Navigation",
            icon: "Users",
            sort_order: 1,
            is_active: true,
            permissions: [
              { id: 1, key: "view_dashboard", name: "View Dashboard", category_id: 1, is_active: true },
              { id: 2, key: "view_inbox", name: "View Inbox", category_id: 1, is_active: true },
            ],
          },
          {
            id: 2,
            name: "Employee Management",
            icon: "Users",
            description: "Admin/HR permissions for managing employees",
            sort_order: 2,
            is_active: true,
            permissions: [
              { id: 3, key: "view_employees", name: "View All Employees", category_id: 2, is_active: true },
              { id: 4, key: "create_employee", name: "Create Employee", category_id: 2, is_active: true },
              { id: 5, key: "update_employee", name: "Update Employee", category_id: 2, is_active: true },
              { id: 6, key: "delete_employee", name: "Delete Employee", category_id: 2, is_active: true },
            ],
          },
          // Add more fallback categories as needed
        ])

        setRoleTemplates({
          EMPLOYEE: {
            displayName: "Employee",
            roleName: "employee",
            description: "Standard employee with basic attendance access",
            permissions: ["view_dashboard", "create_attendance", "view_own_attendance"],
          },
          SUPERVISOR: {
            displayName: "Supervisor",
            roleName: "supervisor",
            description: "Team supervisor with approval permissions",
            permissions: ["view_dashboard", "view_employees", "approve_attendance"],
          },
          HR_MANAGER: {
            displayName: "HR Manager",
            roleName: "hr_manager",
            description: "HR manager with full employee management",
            permissions: ["view_dashboard", "view_employees", "create_employee", "manage_attendance"],
          },
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDynamicData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "displayName" && { roleName: value.toLowerCase().replace(/\s+/g, "_") }),
    }))
  }

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: checked,
      },
    }))
  }

  const handleCategoryToggle = (category: DynamicPermissionCategory, checked: boolean) => {
    const categoryPermissions: Record<string, boolean> = {}
    category.permissions.forEach((permission) => {
      categoryPermissions[permission.key] = checked
    })

    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        ...categoryPermissions,
      },
    }))
  }

  const handleTemplateSelect = (template: RoleTemplate) => {
    const templatePermissions: Record<string, boolean> = {}
    template.permissions.forEach((permission) => {
      templatePermissions[permission] = true
    })

    setFormData({
      displayName: template.displayName,
      roleName: template.roleName,
      description: template.description,
      permissions: templatePermissions,
    })

    toast.success(`${template.displayName} template applied!`, {
      duration: 3000,
      position: "top-right",
    })
  }

  const isCategoryFullySelected = (category: DynamicPermissionCategory) => {
    return category.permissions.every((permission) => formData.permissions[permission.key] === true)
  }

  const isPermissionSelected = (permissionKey: string) => {
    return formData.permissions[permissionKey] === true
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setMessage({ type: "", text: "" })

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-role`, formData, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      toast.success("Role created successfully!", {
        duration: 4000,
        position: "top-right",
      })

      setFormData({
        displayName: "",
        roleName: "",
        description: "",
        permissions: {},
      })
    } catch (error) {
      let errorMessage = "Failed to create role"
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-right",
      })
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      displayName: "",
      roleName: "",
      description: "",
      permissions: {},
    })
    setMessage({ type: "", text: "" })
  }

  // Permission check
  if (!hasPermission(PERMISSIONS.CREATE_ROLE)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have permission to create roles.</p>
          <div className="text-sm text-gray-500">
            <p>Required permission: create_role</p>
            <p>Contact your administrator for access.</p>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permissions and templates...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Dynamic Role Management</h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">
                Create and configure user roles with dynamic permissions for Telecel Liberia Attendance System
              </p>
            </div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-lg p-4 border border-slate-700/50">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-red-400">Note:</span> Permissions are loaded dynamically from the
              database. Add new permissions through the admin panel without code changes.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Dynamic Role Templates */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 sm:px-8 py-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <UserCheck className="w-6 h-6" />
                Dynamic Quick Start Templates
              </h2>
              <p className="text-blue-100 mt-2 text-sm sm:text-base">
                Use dynamically loaded role templates for common positions
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(roleTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left group hover:scale-105"
                  >
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600">{template.displayName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{template.permissions.length} permissions included</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Role Information Card */}
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden hover:shadow-red-500/30 group">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 sm:px-8 py-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <Users className="w-6 h-6" />
                Role Information
              </h2>
            </div>
            <div className="p-4 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-300">
                    Display Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="e.g., Employee, Supervisor, HR Manager"
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-slate-900/50 text-gray-200 text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-300">
                    Role Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="roleName"
                    value={formData.roleName}
                    onChange={handleInputChange}
                    placeholder="e.g., employee, supervisor, hr_manager"
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-slate-900/50 text-gray-200 text-base sm:text-lg"
                  />
                </div>
              </div>
              <div className="mt-6 sm:mt-8 space-y-3">
                <label className="block text-sm font-bold text-gray-300">Role Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the role's responsibilities in the attendance system..."
                  rows={4}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-slate-900/50 text-gray-200 resize-none text-base sm:text-lg"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Permissions Card */}
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden hover:shadow-red-500/30 group">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 sm:px-8 py-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <Shield className="w-6 h-6" />
                Dynamic Attendance System Permissions
              </h2>
              <p className="text-red-100 mt-2 text-sm sm:text-base">
                Select from dynamically loaded permissions - no code changes needed to add new ones!
              </p>
            </div>
            <div className="p-4 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {permissionCategories
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((category) => {
                    const IconComponent = getIconComponent(category.icon)
                    const isFullySelected = isCategoryFullySelected(category)
                    const hasSelectedPermissions = category.permissions.some((permission) =>
                      isPermissionSelected(permission.key),
                    )

                    return (
                      <div key={category.id} className="group/card">
                        <div
                          className={`border-2 rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-500/30 ${
                            isFullySelected
                              ? "border-red-500 bg-red-50/20 shadow-xl"
                              : hasSelectedPermissions
                                ? "border-red-400 bg-red-50/10 shadow-lg"
                                : "border-slate-700/50 bg-slate-900/50 hover:border-red-400"
                          }`}
                        >
                          {/* Category Header */}
                          <div className="flex items-center justify-between mb-4 sm:mb-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 sm:p-3 rounded-xl transition-all duration-200 ${
                                  isFullySelected
                                    ? "bg-red-600 shadow-lg"
                                    : hasSelectedPermissions
                                      ? "bg-red-500 shadow-lg"
                                      : "bg-slate-700"
                                }`}
                              >
                                <IconComponent className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-200 text-base sm:text-lg">{category.name}</h3>
                                {category.description && (
                                  <p className="text-xs text-gray-400 mt-1">{category.description}</p>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCategoryToggle(category, !isFullySelected)}
                              className={`w-6 sm:w-7 h-6 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                isFullySelected
                                  ? "bg-red-600 border-red-600 shadow-lg"
                                  : "border-slate-700 group-hover/card:border-red-400 group-hover/card:bg-red-50/20"
                              }`}
                            >
                              {isFullySelected && <Check className="w-4 h-4 text-white" />}
                            </button>
                          </div>

                          {/* Dynamic Permissions */}
                          <div className="space-y-2 sm:space-y-3">
                            {category.permissions
                              .filter((permission) => permission.is_active)
                              .map((permission) => (
                                <div
                                  key={permission.id}
                                  className="flex items-center gap-3 sm:gap-4 cursor-pointer group/item p-2 rounded-lg hover:bg-slate-700/50 transition-colors duration-200"
                                  onClick={() =>
                                    handlePermissionChange(permission.key, !isPermissionSelected(permission.key))
                                  }
                                >
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      checked={isPermissionSelected(permission.key)}
                                      onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                                      className="sr-only"
                                    />
                                    <div
                                      className={`w-5 sm:w-6 h-5 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                        isPermissionSelected(permission.key)
                                          ? "bg-red-600 border-red-600 shadow-md"
                                          : "border-slate-700 group-hover/item:border-red-400"
                                      }`}
                                    >
                                      {isPermissionSelected(permission.key) && (
                                        <Check className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-xs sm:text-sm font-semibold text-gray-300 group-hover/item:text-red-400">
                                      {permission.name}
                                    </span>
                                    {permission.description && (
                                      <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-700/50 hover:shadow-red-500/30">
            <div className="flex-1">
              {message.text && (
                <div
                  className={`inline-flex items-center gap-3 px-4 sm:px-6 py-3 rounded-xl text-sm font-bold shadow-lg ${
                    message.type === "success"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {message.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  {message.text}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-slate-700 text-gray-300 rounded-xl hover:bg-slate-700/50 hover:border-red-400 transition-all duration-200 font-bold text-base sm:text-lg"
              >
                Reset Form
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.displayName || !formData.roleName}
                className="px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-base sm:text-lg flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Role...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Create Dynamic Role
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateRoleForm
