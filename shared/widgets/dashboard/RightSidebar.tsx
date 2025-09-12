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

interface RightSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function RightSidebar({ isCollapsed, onToggle }: RightSidebarProps) {
  // Mock data — replace with real data from API later
  const recentClockIns = [
    {
      id: 1,
      name: "James Wong",
      time: "09:45 AM",
      status: "Clocked In",
      avatar: "/portrait-of-james.png",
    },
    {
      id: 2,
      name: "Emily Watford",
      time: "09:00 AM",
      status: "Late",
      avatar: "/portrait-young-woman.png",
    },
    {
      id: 3,
      name: "Lina Garcia",
      time: "14:00 PM",
      status: "On Time",
      avatar: "/portrait-of-lina.png",
    },
  ]

  const pendingTasks = [
    {
      id: 1,
      title: "Submit Timesheet",
      due: "Today, 5 PM",
      priority: "High",
    },
    {
      id: 2,
      title: "Review Attendance",
      due: "Tomorrow",
      priority: "Medium",
    },
  ]

  const handleActionClick = (actionPath: string, itemId: number) => {
    console.log(`Action: ${actionPath} for item ${itemId}`)
    // Later: window.location.href = ...
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
          {/* Recent Clock-Ins */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Clock-Ins</h2>
              </div>
              <Link href="/dashboard/attendance/clock-in" className="cursor-pointer">
                <button className="p-1 cursor-pointer text-red-600 hover:bg-red-50 rounded">
                  <Plus className="h-4 w-4" />
                </button>
              </Link>
            </div>

            <div className="">
              {recentClockIns.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <img
                    src={record.avatar || "/placeholder.svg"}
                    alt={record.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{record.name}</p>
                    <p className="text-sm text-gray-500">
                      {record.time} • <span className={record.status === "Late" ? "text-red-500" : "text-green-500"}>{record.status}</span>
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
                        onClick={() => handleActionClick("/view-record", record.id)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                        View Record
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleActionClick("/edit-record", record.id)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-gray-500" />
                        Edit Record
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
            <Link href="/dashboard/attendance/my-records" className="cursor-pointer">
              <button className="w-full cursor-pointer mt-4 text-red-600 hover:text-red-700 font-medium text-sm">View All</button>
            </Link>
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          {/* Pending Tasks */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
              </div>
              <Link href="/dashboard/tasks/new" className="cursor-pointer">
                <button className="p-1 cursor-pointer text-red-600 hover:bg-red-50 rounded">
                  <Plus className="h-4 w-4" />
                </button>
              </Link>
            </div>

            <div className="">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Clipboard className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <span className="text-xs text-gray-500">{task.due}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.priority === "High" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <Link href="/dashboard/tasks" className="cursor-pointer">
                <button className="w-full cursor-pointer text-red-600 hover:text-red-700 font-medium text-sm">View All Tasks</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}