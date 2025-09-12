"use client";

import { useState } from "react";
import ProspectiveClientsTable from "./ProspectiveClientsTable";
import ProspectiveClientDetails from "./ProspectiveClientDetails";
import { useQuery } from "@tanstack/react-query";
import { getProspectiveClientByIdAction } from "@/actions/prospective-client";
import { useAuth } from "@/contexts/AuthContext";

export default function ProspectiveClientManagement() {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Fetch client details when selected
  const { data: clientData, isLoading: isClientLoading, error: clientError } = useQuery({
    queryKey: ["prospective-client", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId || !user?.id) {
        console.log("ProspectiveClientManagement: Skipping query - missing clientId or userId", {
          selectedClientId,
          userId: user?.id,
        });
        return null;
      }
      const response = await getProspectiveClientByIdAction(user.id, selectedClientId);
      console.log("ProspectiveClientManagement: Fetched client data=", response);
      if (response.success && response.data) {
        return response.data;
      }
      console.log("ProspectiveClientManagement: No client data found", response);
      return null;
    },
    enabled: !!selectedClientId && !!user?.id,
  });

  const handleViewClient = (clientId: string) => {
    console.log("ProspectiveClientManagement: Viewing clientId=", clientId);
    setSelectedClientId(clientId);
    setSelectedClient(null); // Reset to trigger loading
  };

  const handleBackToList = () => {
    console.log("ProspectiveClientManagement: Returning to client list");
    setSelectedClientId(null);
    setSelectedClient(null);
  };

  // Set client data when fetched
  if (selectedClientId && clientData && !selectedClient && !isClientLoading) {
    console.log("ProspectiveClientManagement: Setting selected client=", clientData);
    setSelectedClient(clientData);
  }

  // Render logic
  if (selectedClientId) {
    if (isClientLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading client details...</div>
        </div>
      );
    }
    if (clientError) {
      console.error("ProspectiveClientManagement: Error=", clientError);
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Error loading client details: {clientError.message}</div>
        </div>
      );
    }
    if (selectedClient) {
      return <ProspectiveClientDetails client={selectedClient} onBack={handleBackToList} />;
    }
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">
          Client not found.{" "}
          <button onClick={handleBackToList} className="text-blue-500 hover:underline">
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prospective Clients</h1>
        <p className="text-muted-foreground">Manage your sales pipeline and client engagements</p>
      </div>
      <ProspectiveClientsTable onViewClient={handleViewClient} />
    </div>
  );
}