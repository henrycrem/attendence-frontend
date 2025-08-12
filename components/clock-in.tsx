"use client"

import { useState, useEffect } from "react"
import { MapPin, Clock, CheckCircle, XCircle } from 'lucide-react'
import { checkIn, checkOut, getTodayAttendance } from "@/actions/attendence"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatTime, formatDate } from "@/lib/attendance-utils"
import { errorHandlers } from "@/errorHandler"
import { toast } from "sonner"

interface SimpleAttendanceClockProps {
  userId: string
  userName: string
  userEmail: string
}

export default function SimpleAttendanceClock({
  userId,
  userName,
  userEmail
}: SimpleAttendanceClockProps) {
  const [attendance, setAttendance] = useState<any>(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkOutLoading, setCheckOutLoading] = useState(false)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [hasCheckedOutToday, setHasCheckedOutToday] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'checking' | 'good' | 'poor' | 'failed'>('checking')

  // Fetch today's attendance
  useEffect(() => {
    async function fetchTodayAttendance() {
      try {
        const response = await getTodayAttendance(userId)
        setAttendance(response.data)
        setHasCheckedInToday(!!response.data?.signInTime)
        setHasCheckedOutToday(!!response.data?.signOutTime)
      } catch (err: any) {
        console.error("Failed to fetch attendance:", err)
        toast.error(err.message || "Failed to load attendance")
      }
    }
    fetchTodayAttendance()
  }, [userId])

  // ✅ Get GPS location — NO IP FALLBACK
  const getCurrentLocation = (): Promise<{ latitude: number, longitude: number, accuracy: number, method: 'gps' }> => {
    return new Promise((resolve, reject) => {
      setLocationStatus('checking')

      if (!navigator.geolocation) {
        setLocationStatus('failed')
        return reject(new Error("GPS not supported on this device"))
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          console.log("GPS obtained:", { latitude, longitude, accuracy })

          if (accuracy <= 500) {
            setLocationStatus('good')
          } else {
            setLocationStatus('poor')
            toast.warning(`GPS accuracy is ${Math.round(accuracy)}m. Move to an open area for better results.`)
          }

          resolve({ latitude, longitude, accuracy, method: 'gps' })
        },
        (error) => {
          setLocationStatus('failed')
          let message = "Unable to get your location."
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Please enable location permission to check in."
              break
            case error.POSITION_UNAVAILABLE:
              message = "Location unavailable. Try again in an open area."
              break
            case error.TIMEOUT:
              message = "Location request timed out. Please try again."
              break
            default:
              message = "Could not get GPS location. Please try again."
          }
          reject(new Error(message))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    })
  }

  const handleCheckIn = async () => {
    if (hasCheckedInToday) {
      toast.warning("You have already checked in today.")
      return
    }

    setCheckInLoading(true)
    try {
      const location = await getCurrentLocation()

      // Enforce GPS method and validate accuracy
      if (location.accuracy > 2000) {
        throw new Error("GPS accuracy is too poor (over 2km). Please move to an open area.")
      }

      await checkIn({
        userId,
        method: "gps",
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      })

      toast.success(`Checked in successfully (GPS accuracy: ${Math.round(location.accuracy)}m)`)
      setHasCheckedInToday(true)

      // Refresh data
      const updated = await getTodayAttendance(userId)
      setAttendance(updated.data)
    } catch (err: any) {
      console.error("Check-in failed:", err)
      toast.error(err.message || "Check-in failed. Please try again.")
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (hasCheckedOutToday) {
      toast.warning("You have already checked out today.")
      return
    }

    setCheckOutLoading(true)
    try {
      const location = await getCurrentLocation()

      if (location.accuracy > 2000) {
        throw new Error("GPS accuracy is too poor (over 2km). Please move to an open area.")
      }

      await checkOut({
        userId,
        method: "gps",
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      })

      toast.success(`Checked out successfully (GPS accuracy: ${Math.round(location.accuracy)}m)`)
      setHasCheckedOutToday(true)

      const updated = await getTodayAttendance(userId)
      setAttendance(updated.data)
    } catch (err: any) {
      console.error("Check-out failed:", err)
      toast.error(err.message || "Check-out failed. Please try again.")
    } finally {
      setCheckOutLoading(false)
    }
  }

  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case 'checking': return <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
      case 'good': return <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      case 'poor': return <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
      case 'failed': return <div className="w-2 h-2 bg-red-400 rounded-full"></div>
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    }
  }

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case 'checking': return 'Getting location...'
      case 'good': return 'GPS accurate'
      case 'poor': return 'Low GPS accuracy'
      case 'failed': return 'Location access denied'
      default: return 'Ready'
    }
  }

  return (
    <div className="min-h-screen bg-white/70 backdrop-blur-sm p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">Attendance Clock</h1>
          <p className="text-gray-600 text-lg">{formatDate()}</p>
        </div>

        <Card className="bg-white/80 border-gray-200 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{userName}</h2>
                <p className="text-gray-600">{userEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-gray-200 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center">
              <Clock className="mr-2 text-blue-500" size={20} />
              Today's Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Check-in</span>
                  {hasCheckedInToday ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <XCircle className="text-gray-400" size={20} />
                  )}
                </div>
                <p className="text-gray-800 text-xl font-semibold">
                  {hasCheckedInToday ? formatTime(attendance?.signInTime) : "--:--"}
                </p>
              </div>

              <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Check-out</span>
                  {hasCheckedOutToday ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <XCircle className="text-gray-400" size={20} />
                  )}
                </div>
                <p className="text-gray-800 text-xl font-semibold">
                  {hasCheckedOutToday ? formatTime(attendance?.signOutTime) : "--:--"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleCheckIn}
            disabled={hasCheckedInToday || checkInLoading}
            size="lg"
            className="h-20 text-xl font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white"
          >
            {checkInLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Clocking In...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <CheckCircle size={32} />
                <span>Clock In</span>
              </div>
            )}
          </Button>

          <Button
            onClick={handleCheckOut}
            disabled={hasCheckedOutToday || checkOutLoading}
            size="lg"
            className="h-20 text-xl font-semibold bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white"
          >
            {checkOutLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Clocking Out...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <XCircle size={32} />
                <span>Clock Out</span>
              </div>
            )}
          </Button>
        </div>

        <Card className="bg-white/80 border-gray-200 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-600 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{getLocationStatusText()}</span>
              </div>
              {getLocationStatusIcon()}
            </div>
            {locationStatus === 'poor' && (
              <p className="text-xs text-orange-600 mt-2">
                GPS accuracy is low. Move to an open area for better results.
              </p>
            )}
            {locationStatus === 'failed' && (
              <p className="text-xs text-red-600 mt-2">
                Enable location services to check in.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}