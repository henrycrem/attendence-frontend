"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProspectiveClientsByUser } from "@/actions/tashdashboard";
import DataTable from "@/components/DataTableComponents/DataTable";
import { createProspectiveClientColumns } from "./prospective-client-columns";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

type Props = {
  onViewClient?: (id: string) => void;
};

export default function ProspectiveClientsTable({ onViewClient }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  console.log("ProspectiveClientsTable: userId=", user?.id);

  const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["prospective-clients", user?.id],
  queryFn: () => {
    if (!user?.id) throw new Error("User not authenticated");
    return getProspectiveClientsByUser(user.id, 1, 100);
  },
  enabled: !!user?.id,
  staleTime: 0,
  cacheTime: 0,
  refetchOnWindowFocus: true,
});

  console.log("ProspectiveClientsTable: Query data=", data);
  const clients = data?.success ? data.data?.clients || [] : []; 
  console.log("ProspectiveClientsTable: DataTable will receive=", clients);

  const columns = createProspectiveClientColumns(
    onViewClient || ((id) => console.log("View client:", id)),
    (id) => console.log("Edit client:", id),
    (id) => console.log("Delete client:", id)
  );

  const handleDelete = (rows: any[]) => {
    console.log("Deleting clients:", rows.map((row) => row.original.id));
    queryClient.invalidateQueries({ queryKey: ["prospective-clients", user?.id] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading your clients...</div>
      </div>
    );
  }

  if (error) {
    console.error("ProspectiveClientsTable: Error=", error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading your clients: {error.message}</div>
      </div>
    );
  }

  if (!clients.length) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 px-6">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 py-3 mb-3">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
            My Prospective Clients
          </h2>
          <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <Link href="/dashboard/prespective-client/new">
              <Button size="sm" className="w-full lg:w-auto bg-primary text-primary-foreground cursor-pointer">
                <Plus className="size-4 mr-2" />
                Add New Client
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>
        <div className="text-center text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg">No prospective clients found</div>
            <div className="text-sm text-gray-400">
              Try adding a new client or refreshing the list
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 px-6">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 py-3 mb-3">
        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
          My Prospective Clients
        </h2>
        <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
          <Link href="/dashboard/prespective-client/new">
            <Button size="sm" className="w-full lg:w-auto bg-primary text-primary-foreground cursor-pointer">
              <Plus className="size-4 mr-2" />
              Add New Client
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <div>
        <DataTable columns={columns} data={clients} onDelete={handleDelete} />
      </div>
    </div>
  );
}