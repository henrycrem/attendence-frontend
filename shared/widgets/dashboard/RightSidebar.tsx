"use client"

import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  UserCheck,
  Shield,
  Clipboard,
  Receipt,
  FolderOpen,
  Eye,
  MoreVertical,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getLastThreeTasks, getLastThreeClients } from "@/actions/dashboard"


interface RightSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  user?: {
    role?: {
      roleName?: string
    }
  } | null
}

interface Task {
  id: string
  title: string
  startTime: string
  user: {
    name: string
  }
  taskType: string
}

interface Client {
  id: string
  fullName: string
  createdAt: string
  creator: {
    name: string
  }
  status: string
}

export default function RightSidebar({ isCollapsed, onToggle, user }: RightSidebarProps) {
  // ✅ Only show for super_admin
  if (user?.role?.roleName !== "super_admin") {
    return null;
  }

  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSidebarData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [tasksResult, clientsResult] = await Promise.all([
        getLastThreeTasks(),
        getLastThreeClients()
      ])

      if (tasksResult.success) {
        setRecentTasks(tasksResult.data)
      } else {
        console.error("Failed to load tasks:", tasksResult.error)
      }

      if (clientsResult.success) {
        setRecentClients(clientsResult.data)
      } else {
        console.error("Failed to load clients:", clientsResult.error)
      }
    } catch (err) {
      setError("Failed to load sidebar data")
      console.error("Error loading sidebar data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSidebarData()
  }, [])

  const handleActionClick = (actionPath: string, itemId: string) => {
    console.log(`Action: ${actionPath} for item ${itemId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'converted':
      case 'completed':
        return 'text-green-500'
      case 'new':
      case 'pending':
        return 'text-blue-500'
      case 'cancelled':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case 'CLIENT_VISIT':
        return 'bg-blue-100 text-blue-800'
      case 'FOLLOW_UP':
        return 'bg-purple-100 text-purple-800'
      case 'INSTALLATION':
        return 'bg-green-100 text-green-800'
      case 'SURVEY':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {/* Collapsed state - floating button */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className="fixed top-1/2 right-4 -translate-y-1/2 z-50 p-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group"
        >
          <div className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4 text-gray-600 group-hover:text-red-600 transition-colors" />
            <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-red-600 transition-colors" />
          </div>
        </button>
      )}

      {/* Expanded sidebar */}
      <div
        className={`bg-white border-l border-gray-200 transition-all duration-300 ease-in-out relative h-screen ${
          isCollapsed ? "w-0 overflow-hidden" : "w-80"
        }`}
      >
        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        )}

        <div className="p-6 h-full flex flex-col overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-red-600 animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Failed to load data</span>
              </div>
              <button
                onClick={loadSidebarData}
                className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* Recent Tasks */}
          {!loading && !error && (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clipboard className="h-5 w-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
                  </div>
                 
                </div>

                {recentTasks.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 italic text-sm">
                    No recent tasks found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Clipboard className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTaskTypeColor(task.taskType)}`}>
                              {task.taskType.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 italic">
                            Assigned to {task.user?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(task.startTime).toLocaleDateString()}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 cursor-pointer rounded-full hover:bg-gray-200 transition-colors">
                              <MoreVertical className="h-4 w-4 font-extrabold text-red-800 cursor-pointer hover:text-red-900" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56" side="left" align="start">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleActionClick("/view-task", task.id)}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-gray-500" />
                              View Task
                            </DropdownMenuItem>
                           
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/sales-report" className="cursor-pointer">
                  <button className="w-full cursor-pointer mt-2 text-red-600 hover:text-red-700 font-medium text-xs">
                    View All Tasks
                  </button>
                </Link>
              </div>

              <div className="border-t border-gray-200 my-6"></div>

              {/* Recent Clients */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
                  </div>
                 
                </div>

                {recentClients.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 italic text-sm">
                    No recent clients found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900 text-sm">{client.fullName}</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                              {client.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 italic">
                            Created by {client.creator?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(client.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 cursor-pointer rounded-full hover:bg-gray-200 transition-colors">
                              <MoreVertical className="h-4 w-4 font-extrabold text-red-800 cursor-pointer hover:text-red-900" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56" side="left" align="start">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleActionClick("/view-client", client.id)}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-gray-500" />
                              View Client
                            </DropdownMenuItem>
                            
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/clients-report" className="cursor-pointer">
                  <button className="w-full cursor-pointer mt-2 text-red-600 hover:text-red-700 font-medium text-xs">
                    View All Clients
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}