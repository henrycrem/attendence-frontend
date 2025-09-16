"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Phone, Mail, MapPin, Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProspectiveClientActions } from "./action"; 
import type { ProspectiveClient } from "@/types/prospective-client";
import { format } from "date-fns";

export const createProspectiveClientColumns = (
  onViewClient: (id: string) => void,
  onEditClient?: (id: string) => void,
  onDeleteClient?: (id: string) => void,
  onShowLocation?: (id: string) => void
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
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Client ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return `${id.slice(0, 8)}`;
    },
  },
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fullName = row.getValue("fullName") as string;
      return <div className="font-medium">{fullName || "N/A"}</div>;
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return <div className="flex items-center">{phone || "N/A"}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return <div className="max-w-[150px] truncate">{email || "N/A"}</div>;
    },
  },
  {
    accessorKey: "serviceInterest",
    header: "Service Interest",
    cell: ({ row }) => {
      const serviceInterest = row.getValue("serviceInterest") as string;
      const display = serviceInterest
        ? serviceInterest.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        : "N/A";
      return <Badge variant="outline">{display}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const colors = {
        new: "bg-blue-100 text-blue-800",
        contacted: "bg-yellow-100 text-yellow-800",
        qualified: "bg-green-100 text-green-800",
        lost: "bg-red-100 text-red-800",
        converted: "bg-purple-100 text-purple-800",
      };
      const colorClass = colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
      return <Badge className={colorClass}>{status || "N/A"}</Badge>;
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <div className="flex items-center">
          <Star className="h-4 w-4 mr-1" />
          {priority || "N/A"}
        </div>
      );
    },
  },
  {
    accessorKey: "nextFollowUpDate",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Next Follow-Up
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const nextFollowUpDate = row.getValue("nextFollowUpDate") as string;
      if (!nextFollowUpDate) return "N/A";
      return format(new Date(nextFollowUpDate), "MMM d, yyyy");
    },
  },
  {
    accessorKey: "address",
    header: "Location",
    cell: ({ row }) => {
      const address = row.getValue("address") as string;
      return <div className="max-w-[200px] truncate">{address || "N/A"}</div>;
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
        onShowLocation={onShowLocation}
      />
    ),
  },
];