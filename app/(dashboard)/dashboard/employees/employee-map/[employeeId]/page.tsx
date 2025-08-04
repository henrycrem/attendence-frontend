"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, useParams } from "next/navigation"
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, Circle } from "react-leaflet"
import L, { type LatLngTuple } from "leaflet"
import {
  MapPin,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  User,
  Clock,
  Wifi,
  WifiOff,
  ZoomIn,
  ZoomOut,
  Navigation,
  Layers,
  Settings,
  Target,
  Activity,
  MapIcon,
  Maximize2,
  Signal,
  Crosshair,
} from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import { getEmployeeDetails, getUserIdFromEmployeeId } from "@/actions/attendence"
import { GPSAccuracyOptimizer } from "@/components/gps-accuracy-optimizer" 

// Enhanced Employee's current location icon with pulsing effect
const currentLocationIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiNEQzI2MjYiIHN0cm9rZT0iI0Y5MjIyNiIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjgiIGZpbGw9IiNGRkZGRkYiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iNCIgZmlsbD0iI0RDMjYyNiIvPgo8L3N2Zz4=",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
})

// Enhanced movement history icon
const historyIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iOCIgZmlsbD0iIzkzMzNkYyIgc3Ryb2tlPSIjNzYyOWM2IiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iNCIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4=",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
})

// Enhanced user location icon
const userLocationIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiMwMDg4RkYiIHN0cm9rZT0iIzAwNzNFNiIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjgiIGZpbGw9IiNGRkZGRkYiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iNCIgZmlsbD0iIzAwODhGRiIvPgo8L3N2Zz4=",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
})

interface Employee {
  id: string
  name: string
  email: string
  position: string
  department: string | null
  isOnline: boolean
  lastSeen: string | null
  lastLocation?: { latitude: number; longitude: number; timestamp: string; address?: string }
}

interface LocationData {
  latitude: number
  longitude: number
  timestamp: string
  accuracy?: number
  address?: string
  source?: string
  qualityScore?: number
}

interface EnhancedLocationData {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: number
  source: "gps" | "network" | "passive"
}

