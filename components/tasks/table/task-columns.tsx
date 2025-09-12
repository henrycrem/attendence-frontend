"use client";

import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TaskActions } from "./TaskActions";
import type { Task } from "@/types/task";

export const createTaskColumns = (
  onViewTask: (id: string) => void,
  onEditTask?: (id: string) => void,
  onDeleteTask?: (id: string) => void
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
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Task ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return `${id.slice(0, 8)}`;
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return <div className="font-medium">{title || "Untitled Task"}</div>;
    },
  },
  {
    accessorKey: "taskType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("taskType") as string;
      const display = type ? type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "N/A";
      return <Badge variant="outline">{display}</Badge>;
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      // Since priority is not in schema, default to "MEDIUM" if not provided
      const priority = (row.getValue("priority") as string) || "MEDIUM";
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (priority === "HIGH" || priority === "URGENT") variant = "destructive";
      if (priority === "MEDIUM") variant = "default";
      if (priority === "LOW") variant = "secondary";
      return <Badge variant={variant}>{priority}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      // Derive status from isCompleted and outcome if status is not provided
      const status = (row.getValue("status") as string) || (row.original.isCompleted ? "completed" : row.original.outcome === "CANCELLED" ? "cancelled" : "pending");
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (status === "completed") variant = "default";
      if (status === "pending") variant = "secondary";
      if (status === "overdue" || status === "cancelled") variant = "destructive";
      return <Badge variant={variant}>{status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</Badge>;
    },
  },
  {
    accessorKey: "startTime",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Start Time
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const startTime = row.getValue("startTime") as string;
      return startTime ? new Date(startTime).toLocaleString() : "N/A";
    },
  },

  {
    accessorKey: "client.fullName",
    header: "Client",
    cell: ({ row }) => {
      const client = row.original.client;
      return client?.fullName || "Unassigned";
    },
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => (
      <TaskActions
        taskId={row.original.id}
        onView={() => {
          console.log("TaskActions: Viewing task with id =", row.original.id);
          onViewTask(row.original.id);
        }}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
      />
    ),
  },
];