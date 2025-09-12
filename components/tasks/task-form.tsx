"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MapPin, AlertTriangle, Plus, DollarSign } from "lucide-react"; // 👈 Added DollarSign
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTaskAction } from "@/actions/task-actions";
import { getProspectiveClientsByUser } from "@/actions/tashdashboard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Select from "react-select";
import Link from "next/link";

interface ClientOption {
  value: string;
  label: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ✅ Added potentialRevenue to initial state
  const [formData, setFormData] = useState({
    title: "Client Follow-up",
    description: "",
    taskType: "FOLLOW_UP",
    priority: "MEDIUM",
    notes: "",
    clientId: "",
    address: "",
    potentialRevenue: "", // 👈 ADDED
  });

  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  } | null>(null);

  const [locationStatus, setLocationStatus] = useState<"idle" | "checking" | "good" | "poor" | "failed">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch prospective clients for the logged-in user
 const {
  data: clientsResponse, // ✅ RENAME: "data" is what useQuery returns → alias it as clientsResponse
  isLoading: clientsLoading,
  error: clientsError,
} = useQuery({
  queryKey: ["prospectiveClients", user?.id],
  queryFn: () => getProspectiveClientsByUser(user?.id, 1, 100),
  enabled: !!user?.id,
});

  const clients = clientsResponse?.success ? clientsResponse.data?.clients || [] : [];

  // Map clients to react-select options
  const clientOptions: ClientOption[] = clients.map((client: any) => ({
    value: client.id,
    label: `${client.fullName} (${client.neighborhood || "Unknown"})`,
  }));

  // Debug: Log client options to verify data
  useEffect(() => {
    console.log("Fetched Client Options:", clientOptions);
  }, [clientOptions]);

  // 🔄 Auto-fill potentialRevenue from selected client — SAFE VERSION
  // ✅ Depends on `clients` and `clientId`, NOT `clientOptions`
  useEffect(() => {
    if (!formData.clientId || !Array.isArray(clients) || clients.length === 0) {
      // Clear if no client selected or clients not ready
      if (formData.potentialRevenue !== "") {
        setFormData(prev => ({ ...prev, potentialRevenue: "" }));
      }
      return;
    }

    // Find client from raw `clients` array
    const selectedClient = clients.find((c: any) => c.id === formData.clientId);
    const newPotentialRevenue = selectedClient?.expectedRevenue != null
      ? selectedClient.expectedRevenue.toString()
      : "";

    // Only update if changed — prevents loops
    if (formData.potentialRevenue !== newPotentialRevenue) {
      setFormData(prev => ({
        ...prev,
        potentialRevenue: newPotentialRevenue,
      }));
    }
  }, [formData.clientId, clients]); // ✅ Safe dependencies

  // Get GPS location
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      setLocationStatus("checking");

      if (!navigator.geolocation) {
        setLocationStatus("failed");
        return reject(new Error("Location services not supported on this device"));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          if (accuracy > 2000) {
            setLocationStatus("poor");
            toast.warning(`Location accuracy is low (${Math.round(accuracy)}m). Move to an open area.`);
          } else {
            setLocationStatus("good");
          }

          setLocation({ latitude, longitude, accuracy });
          resolve({ latitude, longitude, accuracy });
        },
        (error) => {
          setLocationStatus("failed");
          let message = "Unable to get your location.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Please enable location permissions to create a task.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location unavailable. Try again in an open area.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out. Please try again.";
              break;
          }

          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  useEffect(() => {
    getCurrentLocation().catch(() => {
      // Location might be denied — user can retry manually
    });
  }, []);

  const handleRetryLocation = () => {
    getCurrentLocation().catch((err) => {
      toast.error(err.message);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Please enter the client's address");
      return;
    }

    if (!location || locationStatus === "failed") {
      toast.error("Please enable location and try again");
      return;
    }

    if (location.accuracy && location.accuracy > 2000) {
      toast.error("Location accuracy is too poor. Move to an open area and retry.");
      return;
    }

    // ✅ Parse potentialRevenue
    let potentialRevenue: number | null = null;
    if (formData.potentialRevenue.trim()) {
      const parsed = parseFloat(formData.potentialRevenue);
      if (isNaN(parsed)) {
        toast.error("Please enter a valid number for potential revenue");
        return;
      }
      potentialRevenue = parsed;
    }

    setIsSubmitting(true);

    try {
      const result = await createTaskAction({
        userId: user.id,
        ...formData,
        potentialRevenue, // 👈 Include in submission
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });

      if (result.success) {
        toast.success("Task created successfully!");
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        router.push("/dashboard");
      } else {
        toast.error(result.message || "Failed to create task");
      }
    } catch (error: any) {
      console.error("Task creation failed:", error);
      toast.error(error.message || "Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case "checking":
        return <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>;
      case "good":
        return <div className="w-3 h-3 bg-green-400 rounded-full"></div>;
      case "poor":
        return <div className="w-3 h-3 bg-orange-400 rounded-full"></div>;
      case "failed":
        return <div className="w-3 h-3 bg-red-400 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }
  };

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case "checking":
        return "Getting your location...";
      case "good":
        return `Location accurate (${Math.round(location?.accuracy || 0)}m)`;
      case "poor":
        return `Low accuracy (${Math.round(location?.accuracy || 0)}m)`;
      case "failed":
        return "Location access denied";
      default:
        return "Location not fetched";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Create New Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{getLocationStatusText()}</span>
              </div>
              {getLocationStatusIcon()}
            </div>
            {locationStatus === "poor" && (
              <p className="text-xs text-orange-600 mt-2">
                Move to an open area for better GPS accuracy.
              </p>
            )}
            {locationStatus === "failed" && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryLocation}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Retry Location
                </Button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Task Type</Label>
                <ShadSelect
                  value={formData.taskType}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, taskType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT_VISIT">Client Visit</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                    <SelectItem value="INSTALLATION">Installation</SelectItem>
                    <SelectItem value="SURVEY">Survey</SelectItem>
                    <SelectItem value="COMPLAINT">Complaint</SelectItem>
                  </SelectContent>
                </ShadSelect>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What is this task about?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <ShadSelect
                  value={formData.priority}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </ShadSelect>
              </div>

              <div className="space-y-2">
                <Label>Prospective Client</Label>
                {clientsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading clients...</span>
                  </div>
                ) : clientsError ? (
                  <p className="text-sm text-destructive">Failed to load clients</p>
                ) : (
                  <>
                    <Select
                      options={clientOptions}
                      value={clientOptions.find((option) => option.value === formData.clientId) || null}
                      onChange={(option) =>
                        setFormData((prev) => ({ ...prev, clientId: option?.value || "" }))
                      }
                      placeholder="Search for a client..."
                      isClearable
                      isSearchable
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#e2e8f0",
                          "&:hover": { borderColor: "#cbd5e1" },
                          minHeight: "40px",
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                      }}
                    />
                    {clientOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-2">
                        No clients found.{" "}
                        <Link
                          href="/dashboard/clients/new"
                          className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Create a new client
                        </Link>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        Client not found?{" "}
                        <Link
                          href="/dashboard/clients/new"
                          className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Create a new client
                        </Link>
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ✅ POTENTIAL REVENUE FIELD — Auto-filled from client */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Potential Revenue (USD)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 150.00"
                value={formData.potentialRevenue}
                onChange={(e) => setFormData((prev) => ({ ...prev, potentialRevenue: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Expected revenue from this task. Auto-filled from client if available.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Client Address *</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Enter complete address (e.g., '123 Main St, Sinkor, next to Grand Market')"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the exact address where you are performing this task.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes for this task"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !formData.address.trim() || locationStatus === "failed"}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Task...
                </>
              ) : (
                "Create Task with Current Location"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}