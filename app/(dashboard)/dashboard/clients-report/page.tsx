"use client";

import { useState, useEffect } from "react";
import ProspectiveClientsTable from "../../../../components/admin-prospective-client/table";
import ProspectiveClientDetails from "../../../../components/admin-prospective-client/details";
import { useQuery } from "@tanstack/react-query";
import { getAdminProspectiveClientByIdAction } from "../../../../actions/dashboard";
import { useAuth } from "../../../../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function ProspectiveClientManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const { data: clientData, isLoading: isClientLoading, error: clientError } = useQuery({
    queryKey: ["prospectiveClient", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId || !user?.id) {
        console.log("No clientId or userId, returning null", { selectedClientId, userId: user?.id });
        return null;
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedClientId)) {
        console.error("Invalid clientId format:", selectedClientId);
        throw new Error("Invalid prospective client ID format");
      }
      const response = await getAdminProspectiveClientByIdAction(user.id, selectedClientId);
      console.log("Prospective client query response:", response);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch prospective client");
      }
      if (!response.data) {
        throw new Error("No prospective client data returned");
      }
      return response.data;
    },
    enabled: !!selectedClientId && !!user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedClientId || ""),
  });

  useEffect(() => {
    if (selectedClientId && clientData && !isClientLoading) {
      console.log("Setting selectedClient:", clientData);
      setSelectedClient(clientData);
    } else if (!clientData && !isClientLoading && selectedClientId) {
      console.log("No client data found for clientId:", selectedClientId);
      setSelectedClient(null);
    }
  }, [clientData, isClientLoading, selectedClientId]);

  const handleViewClient = (clientId: string) => {
    console.log("Viewing prospective client with ID:", clientId);
    if (!clientId) {
      console.error("handleViewClient: clientId is empty or undefined");
      return;
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
      console.error("handleViewClient: Invalid clientId format:", clientId);
      return;
    }
    setSelectedClientId(clientId);
    setSelectedClient(null);
  };

  const handleBackToList = () => {
    console.log("Returning to prospective client list");
    setSelectedClientId(null);
    setSelectedClient(null);
  };

  if (selectedClientId) {
    if (isClientLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading prospective client details...</div>
        </div>
      );
    }
    if (clientError) {
      console.error("Prospective client details error:", clientError);
      // Handle authentication error specifically
      if (clientError.message.includes("Unauthorized") || clientError.message.includes("401")) {
        router.push("/login"); // Redirect to login
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">
              Authentication failed. Redirecting to login...
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">
            Error loading prospective client details: {clientError.message}
            <button onClick={handleBackToList} className="text-blue-500 hover:underline ml-2">
              Back to list
            </button>
          </div>
        </div>
      );
    }
    if (selectedClient) {
      return <ProspectiveClientDetails client={selectedClient} onBack={handleBackToList} />;
    }
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">
          Prospective client not found.{" "}
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
        <h1 className="text-3xl font-bold">Prospective Clients Management</h1>
        <p className="text-muted-foreground">Manage your prospective clients and track progress</p>
      </div>
      <ProspectiveClientsTable onViewClient={handleViewClient} />
    </div>
  );
}