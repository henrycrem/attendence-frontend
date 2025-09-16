
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar, Clock, MapPin, DollarSign } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { TaskActions } from "./TaskActions"
import type { Task } from "@/types/task"
import { format } from "date-fns"
import { Button } from "../ui/button"

export const createTaskColumns = (
  onViewTask: (id: string) => void,
  onEditTask?: (id: string) => void,
  onDeleteTask?: (id: string) => void,
  onShowLocation?: (id: string) => void
): ColumnDef<Task>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Task ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const id = row.getValue("id") as string
      return `${id.slice(0, 8)}`
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const title = row.getValue("title") as string
      return <div className="font-medium">{title || "N/A"}</div>
    },
  },
  {
    accessorKey: "taskType",
    header: "Type",
    cell: ({ row }) => {
      const taskType = row.getValue("taskType") as string
      const display = taskType ? taskType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "N/A"
      return <Badge variant="outline">{display}</Badge>
    },
  },
  {
    accessorKey: "client.fullName",
    header: "Client",
    cell: ({ row }) => {
      const client = row.original.client
      return <div className="max-w-[150px] truncate">{client?.fullName || "N/A"}</div>
    },
  },
  {
    accessorKey: "startTime",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Start Time
          <Calendar className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const startTime = row.getValue("startTime") as string
      if (!startTime) return "N/A"
      return format(new Date(startTime), "MMM d, yyyy HH:mm")
    },
  },
  {
    accessorKey: "completedAt",
    header: "Completed",
    cell: ({ row }) => {
      const completedAt = row.getValue("completedAt") as string | null
      const isCompleted = row.original.isCompleted
      
      if (!isCompleted) {
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      }
      
      if (!completedAt) return "N/A"
      return format(new Date(completedAt), "MMM d, yyyy HH:mm")
    },
  },
  {
    accessorKey: "conversionAchieved",
    header: "Conversion",
    cell: ({ row }) => {
      const conversionAchieved = row.getValue("conversionAchieved") as boolean
      return conversionAchieved ? (
        <Badge variant="default" className="bg-green-100 text-green-800">Converted</Badge>
      ) : (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">Not Converted</Badge>
      )
    },
  },
  {
    accessorKey: "actualRevenue",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Revenue
          <DollarSign className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const revenue = row.getValue("actualRevenue") as number | null
      if (revenue == null) return "N/A"
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(revenue)
    },
  },
  {
    accessorKey: "address",
    header: "Location",
    cell: ({ row }) => {
      const address = row.getValue("address") as string
      return <div className="max-w-[200px] truncate">{address || "N/A"}</div>
    },
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => (
      <TaskActions
        taskId={row.original.id}
        onView={onViewTask}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onShowLocation={onShowLocation}
      />
    ),
  },
]