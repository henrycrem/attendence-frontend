"use client"
import { useState, useEffect } from "react"
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Wifi, WifiOff } from 'lucide-react'
import { checkIn, checkOut, getTodayAttendance } from "@/actions/attendence"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatTime, formatDate } from "@/lib/attendance-utils"

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
  const [checkInLoading, setCheckInLoading] = useState(false) // ✅ Separate loading states
  const [checkOutLoading, setCheckOutLoading] = useState(false) // ✅ Separate loading states
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [hasCheckedOutToday, setHasCheckedOutToday] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'checking' | 'good' | 'poor' | 'failed'>('checking')
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('online')
  const [retryCount, setRetryCount] = useState(0)

  // Fetch today's attendance
  useEffect(() => {
    async function fetchTodayAttendance() {
      try {
        const response = await getTodayAttendance(userId)
        setAttendance(response.data)
        
        // Check what actions have been done today
        if (response.data) {
          setHasCheckedInToday(!!response.data.signInTime)
          setHasCheckedOutToday(!!response.data.signOutTime)
        } else {
          setHasCheckedInToday(false)
          setHasCheckedOutToday(false)
        }
      } catch (err: any) {
        console.error("Failed to fetch today's attendance:", err)
        setError(err.message)
      }
    }

    fetchTodayAttendance()
  }, [userId])

  // ✅ Enhanced location function with proper GPS quality check and IP fallback
const getCurrentLocation = (): Promise<{latitude: number, longitude: number, accuracy: number, method: 'gps' | 'ip'}> => {
  return new Promise(async (resolve, reject) => {
    setLocationStatus('checking')
  
    if (!navigator.geolocation) {
      console.log("GPS not supported, falling back to IP location")
      setLocationStatus('failed')
      try {
        // Directly get IP location if GPS not supported
        const ipLocation = await getIPLocationFallback()
        setLocationStatus('poor')
        resolve({
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
          accuracy: ipLocation.accuracy,
          method: 'ip'
        })
      } catch (ipError) {
        setLocationStatus('failed')
        reject(new Error("Location services unavailable. Please enable GPS or check your internet connection."))
      }
      return
    }

    // Try to get GPS location first
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const accuracy = position.coords.accuracy
        console.log("GPS Location obtained with accuracy:", accuracy)
      
        // ✅ Check GPS quality and decide whether to use it or fallback to IP
        if (accuracy <= 100) {
          setLocationStatus('good')
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: accuracy,
            method: 'gps'
          })
        } else if (accuracy <= 1000) {
          setLocationStatus('poor')
          console.log("GPS accuracy is poor but acceptable:", accuracy)
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: accuracy,
            method: 'gps'
          })
        } else {
          // ✅ GPS accuracy too poor, fallback to IP
          console.log("GPS accuracy too poor (", accuracy, "m), falling back to IP location")
          setLocationStatus('poor')
          try {
            const ipLocation = await getIPLocationFallback()
            resolve({
              latitude: ipLocation.latitude,
              longitude: ipLocation.longitude,
              accuracy: ipLocation.accuracy,
              method: 'ip'
            })
          } catch (ipError) {
            console.warn("IP location failed, using poor GPS as last resort")
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: accuracy,
              method: 'gps'
            })
          }
        }
      },
      async (error) => {
        console.error("GPS location failed:", error)
        setLocationStatus('failed')
      
        // ✅ GPS failed completely, fallback to IP location
        console.log("GPS failed, attempting IP location fallback")
        try {
          const ipLocation = await getIPLocationFallback()
          setLocationStatus('poor')
          resolve({
            latitude: ipLocation.latitude,
            longitude: ipLocation.longitude,
            accuracy: ipLocation.accuracy,
            method: 'ip'
          })
        } catch (ipError) {
          setLocationStatus('failed')
          let errorMessage = "Unable to determine your location. "
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Please allow location access in your browser settings."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location services are unavailable."
              break
            case error.TIMEOUT:
              errorMessage += "Location request timed out."
              break
            default:
              errorMessage += "Please check your GPS and internet connection."
              break
          }
          reject(new Error(errorMessage))
        }
      },
      { 
        enableHighAccuracy: true, // Try for best accuracy first
        timeout: 10000, // 10 second timeout
        maximumAge: 300000 // 5 minutes cache
      }
    )
  })
}

