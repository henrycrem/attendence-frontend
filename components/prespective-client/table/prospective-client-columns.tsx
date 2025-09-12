"use client"

import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ProspectiveClientActions } from "./action"
import type { ProspectiveClient } from "@/types/prospective-client" // ← You may need to create this type

export const createProspectiveClientColumns = (
  onViewClient: (id: string) => void,
  onEditClient?: (id: string) => void,
  onDeleteClient?: (id: string) => void
): ColumnDef<ProspectiveClient>[] => [
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
          Client ID
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
    accessorKey: "fullName",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("fullName") as string
      return <div className="font-medium">{name || "N/A"}</div>
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string
      return <div className="max-w-[150px] truncate">{phone || "N/A"}</div>
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string
      return <div className="max-w-[200px] truncate">{email || "N/A"}</div>
    },
  },
  {
    accessorKey: "neighborhood",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Neighborhood
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const neighborhood = row.getValue("neighborhood") as string
      return neighborhood || "N/A"
    },
  },
  {
    accessorKey: "serviceInterest",
    header: "Service",
    cell: ({ row }) => {
      const service = row.getValue("serviceInterest") as string
      const display = service ? service.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "N/A"
      return <Badge variant="outline">{display}</Badge>
    },
  },
  

  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => (
      <ProspectiveClientActions
        clientId={row.original.id}
        onView={onViewClient}
        onEdit={onEditClient}
        onDelete={onDeleteClient}
      />
    ),
  },
]