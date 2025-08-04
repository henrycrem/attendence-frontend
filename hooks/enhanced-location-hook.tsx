"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import toast from "react-hot-toast"

interface LocationOptions {
  enableHighAccuracy: boolean
  timeout: number
  maximumAge: number
  desiredAccuracy?: number
  minAccuracy?: number
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

export const useEnhancedLocation = (
  options: LocationOptions = {
    enableHighAccuracy: true,
    timeout: 25000, // Increased timeout
    maximumAge: 0,
    desiredAccuracy: 20, // More realistic target
    minAccuracy: 100, // Accept network location as fallback
  },
) => {
  const [location, setLocation] = useState<EnhancedLocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const lastLocationRef = useRef<EnhancedLocationData | null>(null)
  const initializationRef = useRef<boolean>(false)
  const lastToastRef = useRef<number>(0)
  const gpsAttemptRef = useRef<number>(0)

  // Enhanced location validation with more lenient criteria
  const validateLocation = useCallback(
    (coords: GeolocationCoordinates): boolean => {
      // Check if coordinates are valid
      if (Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) {
        console.log("Invalid coordinates:", coords.latitude, coords.longitude)
        return false
      }

      // Accept network location as fallback (more lenient)
      if (coords.accuracy > (options.minAccuracy || 100)) {
        console.log(`Location rejected: accuracy ${coords.accuracy}m > ${options.minAccuracy}m`)
        return false
      }

      // Check for impossible speed (if we have previous location)
      if (lastLocationRef.current && coords.speed !== null && coords.speed > 0) {
        const timeDiff = (Date.now() - lastLocationRef.current.timestamp) / 1000
        const maxReasonableSpeed = 55.56 // 200 km/h in m/s

        if (coords.speed > maxReasonableSpeed) {
          console.log(`Location rejected: impossible speed ${coords.speed}m/s`)
          return false
        }
      }

      return true
    },
    [options.minAccuracy],
  )

  // Enhanced location processing with better source detection
  const processLocation = useCallback(
    (position: GeolocationPosition) => {
      const { coords } = position

      if (!validateLocation(coords)) {
        return
      }

      // Better source classification
      let source: "gps" | "network" | "passive"
      if (coords.accuracy <= 20) {
        source = "gps"
      } else if (coords.accuracy <= 100) {
        source = "network"
      } else {
        source = "passive"
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
        source,
      }

      // More intelligent update logic
      const shouldUpdate =
        !lastLocationRef.current ||
        coords.accuracy < lastLocationRef.current.accuracy * 0.9 || // 10% better accuracy
        position.timestamp - lastLocationRef.current.timestamp > 15000 || // 15 seconds newer
        (coords.accuracy <= 50 && lastLocationRef.current.accuracy > 100) // Significant improvement

      if (shouldUpdate) {
        setLocation(locationData)
        lastLocationRef.current = locationData
        setError(null)

        console.log(`Location updated: ±${coords.accuracy}m (${source})`)

        // Throttled toast notifications
        const now = Date.now()
        if (now - lastToastRef.current > 20000) {
          // Max 1 toast per 20 seconds
          if (coords.accuracy <= 20) {
            toast.success(`High accuracy GPS: ±${coords.accuracy.toFixed(1)}m`, {
              duration: 3000,
              id: "location-update-gps",
            })
          } else if (coords.accuracy <= 50) {
            toast.success(`Good location accuracy: ±${coords.accuracy.toFixed(1)}m`, {
              duration: 2000,
              id: "location-update-good",
            })
          } else if (source === "network") {
            toast(`Network location: ±${coords.accuracy.toFixed(0)}m`, {
              duration: 2000,
              id: "location-update-network",
            })
          }
          lastToastRef.current = now
        }
      }
    },
    [validateLocation],
  )

  const handleError = useCallback(
    (error: GeolocationPositionError) => {
      let errorMessage = "Location error: "
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += "Location access denied. Please enable location permissions."
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage += "GPS signal unavailable. Trying network location..."
          break
        case error.TIMEOUT:
          errorMessage += "Location request timed out. Retrying with network location..."
          break
        default:
          errorMessage += "Unknown location error"
          break
      }

      setError(errorMessage)
      console.error(errorMessage, error)

      // Try fallback strategies on error
      if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
        gpsAttemptRef.current += 1

        if (gpsAttemptRef.current <= 2) {
          console.log(`GPS attempt ${gpsAttemptRef.current} failed, trying fallback...`)

          // Try with less strict requirements
          setTimeout(() => {
            if (navigator.geolocation && !lastLocationRef.current) {
              navigator.geolocation.getCurrentPosition(
                processLocation,
                (fallbackError) => {
                  console.error("Fallback location also failed:", fallbackError)
                  const now = Date.now()
                  if (now - lastToastRef.current > 30000) {
                    toast.error("Unable to get location. Please check device settings.", {
                      id: "location-fallback-error",
                      duration: 5000,
                    })
                    lastToastRef.current = now
                  }
                },
                {
                  enableHighAccuracy: false, // Use network location
                  timeout: 10000,
                  maximumAge: 30000, // Accept cached location
                },
              )
            }
          }, 2000)
        }
      }

      // Only show error toast occasionally
      const now = Date.now()
      if (now - lastToastRef.current > 30000) {
        toast.error(errorMessage, {
          id: "location-error",
          duration: 5000,
        })
        lastToastRef.current = now
      }
    },
    [processLocation],
  )

  // Progressive GPS acquisition strategy
  const startTracking = useCallback(() => {
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

    console.log("Starting progressive GPS acquisition...")
    initializationRef.current = true
    setIsTracking(true)
    setError(null)
    gpsAttemptRef.current = 0

    // Strategy 1: Try high accuracy GPS first
    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: options.timeout,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(`Initial GPS position: ±${position.coords.accuracy}m`)
        processLocation(position)

        // Start continuous monitoring
        watchIdRef.current = navigator.geolocation.watchPosition(processLocation, handleError, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000,
        })
      },
      (error) => {
        console.log("High accuracy GPS failed, trying balanced approach...")

        // Strategy 2: Balanced approach
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log(`Balanced GPS position: ±${position.coords.accuracy}m`)
            processLocation(position)

            // Start monitoring with balanced settings
            watchIdRef.current = navigator.geolocation.watchPosition(processLocation, handleError, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
            })
          },
          (balancedError) => {
            console.log("Balanced GPS failed, trying network location...")

            // Strategy 3: Network location fallback
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log(`Network position: ±${position.coords.accuracy}m`)
                processLocation(position)

                // Start monitoring with network location
                watchIdRef.current = navigator.geolocation.watchPosition(processLocation, handleError, {
                  enableHighAccuracy: false,
                  timeout: 10000,
                  maximumAge: 30000,
                })
              },
              handleError,
              {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 30000,
              },
            )
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000,
          },
        )
      },
      highAccuracyOptions,
    )

    console.log("Progressive GPS tracking started")
    toast.success("Location tracking started", {
      id: "tracking-start",
      duration: 3000,
    })
  }, [options.timeout, processLocation, handleError, isTracking])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      console.log("Location tracking stopped")
    }
    setIsTracking(false)
    initializationRef.current = false
    gpsAttemptRef.current = 0
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