// ✅ Add IP location fallback function to frontend
const getIPLocationFallback = async () => {
  const services = [
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parser: (data: any) => ({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 1000 // IP location is approximate
      })
    },
    {
      name: 'ip-api.com', 
      url: 'http://ip-api.com/json/',
      parser: (data: any) => ({
        latitude: data.lat,
        longitude: data.lon,
        accuracy: 1000
      })
    }
  ]

  for (const service of services) {
    try {
      console.log(`Trying IP location service: ${service.name}`)
      const response = await fetch(service.url, { 
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (!response.ok) continue
      
      const data = await response.json()
      const result = service.parser(data)
      
      // Validate the result
      if (!result.latitude || !result.longitude || 
          Math.abs(result.latitude) > 90 || Math.abs(result.longitude) > 180) {
        continue
      }
      
      console.log(`Successfully got IP location from ${service.name}`)
      return result
    } catch (error) {
      console.warn(`${service.name} failed:`, error)
      continue
    }
  }
  
  throw new Error('All IP location services failed')
}

  // ✅ Enhanced check-in with retry feedback
  const handleCheckIn = async () => {
    if (hasCheckedInToday) {
      setError("You have already checked in today!")
      return
    }

    setCheckInLoading(true)
    setError(null)
    setSuccess(null)
    setRetryCount(0)
    setNetworkStatus('checking')

    try {
      // Get current location
      const location = await getCurrentLocation()
      
      const params = {
        userId,
        method: location.method,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      }

      const result = await checkIn(params)
      setSuccess(result.message)
      setHasCheckedInToday(true)
      setNetworkStatus('online')
      
      // Refresh attendance data
      setTimeout(async () => {
        const updatedAttendance = await getTodayAttendance(userId)
        setAttendance(updatedAttendance.data)
      }, 1000)

    } catch (err: any) {
      console.error("Check-in error:", err)
      setNetworkStatus('offline')
      
      // Provide more specific error messages
      if (err.message.includes('Connection') || err.message.includes('network')) {
        setError("Network connection failed. Please check your internet connection and try again.")
      } else if (err.message.includes('server')) {
        setError("Server is temporarily unavailable. Please try again in a few moments.")
      } else {
        setError(err.message)
      }
    } finally {
      setCheckInLoading(false)
      setLocationStatus('checking')
    }
  }

  // ✅ Enhanced check-out with better UX
  const handleCheckOut = async () => {
    if (hasCheckedOutToday) {
      setError("You have already checked out today!")
      return
    }

    setCheckOutLoading(true) // ✅ Only set check-out loading
    setError(null)
    setSuccess(null)

    try {
      // Get current location
      const location = await getCurrentLocation()
      
      const params = {
        userId,
        method: location.method,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      }

      const result = await checkOut(params)
      setSuccess(result.message)
      setHasCheckedOutToday(true)
      
      // Refresh attendance data
      setTimeout(async () => {
        const updatedAttendance = await getTodayAttendance(userId)
        setAttendance(updatedAttendance.data)
      }, 1000)

    } catch (err: any) {
      console.error("Check-out error:", err)
      setError(err.message)
    } finally {
      setCheckOutLoading(false) // ✅ Only reset check-out loading
      setLocationStatus('checking')
    }
  }

  // ✅ Location status indicator
  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case 'checking':
        return <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
      case 'good':
        return <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      case 'poor':
        return <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
      case 'failed':
        return <div className="w-2 h-2 bg-red-400 rounded-full"></div>
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    }
  }

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case 'checking':
        return 'Checking location...'
      case 'good':
        return 'GPS location accurate'
      case 'poor':
        return 'Using approximate location'
      case 'failed':
        return 'Location unavailable'
      default:
        return 'Location ready'
    }
  }

  return (
    <div className="min-h-screen bg-white/70 backdrop-blur-sm p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">Attendance Clock</h1>
          <p className="text-gray-600 text-lg">{formatDate()}</p>
        </div>

        {/* User Info Card */}
        <Card className="bg-white/80 border-gray-200 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {userName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800">{userName}</h2>
                <p className="text-gray-600">{userEmail}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-500">Online</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Status */}
        <Card className="bg-white/80 border-gray-200 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center">
              <Calendar className="mr-2 text-blue-500" size={20} />
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
                {attendance?.signInLocation?.address && (
                  <p className="text-gray-500 text-xs mt-1 truncate">
                    {attendance.signInLocation.address}
                  </p>
                )}
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
                {attendance?.signOutLocation?.address && (
                  <p className="text-gray-500 text-xs mt-1 truncate">
                    {attendance.signOutLocation.address}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleCheckIn}
            disabled={hasCheckedInToday || checkInLoading} // ✅ Only disable for check-in loading
            size="lg"
            className="h-20 text-xl font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white cursor-pointer"
          >
            {checkInLoading ? ( // ✅ Only show loading for check-in
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Clocking In...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <CheckCircle size={32} />
                <span>Clock In</span>
                {hasCheckedInToday && (
                  <span className="text-sm opacity-75">Already done today</span>
                )}
              </div>
            )}
          </Button>

          <Button
            onClick={handleCheckOut}
            disabled={hasCheckedOutToday || checkOutLoading} // ✅ Only disable for check-out loading
            size="lg"
            className="h-20 text-xl font-semibold bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white cursor-pointer"
          >
            {checkOutLoading ? ( // ✅ Only show loading for check-out
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Clocking Out...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <XCircle size={32} />
                <span>Clock Out</span>
                {hasCheckedOutToday && (
                  <span className="text-sm opacity-75">Already done today</span>
                )}
              </div>
            )}
          </Button>
        </div>

        {/* Status Messages */}
        {success && (
          <Alert className="bg-green-100/80 border-green-300 backdrop-blur-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-100/80 border-red-300 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {hasCheckedInToday && hasCheckedOutToday && (
          <Alert className="bg-green-100/80 border-green-300 backdrop-blur-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Attendance completed for today. Great work!
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ Enhanced Location Info with Network Status */}
        <Card className="bg-white/80 border-gray-200 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-gray-600 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{getLocationStatusText()}</span>
              </div>
              {getLocationStatusIcon()}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-600 text-sm">
                {networkStatus === 'online' ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Connected</span>
                  </>
                ) : networkStatus === 'offline' ? (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Connection issues</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-blue-600">Connecting...</span>
                  </>
                )}
              </div>
            </div>
            
            {locationStatus === 'poor' && (
              <p className="text-xs text-orange-600 mt-2">
                For better accuracy, try moving to an open area away from buildings.
              </p>
            )}
            {locationStatus === 'failed' && (
              <p className="text-xs text-blue-600 mt-2">
                Using approximate location based on your internet connection.
              </p>
            )}
            {networkStatus === 'offline' && (
              <p className="text-xs text-red-600 mt-2">
                Please check your internet connection and try again.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
