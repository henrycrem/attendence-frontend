
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, MapPin, User, Building, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from "date-fns"
import type { Task } from '@/types/task'

interface TaskDetailsProps {
  task: Task
  onBack: () => void
}

export default function TaskDetails({ task, onBack }: TaskDetailsProps) {
  const [activeTab, setActiveTab] = useState("details")

  const getStatusBadge = (isCompleted: boolean, conversionAchieved: boolean) => {
    if (!isCompleted) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>
    }
    if (conversionAchieved) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Converted</Badge>
    }
    return <Badge variant="outline" className="bg-blue-100 text-blue-800">Completed</Badge>
  }

  const getTaskTypeBadge = (taskType: string) => {
    const colors = {
      CLIENT_VISIT: "bg-blue-100 text-blue-800",
      FOLLOW_UP: "bg-purple-100 text-purple-800",
      INSTALLATION: "bg-green-100 text-green-800",
      SURVEY: "bg-yellow-100 text-yellow-800",
      COMPLAINT: "bg-red-100 text-red-800",
      MAINTENANCE: "bg-orange-100 text-orange-800",
      CONSULTATION: "bg-indigo-100 text-indigo-800",
      RENEWAL: "bg-teal-100 text-teal-800",
      UPGRADE_CONSULTATION: "bg-cyan-100 text-cyan-800",
      TECHNICAL_SUPPORT: "bg-gray-100 text-gray-800",
      CUSTOMER_RETENTION: "bg-pink-100 text-pink-800",
    }
    
    const display = taskType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    const colorClass = colors[taskType as keyof typeof colors] || "bg-gray-100 text-gray-800"
    
    return <Badge className={colorClass}>{display}</Badge>
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleTimeString()
  }

  const LocationMap = ({ location, title, address }: { location: any, title: string, address?: string }) => {
    if (!location || !location.latitude || !location.longitude) {
      return (
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No location data available</p>
          {address && (
            <p className="text-sm text-gray-600 mt-2">{address}</p>
          )}
        </div>
      )
    }

    const { latitude, longitude } = location
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">{title}</h4>
        {address && (
          <p className="text-sm text-gray-600 mb-2">{address}</p>
        )}
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={mapUrl}
            width="100%"
            height="200"
            style={{ border: 0 }}
            loading="lazy"
            title={title}
          />
        </div>
        <div className="text-sm text-gray-600">
          <p>Latitude: {latitude.toFixed(6)}</p>
          <p>Longitude: {longitude.toFixed(6)}</p>
          {location.accuracy && <p>Accuracy: {location.accuracy}m</p>}
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number | null) => {
    if (value == null) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Tasks
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
              <p className="text-gray-600">View detailed task information</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(task.isCompleted, task.conversionAchieved)}
            {getTaskTypeBadge(task.taskType)}
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
              onClick={() => setActiveTab("location")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "location"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Location
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "notes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Notes & Attachments
            </button>
          </nav>
        </div>

        {activeTab === "details" && (
          <>
            {/* Assigned To */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Assigned To</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{task.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{task.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium">{task.user.position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="font-medium">{task.user.id.slice(0, 8)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            {task.client && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Client Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Client Name</p>
                      <p className="font-medium">{task.client.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{task.client.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{task.client.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Neighborhood</p>
                      <p className="font-medium">{task.client.neighborhood}</p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{task.client.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Task Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Task Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p className="font-medium">{formatDateTime(task.startTime)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p className="font-medium">{formatDateTime(task.endTime)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-500">Completed At</p>
                    <p className="font-medium">{formatDateTime(task.completedAt)}</p>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Title</p>
                    <p className="font-medium text-lg">{task.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Task Type</p>
                    {getTaskTypeBadge(task.taskType)}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Potential Revenue</p>
                    <p className="font-medium text-lg">{formatCurrency(task.potentialRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Actual Revenue</p>
                    <p className="font-medium text-lg">{formatCurrency(task.actualRevenue)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">Outcome</p>
                  <p className="font-medium">{task.outcome || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {task.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{task.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {task.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{task.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {task.attachments.map((attachment, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <a 
                            href={attachment} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            Attachment {index + 1}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === "location" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Task Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap 
                location={task.clientLocation} 
                title="Task Location" 
                address={task.address}
              />
              
              {/* Raw Location Data */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Raw Location Data</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {task.clientLocation ? JSON.stringify(task.clientLocation, null, 2) : 'No data available'}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "notes" && (
          <div className="space-y-6">
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {task.notes ? (
                  <p className="text-gray-700 whitespace-pre-line">{task.notes}</p>
                ) : (
                  <p className="text-gray-500">No notes available</p>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                {task.attachments && task.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {task.attachments.map((attachment, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <a 
                            href={attachment} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            Attachment {index + 1}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No attachments available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Add Paperclip icon
const Paperclip = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.2a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)