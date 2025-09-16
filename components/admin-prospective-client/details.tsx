"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Phone, Mail, MapPin, Star, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { ProspectiveClient } from "@/types/prospective-client";

interface ProspectiveClientDetailsProps {
  client: ProspectiveClient;
  onBack: () => void;
}

export default function ProspectiveClientDetails({ client, onBack }: ProspectiveClientDetailsProps) {
  const [activeTab, setActiveTab] = useState("details");

  const getStatusBadge = (status: string) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
      converted: "bg-purple-100 text-purple-800",
    };
    const colorClass = colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
    return <Badge className={colorClass}>{status || "N/A"}</Badge>;
  };

  const getServiceInterestBadge = (serviceInterest: string) => {
    const display = serviceInterest
      ? serviceInterest.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      : "N/A";
    return <Badge variant="outline">{display}</Badge>;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

 
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Clients
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Prospective Client Details</h1>
              <p className="text-gray-600">View detailed client information</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(client.status)}
            {getServiceInterestBadge(client.serviceInterest)}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Details
            </button>
           
            <button
              onClick={() => setActiveTab("notes")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "notes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Notes
            </button>
          </nav>
        </div>

        {activeTab === "details" && (
          <>
            {/* Creator Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Created By</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{client.creator.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{client.creator.email}</p>
                  </div>
                 
                 
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Client Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{client.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{client.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{client.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Neighborhood</p>
                    <p className="font-medium">{client.neighborhood || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Interest</p>
                    {getServiceInterestBadge(client.serviceInterest)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    {getStatusBadge(client.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Priority</p>
                    <p className="font-medium">{client.priority || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Next Follow-Up</p>
                    <p className="font-medium">{formatDateTime(client.nextFollowUpDate)}</p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{client.address || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Client Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="font-medium">{formatDateTime(client.createdAt)}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500">Expected Revenue</p>
                    <p className="font-medium">{formatCurrency(client.expectedRevenue)}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-500">Conversion Probability</p>
                    <p className="font-medium">{client.conversionProbability ? `${client.conversionProbability}%` : "N/A"}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Current Provider</p>
                    <p className="font-medium">{client.currentProvider || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Contract End Date</p>
                    <p className="font-medium">{formatDateTime(client.contractEndDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

       

        {activeTab === "notes" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {client.notes ? (
                  <p className="text-gray-700 whitespace-pre-line">{client.notes}</p>
                ) : (
                  <p className="text-gray-500">No notes available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}