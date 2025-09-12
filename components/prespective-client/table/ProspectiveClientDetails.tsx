"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, MapPin, Calendar, FileText, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { ProspectiveClient } from "@/types/prospective-client";

interface ProspectiveClientDetailsProps {
  client: ProspectiveClient;
  onBack: () => void;
}

export default function ProspectiveClientDetails({ client, onBack }: ProspectiveClientDetailsProps) {
  console.log("ProspectiveClientDetails: client=", client); // Debug log

  const initials = client.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return "N/A";
      }
      return format(date, "PPP");
    } catch (error) {
      console.error("formatDate error:", error, "dateString:", dateString);
      return "N/A";
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-2 px-6">
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-blue-500 transition-colors"
            >
              Clients List
            </button>
            <span className="mx-2">/</span>
            <span className="text-blue-500">Client Details</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-semibold text-gray-900">{client.fullName}</h1>
                  <Badge
                    variant={client.status === "converted" ? "default" : "secondary"}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      client.status === "converted"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : client.status === "lost"
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {client.status?.replace(/_/g, " ").toUpperCase() || "NEW"}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">ID:</span>
                    <span>#{client.id.slice(0, 8)}</span>
                  </span>
                  {client.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details" className="space-y-0">
            <TabsList className="w-full h-auto p-0 bg-transparent rounded-none flex">
              <div className="w-full border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <TabsTrigger
                    value="details"
                    className="border-t-0 border-r-0 border-l-0 border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:text-blue-600 pb-3 px-0 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent shadow-none rounded-none"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="border-t-0 border-r-0 border-l-0 border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:text-blue-600 pb-3 px-0 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent shadow-none rounded-none"
                  >
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="border-t-0 border-r-0 border-l-0 border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:text-blue-600 pb-3 px-0 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent shadow-none rounded-none"
                  >
                    Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="attachments"
                    className="border-t-0 border-r-0 border-l-0 border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:text-blue-600 pb-3 px-0 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent shadow-none rounded-none"
                  >
                    Attachments
                  </TabsTrigger>
                </nav>
              </div>
            </TabsList>

            <TabsContent value="details" className="mt-0">
              <div className="p-6">
                {/* Client Information Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                      <p className="text-sm text-gray-900">{client.fullName}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Phone</label>
                      <p className="text-sm text-gray-900">{client.phone || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Email</label>
                      <p className="text-sm text-gray-900">{client.email || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Neighborhood</label>
                      <p className="text-sm text-gray-900">{client.neighborhood || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Address</label>
                      <p className="text-sm text-gray-900">{client.address || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Service Interest</label>
                      <p className="text-sm text-gray-900">
                        {client.serviceInterest
                          ? client.serviceInterest.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Priority</label>
                      <p className="text-sm text-gray-900">{client.priority || "MEDIUM"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Status</label>
                      <p className="text-sm text-gray-900">{client.status || "new"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Expected Revenue</label>
                      <p className="text-sm text-gray-900">{formatCurrency(client.expectedRevenue)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Created At</label>
                      <p className="text-sm text-gray-900">{formatDate(client.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Source</label>
                      <p className="text-sm text-gray-900">{client.source || "field_visit"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Follow-ups</label>
                      <p className="text-sm text-gray-900">{client.followUpCount || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Follow-up
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Client
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <MapPin className="mr-2 h-4 w-4" />
                      Visit Location
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="h-96 p-6">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-blue-50 rounded-full mb-4">
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tasks</h3>
                  <p className="text-gray-600 max-w-md">
                    Tasks related to this client will appear here. Create follow-ups, visits, or surveys.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Create Task
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="h-96 p-6">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-orange-50 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 max-w-md">
                    Add and view notes about client interactions, preferences, or special requirements.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attachments">
              <div className="h-96 p-6">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-purple-50 rounded-full mb-4">
                    <Paperclip className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Attachments</h3>
                  <p className="text-gray-600 max-w-md">
                    Upload site photos, signed documents, or other files related to this client.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}