// ✅ Attendance utility functions (not server actions)

interface Attendance {
  id: string
  userId: string
  date: string
  status: string
  signInTime?: string
  signInLocation?: { 
    latitude: number
    longitude: number
    address?: string
    method?: string
    accuracy?: number
    timestamp: string
    validation?: any
  }
  signOutTime?: string
  signOutLocation?: { 
    latitude: number
    longitude: number
    address?: string
    method?: string
    accuracy?: number
    timestamp: string
    validation?: any
  }
  workplace?: { id: string; name: string; latitude: number; longitude: number }
  method?: string
  updatedAt: string
  locationDetails?: {
    address: string
    coordinates: { latitude: number; longitude: number }
    method: string
    accuracy?: number
  }
}

// ✅ Helper function to validate location accuracy
export function validateLocationAccuracy(accuracy?: number): boolean {
  if (!accuracy) return true // If no accuracy provided, assume it's valid
  return accuracy <= 100 // Accept locations with accuracy better than 100 meters
}

// ✅ Helper function to format location for display
export function formatLocationDisplay(location?: {
  latitude: number
  longitude: number
  address?: string
  method?: string
  accuracy?: number
}): string {
  if (!location) return "Location not available"
  
  if (location.address) {
    return location.address
  }
  
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
}

// ✅ Helper function to calculate work duration
export function calculateWorkDuration(signInTime?: string, signOutTime?: string): {
  hours: number
  minutes: number
  totalMinutes: number
  formatted: string
} {
  if (!signInTime || !signOutTime) {
    return { hours: 0, minutes: 0, totalMinutes: 0, formatted: "0h 0m" }
  }
  
  const start = new Date(signInTime)
  const end = new Date(signOutTime)
  const diffMs = end.getTime() - start.getTime()
  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  return {
    hours,
    minutes,
    totalMinutes,
    formatted: `${hours}h ${minutes}m`
  }
}

// ✅ Helper function to get attendance status
export function getAttendanceStatus(attendance?: Attendance | null): {
  canCheckIn: boolean
  canCheckOut: boolean
  isCompleted: boolean
  status: string
} {
  if (!attendance) {
    return { 
      canCheckIn: true, 
      canCheckOut: false, 
      isCompleted: false, 
      status: "Not Started" 
    }
  }
  
  if (attendance.status === "SIGNED_IN") {
    return { 
      canCheckIn: false, 
      canCheckOut: true, 
      isCompleted: false, 
      status: "Checked In" 
    }
  }
  
  if (attendance.status === "SIGNED_OUT") {
    return { 
      canCheckIn: false, 
      canCheckOut: false, 
      isCompleted: true, 
      status: "Completed" 
    }
  }
  
  return { 
    canCheckIn: true, 
    canCheckOut: false, 
    isCompleted: false, 
    status: "Not Started" 
  }
}

// ✅ Helper function to format time display
export function formatTime(dateString?: string): string {
  if (!dateString) return "--:--"
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ✅ Helper function to format date display
export function formatDate(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date()
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// ✅ Helper function to calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c * 1000 // Return distance in meters
}

// ✅ Helper function to get location method display name
export function getMethodDisplayName(method?: string): string {
  switch (method) {
    case 'gps':
      return 'GPS Location'
    case 'ip':
      return 'IP Location'
    case 'manual':
      return 'Manual Selection'
    case 'qr':
      return 'QR Code'
    default:
      return 'Unknown Method'
  }
}

// ✅ Helper function to get status badge color
export function getStatusBadgeColor(status?: string): string {
  switch (status) {
    case 'SIGNED_IN':
      return 'bg-blue-600'
    case 'SIGNED_OUT':
      return 'bg-green-600'
    default:
      return 'bg-gray-600'
  }
}

// ✅ Helper function to validate coordinates
export function validateCoordinates(latitude?: number, longitude?: number): boolean {
  if (latitude === undefined || longitude === undefined) return false
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}
