"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/DataTableComponents/DataTable";
import { createProspectiveClientColumns } from "./column"; 
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { getAdminAllProspectiveClientsAction } from "@/actions/dashboard";

type Props = {
  onViewClient?: (id: string) => void;
  onShowLocation?: (id: string) => void;
};

export default function ProspectiveClientsTable({ onViewClient, onShowLocation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["prospectiveClients", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      console.log("🔍 Fetching prospective clients for user:", user.id);
      console.log("🔍 User role:", user.role?.roleName);

      const response = await getAdminAllProspectiveClientsAction(user.id, user.role?.roleName || "", 1, 100);

      console.log("📊 API Response:", response);
      console.log("📊 Prospective clients data:", response?.data?.prospectiveClients);
      console.log("📊 Client count:", response?.data?.prospectiveClients?.length);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch prospective clients");
      }

      return response;
    },
    enabled: !!user?.id,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
  });

  const prospectiveClients = data?.success ? data.data?.prospectiveClients || [] : [];

  console.log("📋 Final prospective clients array:", prospectiveClients);
  console.log("📋 Client count:", prospectiveClients.length);

  const columns = createProspectiveClientColumns(
    (id) => {
      if (!id) {
        console.error("createProspectiveClientColumns: clientId is empty or undefined");
        return;
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        console.error("createProspectiveClientColumns: Invalid clientId format:", id);
        return;
      }
      console.log("createProspectiveClientColumns: Passing clientId to onViewClient:", id);
      onViewClient ? onViewClient(id) : setSelectedClientId(id);
    },
    (id) => console.log("Edit client:", id),
    (id) => console.log("Delete client:", id),
    onShowLocation || ((id) => console.log("Show location for client:", id))
  );

  const handleDelete = (rows: any[]) => {
    console.log("Deleting clients:", rows.map((row) => row.original.id));
    queryClient.invalidateQueries({ queryKey: ["prospectiveClients", user?.id] });
  };

  useEffect(() => {
    if (!isLoading && data) {
      console.log("✅ Data loaded successfully:", {
        success: data.success,
        clientCount: data.data?.prospectiveClients?.length || 0,
        hasClients: data.data?.prospectiveClients?.length > 0,
      });
    }
  }, [isLoading, data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading prospective clients...</div>
      </div>
    );
  }

  if (error) {
    console.error("ProspectiveClientsTable: Error=", error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading prospective clients: {error.message}</div>
      </div>
    );
  }

  if (!prospectiveClients.length) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 px-6">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 py-3 mb-3">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
            Prospective Clients
          </h2>
          <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <Link href="/dashboard/prospective-client/new">
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
          Prospective Clients ({prospectiveClients.length})
        </h2>
        <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
          <Link href="/dashboard/prospective-clients/new">
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
        <DataTable columns={columns} data={prospectiveClients} onDelete={handleDelete} />
      </div>
    </div>
  );
}