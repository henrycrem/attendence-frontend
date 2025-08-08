'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, MapPin, User, Building } from 'lucide-react'
import { getAttendanceDetails } from '@/actions/employee'
import Link from 'next/link'

interface AttendanceDetails {
  id: string
  date: string
  clockIn: string | null
  clockOut: string | null
  hoursWorked: string
  status: string
  workplace: string
  workplaceAddress: string
  signInLocation: any
  signOutLocation: any
  method: string
  employee: {
    id: string
    name: string
    email: string
    position: string
    department: string
  }
}

interface AttendanceDetailsProps {
  attendanceId: string
}

export default function AttendanceDetailsComponent({ attendanceId }: AttendanceDetailsProps) {
  const [attendance, setAttendance] = useState<AttendanceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttendanceDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getAttendanceDetails(attendanceId)
      setAttendance(response.data.attendance)
    } catch (err: any) {
      console.error('Failed to fetch attendance details:', err)
      setError(err.message || 'Failed to load attendance details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceDetails()
  }, [attendanceId])

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'incomplete':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Incomplete</Badge>
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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

  const LocationMap = ({ location, title }: { location: any, title: string }) => {
    if (!location || !location.latitude || !location.longitude) {
      return (
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No location data available</p>
        </div>
      )
    }

    const { latitude, longitude } = location
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">{title}</h4>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAttendanceDetails}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!attendance) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Attendance record not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/dashboard/employees/${attendance.employee.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Employee
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Details</h1>
              <p className="text-gray-600">View detailed attendance information</p>
            </div>
          </div>
        </div>

        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Employee Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{attendance.employee.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{attendance.employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{attendance.employee.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="font-medium">{attendance.employee.position}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Attendance Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(attendance.date)}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">Clock In</p>
                <p className="font-medium">{formatTime(attendance.clockIn)}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm text-gray-500">Clock Out</p>
                <p className="font-medium">{formatTime(attendance.clockOut)}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-500">Hours Worked</p>
                <p className="font-medium">{attendance.hoursWorked}</p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(attendance.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Method</p>
                  <Badge variant="outline">{attendance.method}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Workplace</p>
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{attendance.workplace}</span>
                </div>
                {attendance.workplaceAddress && (
                  <p className="text-sm text-gray-500 mt-1">{attendance.workplaceAddress}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <span>Clock In Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap location={attendance.signInLocation} title="Clock In Location" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <span>Clock Out Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap location={attendance.signOutLocation} title="Clock Out Location" />
            </CardContent>
          </Card>
        </div>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Raw Location Data</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sign In Location</h4>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {attendance.signInLocation ? JSON.stringify(attendance.signInLocation, null, 2) : 'No data available'}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sign Out Location</h4>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {attendance.signOutLocation ? JSON.stringify(attendance.signOutLocation, null, 2) : 'No data available'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