// Enhanced Accuracy Indicator Component
const AccuracyIndicator = ({ accuracy, qualityScore }: { accuracy?: number; qualityScore?: number }) => {
  if (!accuracy) return null

  const getAccuracyColor = (acc: number) => {
    if (acc <= 5) return "text-green-500"
    if (acc <= 10) return "text-green-400"
    if (acc <= 20) return "text-yellow-400"
    if (acc <= 50) return "text-orange-400"
    return "text-red-400"
  }

  const getAccuracyLabel = (acc: number) => {
    if (acc <= 5) return "Excellent"
    if (acc <= 10) return "Very Good"
    if (acc <= 20) return "Good"
    if (acc <= 50) return "Fair"
    return "Poor"
  }

  const getBgColor = (acc: number) => {
    if (acc <= 5) return "bg-green-500"
    if (acc <= 10) return "bg-green-400"
    if (acc <= 20) return "bg-yellow-400"
    if (acc <= 50) return "bg-orange-400"
    return "bg-red-400"
  }

  return (
    <div className="flex items-center space-x-3 bg-slate-800 rounded-lg px-4 py-2 border border-slate-600">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${getBgColor(accuracy)} animate-pulse`}></div>
        <Signal className={`${getAccuracyColor(accuracy)}`} size={16} />
      </div>
      <div>
        <span className={`text-sm font-medium ${getAccuracyColor(accuracy)}`}>±{accuracy.toFixed(1)}m</span>
        <div className="text-xs text-gray-400">
          {getAccuracyLabel(accuracy)} {qualityScore && `(${qualityScore}/100)`}
        </div>
      </div>
    </div>
  )
}

// Enhanced Location Status Component
const LocationStatus = ({
  isTracking,
  lastUpdate,
  accuracy,
  source,
}: {
  isTracking: boolean
  lastUpdate?: string
  accuracy?: number
  source?: string
}) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center">
          <Crosshair className="mr-2 text-blue-400" size={20} />
          Location Status
        </h3>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isTracking ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {isTracking ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Source:</span>
          <span className="text-white capitalize">{source || "Unknown"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Accuracy:</span>
          <span className="text-white">{accuracy ? `±${accuracy.toFixed(1)}m` : "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Last Update:</span>
          <span className="text-white">{lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : "Never"}</span>
        </div>
      </div>
    </div>
  )
}

// Enhanced Map Controls Component
const MapControls = ({
  onZoomIn,
  onZoomOut,
  onCenterEmployee,
  onCenterUser,
  onToggleFullscreen,
  isFullscreen,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onCenterEmployee: () => void
  onCenterUser: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
}) => {
  const map = useMap()

  useEffect(() => {
    const scaleControl = L.control
      .scale({
        metric: true,
        imperial: true,
        position: "bottomleft",
      })
      .addTo(map)

    return () => {
      scaleControl.remove()
    }
  }, [map])

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex flex-col gap-1">
        <button onClick={onZoomIn} className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Zoom In">
          <ZoomIn size={18} className="text-gray-700" />
        </button>
        <button onClick={onZoomOut} className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Zoom Out">
          <ZoomOut size={18} className="text-gray-700" />
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex flex-col gap-1">
        <button
          onClick={onCenterEmployee}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Center on Employee"
        >
          <Target size={18} className="text-red-600" />
        </button>
        <button
          onClick={onCenterUser}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Center on Your Location"
        >
          <Navigation size={18} className="text-blue-600" />
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
        <button
          onClick={onToggleFullscreen}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          <Maximize2 size={18} className="text-gray-700" />
        </button>
      </div>
    </div>
  )
}

// Map Layer Selector Component
const LayerSelector = ({
  currentLayer,
  onLayerChange,
}: {
  currentLayer: string
  onLayerChange: (layer: string) => void
}) => {
  const layers = [
    { id: "street", name: "Street", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
    {
      id: "satellite",
      name: "Satellite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    },
    { id: "terrain", name: "Terrain", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" },
    { id: "dark", name: "Dark", url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" },
  ]

  return (
    <div className="absolute top-4 left-4 z-[1000]">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={16} className="text-gray-700" />
          <span className="text-sm font-medium text-gray-700">Map Style</span>
        </div>
        <div className="flex flex-col gap-1">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentLayer === layer.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {layer.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Enhanced Location Hook with better stability and accuracy
const useEnhancedLocation = () => {
  const [location, setLocation] = useState<EnhancedLocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const lastLocationRef = useRef<EnhancedLocationData | null>(null)
  const lastToastRef = useRef<number>(0)
  const initializationRef = useRef<boolean>(false) // Prevent multiple initializations

  const validateLocation = useCallback((coords: GeolocationCoordinates): boolean => {
    // Check if coordinates are valid
    if (Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) {
      console.log("Invalid coordinates:", coords.latitude, coords.longitude)
      return false
    }

    // Reject readings with very poor accuracy (stricter threshold)
    if (coords.accuracy > 50) {
      // Reduced from 100m to 50m
      console.log(`Location rejected: accuracy ${coords.accuracy}m > 50m`)
      return false
    }

    // Check for impossible speed (if we have previous location)
    if (lastLocationRef.current && coords.speed !== null && coords.speed > 0) {
      const timeDiff = (Date.now() - lastLocationRef.current.timestamp) / 1000
      const maxReasonableSpeed = 33.33 // 120 km/h in m/s (more realistic)

      if (coords.speed > maxReasonableSpeed) {
        console.log(`Location rejected: impossible speed ${coords.speed}m/s`)
        return false
      }
    }

    return true
  }, [])

  const processLocation = useCallback(
    (position: GeolocationPosition) => {
      const { coords } = position

      if (!validateLocation(coords)) {
        return
      }

      const locationData: EnhancedLocationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude || undefined,
        altitudeAccuracy: coords.altitudeAccuracy || undefined,
        heading: coords.heading || undefined,
        speed: coords.speed || undefined,
        timestamp: position.timestamp,
        source: coords.accuracy <= 10 ? "gps" : coords.accuracy <= 50 ? "network" : "passive",
      }

      // Only update if this location is significantly better, newer, or first location
      const shouldUpdate =
        !lastLocationRef.current ||
        coords.accuracy < lastLocationRef.current.accuracy * 0.8 || // 20% better accuracy
        position.timestamp - lastLocationRef.current.timestamp > 10000 // 10 seconds newer

      if (shouldUpdate) {
        setLocation(locationData)
        lastLocationRef.current = locationData
        setError(null)

        console.log(`Enhanced location updated: accuracy ${coords.accuracy}m, source: ${locationData.source}`)

        // Throttle toast notifications (max 1 per 15 seconds)
        const now = Date.now()
        if (now - lastToastRef.current > 15000) {
          if (coords.accuracy <= 10) {
            toast.success(`High accuracy location: ±${coords.accuracy.toFixed(1)}m`, {
              duration: 3000,
              id: "location-update-high",
            })
          } else if (coords.accuracy <= 30) {
            toast.success(`Good accuracy location: ±${coords.accuracy.toFixed(1)}m`, {
              duration: 3000,
              id: "location-update-good",
            })
          } else {
            toast(`Location updated: ±${coords.accuracy.toFixed(1)}m`, {
              duration: 2000,
              id: "location-update-fair",
            })
          }
          lastToastRef.current = now
        }
      }
    },
    [validateLocation],
  )

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = "Location error: "
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage += "Location access denied by user"
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage += "Location information unavailable"
        break
      case error.TIMEOUT:
        errorMessage += "Location request timed out"
        break
      default:
        errorMessage += "Unknown location error"
        break
    }
    setError(errorMessage)
    console.error(errorMessage, error)

    // Only show error toast once per session
    const now = Date.now()
    if (now - lastToastRef.current > 30000) {
      // Max 1 error toast per 30 seconds
      toast.error(errorMessage, { id: "location-error", duration: 5000 })
      lastToastRef.current = now
    }
  }, [])

  const startTracking = useCallback(() => {
    // Prevent multiple initializations
    if (initializationRef.current || isTracking) {
      console.log("Location tracking already initialized or running")
      return
    }

    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by this browser"
      setError(errorMsg)
      toast.error(errorMsg, { id: "geolocation-support" })
      return
    }

    console.log("Starting enhanced location tracking...")
    initializationRef.current = true
    setIsTracking(true)
    setError(null)

    // Enhanced geolocation options for maximum accuracy
    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000, // Increased timeout for better accuracy
      maximumAge: 0, // Always get fresh location
    }

    // Get initial high-accuracy position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Initial location obtained:", position.coords.accuracy + "m")
        processLocation(position)
      },
      handleError,
      geoOptions,
    )

    // Start continuous tracking with longer intervals for stability
    watchIdRef.current = navigator.geolocation.watchPosition(processLocation, handleError, {
      ...geoOptions,
      timeout: 15000, // Slightly shorter for watch
    })

    console.log("Enhanced location tracking started with watch ID:", watchIdRef.current)
    toast.success("High-accuracy location tracking started", {
      id: "tracking-start",
      duration: 3000,
    })
  }, [processLocation, handleError, isTracking])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      console.log("Location tracking stopped")
    }
    setIsTracking(false)
    initializationRef.current = false
  }, [])

  // Single initialization effect
  useEffect(() => {
    let mounted = true

    const initializeTracking = () => {
      if (mounted && !initializationRef.current) {
        startTracking()
      }
    }

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(initializeTracking, 1000)

    return () => {
      mounted = false
      clearTimeout(timer)
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      initializationRef.current = false
    }
  }, []) // Empty dependency array - only run once

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking,
  }
}

const IndividualEmployeeMapPage = () => {
  const { socket, isAuthenticated, user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const employeeId = Array.isArray(params.employeeId) ? params.employeeId[0] : params.employeeId

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [currentLocation, setCurrentLocation] = useState<LatLngTuple | null>(null)
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null)
  const [movementHistory, setMovementHistory] = useState<LocationData[]>([])
  const [center, setCenter] = useState<LatLngTuple>([40.7128, -74.006])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...")
  const [zoom, setZoom] = useState(13)
  const [mapLayer, setMapLayer] = useState("street")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showAccuracyCircle, setShowAccuracyCircle] = useState(true)
  const [currentAccuracy, setCurrentAccuracy] = useState<number | undefined>()
  const [currentQualityScore, setCurrentQualityScore] = useState<number | undefined>()
  const [locationSource, setLocationSource] = useState<string | undefined>()

  const mapRef = useRef<L.Map | null>(null)
  const lastToastRef = useRef<number>(0) // Prevent toast spam

  // Enhanced location tracking
  const { location: enhancedUserLocation, isTracking, startTracking, stopTracking } = useEnhancedLocation()

  // Memoize map layers to prevent re-renders
  const mapLayers = useMemo(
    () => ({
      street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      dark: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    }),
    [],
  )

  // Memoize toast options to prevent re-renders
  const toastOptions = useMemo(
    () => ({
      style: {
        background: "#1e293b",
        color: "#f1f5f9",
        border: "1px solid #334155",
      },
    }),
    [],
  )

  // Map control functions
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomIn()
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomOut()
    }
  }, [])

  const handleCenterEmployee = useCallback(() => {
    if (mapRef.current && currentLocation) {
      mapRef.current.flyTo(currentLocation, 16, { duration: 1.5 })
    }
  }, [currentLocation])

  const handleCenterUser = useCallback(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo(userLocation, 16, { duration: 1.5 })
    }
  }, [userLocation])

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // Update user location when enhanced location changes
  useEffect(() => {
    if (enhancedUserLocation) {
      const latLng: LatLngTuple = [enhancedUserLocation.latitude, enhancedUserLocation.longitude]
      setUserLocation(latLng)
    }
  }, [enhancedUserLocation])

  // Auto-start enhanced location tracking
  useEffect(() => {
    // Only initialize if authenticated and not already tracking
    if (isAuthenticated && !isTracking) {
      console.log("User authenticated, location tracking will auto-start")
    }

    // Cleanup on unmount
    return () => {
      stopTracking()
    }
  }, [isAuthenticated]) // Only depend on authentication status

  // Fetch employee data
  useEffect(() => {
    async function fetchEmployeeData() {
      if (!employeeId) {
        console.error("Map: No employee ID provided in URL, params:", params)
        setError("No employee ID provided")
        toast.error("No employee ID provided", { id: "no-employee-id" })
        setLoading(false)
        return
      }

      if (!isAuthenticated) {
        console.error("Map: User not authenticated")
        setError("User not authenticated")
        toast.error("Please log in to view employee details", { id: "not-authenticated" })
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        console.log("Map: Fetching employee details for employeeId:", employeeId)

        const response = await getEmployeeDetails(employeeId)
        console.log("Map: Employee details response:", response)

        const { employee: employeeData, locations } = response.data

        if (!employeeData) {
          console.error("Map: No employee data returned for employeeId:", employeeId)
          throw new Error("Employee data not found")
        }

        setEmployee({
          id: employeeData.id,
          name: employeeData.name,
          email: employeeData.email,
          position: employeeData.position || "Employee",
          department: employeeData.department,
          isOnline: employeeData.isOnline || false,
          lastSeen: employeeData.lastSeen,
          lastLocation: employeeData.lastLocation,
        })

        if (employeeData.lastLocation?.latitude && employeeData.lastLocation?.longitude) {
          const latLng: LatLngTuple = [employeeData.lastLocation.latitude, employeeData.lastLocation.longitude]
          setCurrentLocation(latLng)
          setCenter(latLng)
          console.log("Map: Set initial employee location:", latLng)
        } else {
          console.log("Map: No last location available for employee")
          setError("No recent location data available for this employee")
        }

        if (locations && Array.isArray(locations)) {
          const history = locations
            .filter((loc: any) => loc.latitude != null && loc.longitude != null)
            .map((loc: any) => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
              timestamp: loc.timestamp,
              accuracy: loc.accuracy,
              address: loc.address,
              source: loc.source,
              qualityScore: loc.qualityScore,
            }))
            .slice(-100)

          setMovementHistory(history)
          console.log("Map: Movement history loaded:", history.length, "points")

          // Set current accuracy from latest location
          if (history.length > 0) {
            const latest = history[history.length - 1]
            setCurrentAccuracy(latest.accuracy)
            setCurrentQualityScore(latest.qualityScore)
            setLocationSource(latest.source)
          }
        } else {
          console.log("Map: No location history available")
          setMovementHistory([])
        }
      } catch (err: any) {
        console.error("Map: Error fetching employee data:", {
          message: err.message,
          status: err.status,
        })
        if (err.message.includes("404")) {
          const errorMsg = `Employee not found for Employee ID: ${employeeId}`
          setError(errorMsg)
          toast.error(errorMsg, { id: "employee-not-found" })
        } else {
          const errorMsg = err.message || "Failed to load employee data"
          setError(errorMsg)
          toast.error(errorMsg, { id: "fetch-error" })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeData()
  }, [employeeId, isAuthenticated, params])

  // Set up WebSocket listeners for employee's location updates
  useEffect(() => {
    if (!isAuthenticated || !socket || !employeeId) {
      if (!isAuthenticated) {
        console.log("Map: User not authenticated")
        setConnectionStatus("Not authenticated")
        setError("User not authenticated")
      } else if (!socket) {
        console.log("Map: WebSocket not available")
        setConnectionStatus("WebSocket not available")
        setError("WebSocket connection not available")
      } else if (!employeeId) {
        console.log("Map: No employee ID provided")
        setConnectionStatus("No employee ID")
        setError("No employee ID provided")
      }
      return
    }

    if (!socket.connected) {
      console.log("Map: WebSocket not connected, attempting to connect")
      setConnectionStatus("WebSocket disconnected")
      setError("WebSocket not connected, retrying...")
      socket.connect()
      return
    }

    console.log("Map: Setting up WebSocket listeners for employeeId:", employeeId)
    setConnectionStatus("Connected")
    setError(null)

    const setupWebSocket = async () => {
      try {
        const response = await getUserIdFromEmployeeId(employeeId)
        const userId = response.data.userId

        if (!userId) {
          console.error("Map: No userId found for employeeId:", employeeId)
          setError("No user associated with this employee")
          toast.error("No user associated with this employee", { id: "no-user-id" })
          return
        }

        socket.emit("join", `user_${userId}`)
        console.log("Map: Joined room user_", userId)

        const handleLocationUpdate = (data: any) => {
          console.log("Map: Received locationUpdate:", data)
          const { userId: updateUserId, latitude, longitude, accuracy, timestamp, address, source, qualityScore } = data

          if (updateUserId === userId && latitude != null && longitude != null) {
            const latLng: LatLngTuple = [latitude, longitude]
            const newLocation: LocationData = {
              latitude,
              longitude,
              timestamp,
              accuracy,
              address,
              source,
              qualityScore,
            }

            setCurrentLocation(latLng)
            setCurrentAccuracy(accuracy)
            setCurrentQualityScore(qualityScore)
            setLocationSource(source)
            setMovementHistory((prev) => [...prev, newLocation].slice(-100))

            setEmployee((prev) =>
              prev
                ? {
                    ...prev,
                    isOnline: true,
                    lastSeen: timestamp,
                    lastLocation: { latitude, longitude, timestamp, address },
                  }
                : prev,
            )

            setCenter(latLng)
            if (mapRef.current) {
              mapRef.current.flyTo(latLng, undefined, { duration: 1 })
              mapRef.current.invalidateSize()
            }

            // Throttle toast notifications to prevent spam
            const now = Date.now()
            if (now - lastToastRef.current > 15000) {
              // Max 1 toast per 15 seconds
              const accuracyText = accuracy ? `±${accuracy.toFixed(1)}m` : "Unknown accuracy"
              const qualityText = qualityScore ? ` (Quality: ${qualityScore}/100)` : ""
              toast.success(`Employee location updated: ${accuracyText}${qualityText}`, {
                duration: 3000,
                id: "employee-location-update",
              })
              lastToastRef.current = now
            }
          }
        }

        const handleUserStatusUpdate = (data: any) => {
          console.log("Map: Received userStatusUpdate:", data)
          const { userId: updateUserId, isOnline, lastSeen } = data

          if (updateUserId === userId) {
            setEmployee((prev) => {
              if (!prev) return prev
              const isRecentlyActive = lastSeen && new Date().getTime() - new Date(lastSeen).getTime() < 60000
              return { ...prev, isOnline: isOnline && isRecentlyActive, lastSeen }
            })
          }
        }

        const handleLocationError = ({ error }: { error: string }) => {
          console.error("Map: Location error from server:", error)
          setError(error)
          toast.error(error, { id: "server-location-error" })
        }

        socket.on("locationUpdate", handleLocationUpdate)
        socket.on(`locationUpdated:${userId}`, handleLocationUpdate)
        socket.on("userStatusUpdate", handleUserStatusUpdate)
        socket.on("locationError", handleLocationError)

        return () => {
          console.log("Map: Cleaning up WebSocket listeners")
          socket.off("locationUpdate", handleLocationUpdate)
          socket.off(`locationUpdated:${userId}`, handleLocationUpdate)
          socket.off("userStatusUpdate", handleUserStatusUpdate)
          socket.off("locationError", handleLocationError)
        }
      } catch (err: any) {
        console.error("Map: Error fetching userId for employeeId:", employeeId, err.message)
        setError("Failed to fetch user ID for this employee")
        toast.error("Failed to fetch user ID for this employee", { id: "fetch-user-id-error" })
      }
    }

    setupWebSocket()
  }, [employeeId, socket, isAuthenticated, socket?.connected])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-300 text-lg">Loading enhanced employee location data...</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="mx-auto mb-6 text-red-400" size={64} />
            <h2 className="text-2xl font-bold text-red-400 mb-4">{error || "Employee not found"}</h2>
            <p className="text-gray-400 mb-6">Employee ID: {employeeId || "Not provided"}</p>
            <button
              onClick={() => router.push("/dashboard/employees/employee-list")}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <ArrowLeft className="inline mr-2" size={20} />
              Go Back to Employee List
            </button>
          </div>
        </div>
      </div>
    )
  }

  const mapContainerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-slate-900"
    : "bg-slate-800 rounded-xl overflow-hidden shadow-2xl"

  const mapHeight = isFullscreen ? "100vh" : "calc(100vh - 280px)"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Fixed Toaster with optimized options */}
      <Toaster
        position="top-right"
        toastOptions={toastOptions}
        containerStyle={{
          top: 20,
          right: 20,
        }}
      />

      {!isFullscreen && (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/dashboard/employees/employee-list")}
                className="mr-4 p-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <ArrowLeft className="text-white" size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <MapIcon className="mr-3 text-red-400" size={32} />
                  Enhanced Location Tracking
                </h1>
                <p className="text-gray-400 mt-1">High-precision employee location monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <AccuracyIndicator accuracy={currentAccuracy} qualityScore={currentQualityScore} />
              <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-4 py-2">
                {connectionStatus === "Connected" ? (
                  <Wifi className="text-green-400" size={20} />
                ) : (
                  <WifiOff className="text-red-400" size={20} />
                )}
                <span className="text-gray-300 text-sm font-medium">{connectionStatus}</span>
              </div>
            </div>
          </div>

          {/* Employee Info Card */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 mb-6 shadow-xl border border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <User className="text-white" size={32} />
                  </div>
                  {employee.isOnline && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{employee.name}</h2>
                  <p className="text-gray-300 flex items-center">
                    <span className="mr-2">📧</span>
                    {employee.email}
                  </p>
                  <p className="text-gray-300 flex items-center">
                    <span className="mr-2">💼</span>
                    {employee.position}
                  </p>
                  {employee.department && (
                    <p className="text-gray-300 flex items-center">
                      <span className="mr-2">🏢</span>
                      {employee.department}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end space-x-2 mb-2">
                  {employee.isOnline ? (
                    <>
                      <Activity className="text-green-400 animate-pulse" size={24} />
                      <span className="text-green-400 font-semibold">Online</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="text-red-400" size={24} />
                      <span className="text-red-400 font-semibold">Offline</span>
                    </>
                  )}
                </div>
                {employee.lastSeen && (
                  <p className="text-gray-400 flex items-center justify-end">
                    <Clock className="mr-2" size={16} />
                    Last seen: {new Date(employee.lastSeen).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500 text-red-300 p-4 rounded-xl mb-6 flex items-center shadow-lg">
              <AlertCircle className="mr-3 flex-shrink-0" size={24} />
              <div>
                <p className="font-semibold">Connection Issue</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Enhanced Statistics with GPS Optimizer */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Movement Points</p>
                  <p className="text-2xl font-bold text-white">{movementHistory.length}</p>
                </div>
                <MapPin className="text-purple-400" size={32} />
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Last Update</p>
                  <p className="text-lg font-bold text-white">
                    {employee.lastLocation?.timestamp
                      ? new Date(employee.lastLocation.timestamp).toLocaleTimeString()
                      : "No data"}
                  </p>
                </div>
                <Clock className="text-blue-400" size={32} />
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Accuracy</p>
                  <p className="text-lg font-bold text-white">
                    {currentAccuracy ? `±${currentAccuracy.toFixed(1)}m` : "N/A"}
                  </p>
                </div>
                <Target className="text-green-400" size={32} />
              </div>
            </div>
            <LocationStatus
              isTracking={isTracking}
              lastUpdate={employee.lastLocation?.timestamp}
              accuracy={currentAccuracy}
              source={locationSource}
            />
            <GPSAccuracyOptimizer
              onAccuracyImproved={(accuracy) => {
                console.log("GPS accuracy improved to:", accuracy)
                if (accuracy <= 20) {
                  toast.success(`Excellent GPS accuracy achieved: ±${accuracy.toFixed(1)}m`, {
                    duration: 5000,
                    id: "gps-optimized",
                  })
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Enhanced Map Container */}
      <div className={mapContainerClass}>
        <div className="relative w-full" style={{ height: mapHeight }}>
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
            className="leaflet-container"
            zoomControl={false}
            attributionControl={true}
          >
            <TileLayer
              url={mapLayers[mapLayer as keyof typeof mapLayers]}
              attribution={
                mapLayer === "satellite"
                  ? "© Esri © OpenStreetMap contributors"
                  : mapLayer === "terrain"
                    ? "© OpenTopoMap contributors"
                    : mapLayer === "dark"
                      ? "© Stadia Maps © OpenMapTiles © OpenStreetMap contributors"
                      : "© OpenStreetMap contributors"
              }
            />

            {/* Layer Selector */}
            <LayerSelector currentLayer={mapLayer} onLayerChange={setMapLayer} />

            {/* Enhanced Map Controls */}
            <MapControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onCenterEmployee={handleCenterEmployee}
              onCenterUser={handleCenterUser}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={isFullscreen}
            />

            {/* Employee's Current Location */}
            {currentLocation && (
              <>
                <Marker position={currentLocation} icon={currentLocationIcon}>
                  <Popup className="custom-popup">
                    <div className="p-2">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                        <p className="font-bold text-lg">{employee.name}</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Position:</strong> {employee.position}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Status:</strong>
                        <span className={employee.isOnline ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                          {employee.isOnline ? "Online" : "Offline"}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Last seen:</strong>{" "}
                        {employee.lastLocation?.timestamp
                          ? new Date(employee.lastLocation.timestamp).toLocaleString()
                          : "Unknown"}
                      </p>
                      {employee.lastLocation?.address && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Address:</strong> {employee.lastLocation.address}
                        </p>
                      )}
                      {currentAccuracy && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Accuracy:</strong> ±{currentAccuracy.toFixed(1)}m
                        </p>
                      )}
                      {locationSource && (
                        <p className="text-sm text-gray-600">
                          <strong>Source:</strong> {locationSource.toUpperCase()}
                        </p>
                      )}
                      {currentQualityScore && (
                        <p className="text-sm text-gray-600">
                          <strong>Quality Score:</strong> {currentQualityScore}/100
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Enhanced Accuracy Circle */}
                {showAccuracyCircle && currentAccuracy && (
                  <Circle
                    center={currentLocation}
                    radius={currentAccuracy}
                    pathOptions={{
                      color: currentAccuracy <= 10 ? "#10b981" : currentAccuracy <= 30 ? "#f59e0b" : "#dc2626",
                      fillColor: currentAccuracy <= 10 ? "#10b981" : currentAccuracy <= 30 ? "#f59e0b" : "#dc2626",
                      fillOpacity: 0.1,
                      weight: 2,
                      dashArray: "5, 10",
                    }}
                  />
                )}
              </>
            )}

            {/* User's Location */}
            {userLocation && (
              <>
                <Marker position={userLocation} icon={userLocationIcon}>
                  <Popup>
                    <div className="p-2">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <p className="font-bold">Your Location</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Updated: {new Date().toLocaleString()}</p>
                      {enhancedUserLocation && (
                        <>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Accuracy:</strong> ±{enhancedUserLocation.accuracy.toFixed(1)}m
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Source:</strong> {enhancedUserLocation.source.toUpperCase()}
                          </p>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={userLocation}
                  radius={enhancedUserLocation?.accuracy || 100}
                  pathOptions={{
                    color: "#0088ff",
                    fillColor: "#0088ff",
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />
              </>
            )}

            {/* Enhanced Movement History Trail */}
            {movementHistory.length > 1 && (
              <>
                {/* Gradient polyline effect */}
                <Polyline
                  positions={movementHistory.map((loc) => [loc.latitude, loc.longitude] as LatLngTuple)}
                  pathOptions={{
                    color: "#9333dc",
                    weight: 6,
                    opacity: 0.8,
                    smoothFactor: 1,
                  }}
                />
                <Polyline
                  positions={movementHistory.map((loc) => [loc.latitude, loc.longitude] as LatLngTuple)}
                  pathOptions={{
                    color: "#a855f7",
                    weight: 4,
                    opacity: 0.6,
                    smoothFactor: 1,
                  }}
                />
                <Polyline
                  positions={movementHistory.map((loc) => [loc.latitude, loc.longitude] as LatLngTuple)}
                  pathOptions={{
                    color: "#c084fc",
                    weight: 2,
                    opacity: 0.4,
                    smoothFactor: 1,
                  }}
                />

                {/* Enhanced history markers */}
                {movementHistory.slice(0, -1).map((loc, index) => (
                  <Marker key={index} position={[loc.latitude, loc.longitude]} icon={historyIcon} opacity={0.7}>
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold text-purple-600 mb-1">Movement Point #{index + 1}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Time:</strong> {new Date(loc.timestamp).toLocaleString()}
                        </p>
                        {loc.address && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Address:</strong> {loc.address}
                          </p>
                        )}
                        {loc.accuracy && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Accuracy:</strong> ±{loc.accuracy.toFixed(1)}m
                          </p>
                        )}
                        {loc.source && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Source:</strong> {loc.source.toUpperCase()}
                          </p>
                        )}
                        {loc.qualityScore && (
                          <p className="text-sm text-gray-600">
                            <strong>Quality:</strong> {loc.qualityScore}/100
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}
          </MapContainer>

          {/* Fullscreen controls */}
          {isFullscreen && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-6 py-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-800">{employee.name}</span>
                  </div>
                  <div className="text-gray-600">|</div>
                  <div className="flex items-center space-x-1">
                    {employee.isOnline ? (
                      <CheckCircle className="text-green-500" size={16} />
                    ) : (
                      <AlertCircle className="text-red-500" size={16} />
                    )}
                    <span className="text-sm text-gray-700">{employee.isOnline ? "Online" : "Offline"}</span>
                  </div>
                  {currentAccuracy && (
                    <>
                      <div className="text-gray-600">|</div>
                      <span className="text-sm text-gray-700">±{currentAccuracy.toFixed(1)}m</span>
                    </>
                  )}
                  <button
                    onClick={handleToggleFullscreen}
                    className="ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-colors"
                  >
                    Exit Fullscreen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Map legend */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Legend</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-600"></div>
                  <span className="text-gray-700">Employee Location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-600"></div>
                  <span className="text-gray-700">Your Location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-purple-600"></div>
                  <span className="text-gray-700">Movement History</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-gradient-to-r from-purple-600 to-purple-400 rounded"></div>
                  <span className="text-gray-700">Movement Path</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-green-500 rounded-full bg-green-500/20"></div>
                  <span className="text-gray-700">High Accuracy (&lt;=10m)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-yellow-500 rounded-full bg-yellow-500/20"></div>
                  <span className="text-gray-700">Good Accuracy (&lt;=30m)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-red-500 rounded-full bg-red-500/20"></div>
                  <span className="text-gray-700">Poor Accuracy (&gt;30m)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isFullscreen && (
        <div className="max-w-7xl mx-auto mt-4">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Settings className="text-gray-400" size={20} />
                <span className="text-gray-300 font-medium">Enhanced Map Controls</span>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={showAccuracyCircle}
                    onChange={(e) => setShowAccuracyCircle(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Show Accuracy Circle</span>
                </label>
                <div className="flex items-center space-x-2 text-gray-300">
                  <span className="text-sm">Location Tracking:</span>
                  <span className={`text-sm font-medium ${isTracking ? "text-green-400" : "text-red-400"}`}>
                    {isTracking ? "Active" : "Inactive"}
                  </span>
                </div>
                <button
                  onClick={handleToggleFullscreen}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
                >
                  <Maximize2 className="inline mr-2" size={16} />
                  Fullscreen Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndividualEmployeeMapPage
