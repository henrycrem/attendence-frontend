"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, MapPin, Calendar, FileText, Paperclip, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { Task } from "@/types/task";

interface TaskDetailsProps {
  task: Task;
  onBack: () => void;
}

export default function TaskDetails({ task, onBack }: TaskDetailsProps) {
  console.log("TaskDetails: task=", task);

   if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">No task data available</div>
      </div>
    );
  }


  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return "N/A";
      }
      return format(date, "PPP p");
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

  const formatDuration = (minutes: number | null) => {
    if (minutes == null) return "N/A";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  const getStatusDisplay = () => {
    if (task.isCompleted) return "Completed";
    if (task.outcome === "CANCELLED") return "Cancelled";
    return "Pending";
  };

  const initials = task.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "??";

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-2 px-6">
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-blue-500 transition-colors"
            >
              Tasks List
            </button>
            <span className="mx-2">/</span>
            <span className="text-blue-500">Task Details</span>
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
                  <h1 className="text-xl font-semibold text-gray-900">{task.title}</h1>
                  <Badge
                    variant={
                      task.isCompleted
                        ? "default"
                        : task.outcome === "CANCELLED"
                        ? "destructive"
                        : "secondary"
                    }
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      task.isCompleted
                        ? "bg-green-100 text-green-700 border-green-200"
                        : task.outcome === "CANCELLED"
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {getStatusDisplay().toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">ID:</span>
                    <span>#{task.id.slice(0, 8)}</span>
                  </span>
                  {task.client?.fullName && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{task.client.fullName}</span>
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
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Title</label>
                      <p className="text-sm text-gray-900">{task.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Type</label>
                      <p className="text-sm text-gray-900">
                        {task.taskType?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Status</label>
                      <p className="text-sm text-gray-900">{getStatusDisplay()}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Outcome</label>
                      <p className="text-sm text-gray-900">
                        {task.outcome?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Start Time</label>
                      <p className="text-sm text-gray-900">{formatDate(task.startTime)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">End Time</label>
                      <p className="text-sm text-gray-900">{formatDate(task.endTime)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Assigned To</label>
                      <p className="text-sm text-gray-900">{task.user?.name || "Unassigned"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Client</label>
                      <p className="text-sm text-gray-900">{task.client?.fullName || "None"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Address</label>
                      <p className="text-sm text-gray-900">{task.address || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Duration</label>
                      <p className="text-sm text-gray-900">{formatDuration(task.duration)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Potential Revenue</label>
                      <p className="text-sm text-gray-900">{formatCurrency(task.potentialRevenue)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Actual Revenue</label>
                      <p className="text-sm text-gray-900">{formatCurrency(task.actualRevenue)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Conversion Achieved</label>
                      <p className="text-sm text-gray-900">{task.conversionAchieved ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Created At</label>
                      <p className="text-sm text-gray-900">{formatDate(task.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Updated At</label>
                      <p className="text-sm text-gray-900">{formatDate(task.updatedAt)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-500 mb-1">Description</label>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{task.description || "No description"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Client
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <MapPin className="mr-2 h-4 w-4" />
                      Navigate to Location
                    </Button>
                  </div>
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
                    Add and view notes about this task, client feedback, or observations.
                    {task.notes && (
                      <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{task.notes}</p>
                    )}
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
                    Upload photos, documents, or files related to this task.
                    {task.attachments.length > 0 && (
                      <ul className="mt-2 text-sm text-gray-900">
                        {task.attachments.map((url, index) => (
                          <li key={index}>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              Attachment {index + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
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