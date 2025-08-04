"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Settings, Smartphone, Wifi, Satellite, AlertTriangle, CheckCircle, RefreshCw, MapPin } from "lucide-react"
import toast from "react-hot-toast"

interface GPSOptimizerProps {
  onAccuracyImproved?: (accuracy: number) => void
}

export const GPSAccuracyOptimizer = ({ onAccuracyImproved }: GPSOptimizerProps) => {
  const [gpsStatus, setGpsStatus] = useState<{
    permission: string
    accuracy: number | null
    source: string
    recommendations: string[]
    isOptimizing: boolean
    lastAttempt: number
    attempts: number
  }>({
    permission: "unknown",
    accuracy: null,
    source: "unknown",
    recommendations: [],
    isOptimizing: false,
    lastAttempt: 0,
    attempts: 0,
  })

  const watchIdRef = useRef<number | null>(null)
  const optimizationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const getAccuracyRecommendations = useCallback((accuracy: number | null, source: string): string[] => {
    const recommendations: string[] = []

    if (!accuracy || accuracy > 1000) {
      recommendations.push("🛰️ Enable GPS/Location Services in device settings")
      recommendations.push("📱 Allow location access for this website")
      recommendations.push("🌍 Move to an outdoor area with clear sky view")
      recommendations.push("🔄 Restart your browser and try again")
    } else if (accuracy > 100) {
      recommendations.push("🌤️ Move away from tall buildings and indoor areas")
      recommendations.push("⏱️ Wait 30-60 seconds for GPS satellites to lock")
      recommendations.push("📶 Ensure strong cellular/WiFi signal")
      recommendations.push("🔋 Check if battery saver mode is affecting GPS")
    } else if (accuracy > 50) {
      recommendations.push("⏳ Wait for GPS accuracy to improve")
      recommendations.push("🏢 Move away from buildings that might block GPS")
      recommendations.push("📱 Close other apps using location services")
    } else if (accuracy > 20) {
      recommendations.push("✅ GPS accuracy is good!")
      recommendations.push("🎯 Wait a bit more for even better precision")
    } else {
      recommendations.push("🎉 Excellent GPS accuracy achieved!")
      recommendations.push("🌟 Your location is very precise")
    }

    // Add source-specific recommendations
    if (source === "network" || source === "Network") {
      recommendations.unshift("⚠️ Using cell tower/WiFi location (less accurate)")
      recommendations.unshift("🛰️ Trying to acquire GPS satellite signal...")
    }

    return recommendations
  }, [])

  const attemptGPSOptimization = useCallback(async () => {
    if (gpsStatus.isOptimizing) {
      console.log("GPS optimization already in progress")
      return
    }

    setGpsStatus((prev) => ({
      ...prev,
      isOptimizing: true,
      attempts: prev.attempts + 1,
      lastAttempt: Date.now(),
    }))

    console.log("Starting GPS optimization attempt...")

    try {
      // Clear any existing watch
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }

      // Progressive GPS acquisition strategy
      const strategies = [
        // Strategy 1: Maximum accuracy, long timeout
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
          name: "High Accuracy GPS",
        },
        // Strategy 2: Balanced approach
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
          name: "Balanced GPS",
        },
        // Strategy 3: Quick fallback
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 10000,
          name: "Network Location",
        },
      ]

      let bestPosition: GeolocationPosition | null = null
      let bestAccuracy = Number.POSITIVE_INFINITY

      for (const strategy of strategies) {
        try {
          console.log(`Trying GPS strategy: ${strategy.name}`)

          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error(`${strategy.name} timeout`))
            }, strategy.timeout)

            navigator.geolocation.getCurrentPosition(
              (pos) => {
                clearTimeout(timeoutId)
                resolve(pos)
              },
              (err) => {
                clearTimeout(timeoutId)
                reject(err)
              },
              strategy,
            )
          })

          const accuracy = position.coords.accuracy
          console.log(`${strategy.name} result: ±${accuracy}m`)

          if (accuracy < bestAccuracy) {
            bestPosition = position
            bestAccuracy = accuracy
          }

          // If we get good accuracy, stop trying other strategies
          if (accuracy <= 20) {
            console.log("Good accuracy achieved, stopping optimization")
            break
          }
        } catch (error) {
          console.log(`${strategy.name} failed:`, error)
          continue
        }
      }

      if (bestPosition) {
        const accuracy = bestPosition.coords.accuracy
        const source = accuracy <= 50 ? "GPS" : "Network"

        setGpsStatus((prev) => ({
          ...prev,
          accuracy,
          source,
          permission: "granted",
          recommendations: getAccuracyRecommendations(accuracy, source),
          isOptimizing: false,
        }))

        onAccuracyImproved?.(accuracy)

        // Start continuous monitoring with the best strategy
        const monitoringOptions: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000,
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newAccuracy = position.coords.accuracy
            const newSource = newAccuracy <= 50 ? "GPS" : "Network"

            setGpsStatus((prev) => ({
              ...prev,
              accuracy: newAccuracy,
              source: newSource,
              recommendations: getAccuracyRecommendations(newAccuracy, newSource),
            }))

            onAccuracyImproved?.(newAccuracy)
          },
          (error) => {
            console.error("GPS monitoring error:", error)
          },
          monitoringOptions,
        )

        if (accuracy <= 20) {
          toast.success(`Excellent GPS accuracy: ±${accuracy.toFixed(1)}m`, {
            duration: 4000,
            id: "gps-optimized",
          })
        } else if (accuracy <= 50) {
          toast.success(`Good GPS accuracy: ±${accuracy.toFixed(1)}m`, {
            duration: 3000,
            id: "gps-improved",
          })
        } else {
          toast(`Location acquired: ±${accuracy.toFixed(1)}m (${source})`, {
            duration: 3000,
            id: "location-acquired",
          })
        }
      } else {
        throw new Error("All GPS strategies failed")
      }
    } catch (error) {
      console.error("GPS optimization failed:", error)

      setGpsStatus((prev) => ({
        ...prev,
        isOptimizing: false,
        recommendations: [
          "❌ GPS optimization failed",
          "⚙️ Enable location in browser settings",
          "🔄 Refresh page after enabling location",
          "📡 Check internet connection",
        ],
      }))

      toast.error("GPS optimization failed. Check device settings.", {
        id: "gps-failed",
        duration: 5000,
      })
    }
  }, [gpsStatus.isOptimizing, getAccuracyRecommendations, onAccuracyImproved])

  const checkInitialGPSStatus = useCallback(async () => {
    try {
      // Check permissions
      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: "geolocation" })
          setGpsStatus((prev) => ({ ...prev, permission: permission.state }))

          if (permission.state === "denied") {
            setGpsStatus((prev) => ({
              ...prev,
              recommendations: [
                "🚫 Location permission denied",
                "⚙️ Enable location in browser settings",
                "🔄 Refresh page after enabling location",
              ],
            }))
            return
          }
        } catch (error) {
          console.log("Permission API not supported")
        }
      }

      // Quick initial check
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const accuracy = position.coords.accuracy
            const source = accuracy <= 50 ? "GPS" : "Network"

            setGpsStatus((prev) => ({
              ...prev,
              accuracy,
              source,
              permission: "granted",
              recommendations: getAccuracyRecommendations(accuracy, source),
            }))

            onAccuracyImproved?.(accuracy)
          },
          (error) => {
            console.error("Initial GPS check failed:", error)
            setGpsStatus((prev) => ({
              ...prev,
              recommendations: [
                "⚠️ Initial GPS check failed",
                "🛰️ Click 'Optimize GPS' to try advanced methods",
                "📱 Ensure location services are enabled",
              ],
            }))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        )
      }
    } catch (error) {
      console.error("GPS status check failed:", error)
    }
  }, [getAccuracyRecommendations, onAccuracyImproved])

  // Auto-retry optimization if accuracy is poor
  useEffect(() => {
    if (gpsStatus.accuracy && gpsStatus.accuracy > 100 && !gpsStatus.isOptimizing) {
      const timeSinceLastAttempt = Date.now() - gpsStatus.lastAttempt

      // Auto-retry after 30 seconds if accuracy is still poor and we haven't tried too many times
      if (timeSinceLastAttempt > 30000 && gpsStatus.attempts < 3) {
        console.log("Auto-retrying GPS optimization due to poor accuracy")
        optimizationTimeoutRef.current = setTimeout(() => {
          attemptGPSOptimization()
        }, 2000)
      }
    }

    return () => {
      if (optimizationTimeoutRef.current) {
        clearTimeout(optimizationTimeoutRef.current)
      }
    }
  }, [gpsStatus.accuracy, gpsStatus.isOptimizing, gpsStatus.lastAttempt, gpsStatus.attempts, attemptGPSOptimization])

  useEffect(() => {
    checkInitialGPSStatus()

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (optimizationTimeoutRef.current) {
        clearTimeout(optimizationTimeoutRef.current)
      }
    }
  }, [checkInitialGPSStatus])

  const getStatusColor = (accuracy: number | null) => {
    if (!accuracy) return "text-gray-400"
    if (accuracy <= 10) return "text-green-400"
    if (accuracy <= 30) return "text-yellow-400"
    if (accuracy <= 100) return "text-orange-400"
    return "text-red-400"
  }

  const getStatusIcon = (accuracy: number | null, source: string) => {
    if (!accuracy) return <Wifi className="text-gray-400" size={20} />
    if (source === "GPS" && accuracy <= 20) return <Satellite className="text-green-400" size={20} />
    if (source === "GPS") return <Satellite className="text-yellow-400" size={20} />
    if (source === "Network") return <Smartphone className="text-orange-400" size={20} />
    return <AlertTriangle className="text-red-400" size={20} />
  }

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "granted":
        return <CheckCircle className="text-green-400" size={16} />
      case "denied":
        return <AlertTriangle className="text-red-400" size={16} />
      default:
        return <AlertTriangle className="text-yellow-400" size={16} />
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center">
          <Settings className="mr-2 text-blue-400" size={20} />
          GPS Optimizer
        </h3>
        <button
          onClick={attemptGPSOptimization}
          disabled={gpsStatus.isOptimizing}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm transition-colors flex items-center space-x-1"
        >
          {gpsStatus.isOptimizing ? (
            <>
              <RefreshCw className="animate-spin" size={14} />
              <span>Optimizing...</span>
            </>
          ) : (
            <>
              <MapPin size={14} />
              <span>Optimize GPS</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Permission:</span>
          <div className="flex items-center space-x-2">
            {getPermissionIcon(gpsStatus.permission)}
            <span className="text-white text-sm capitalize">{gpsStatus.permission}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Current Accuracy:</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(gpsStatus.accuracy, gpsStatus.source)}
            <span className={`text-sm font-medium ${getStatusColor(gpsStatus.accuracy)}`}>
              {gpsStatus.accuracy ? `±${gpsStatus.accuracy.toFixed(1)}m` : "Unknown"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Source:</span>
          <span className="text-white text-sm">{gpsStatus.source}</span>
        </div>

        {gpsStatus.attempts > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Attempts:</span>
            <span className="text-white text-sm">{gpsStatus.attempts}/3</span>
          </div>
        )}

        {gpsStatus.recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-slate-700 rounded-lg">
            <h4 className="text-yellow-400 text-sm font-medium mb-2">
              {gpsStatus.accuracy && gpsStatus.accuracy <= 20 ? "Status:" : "Recommendations:"}
            </h4>
            <ul className="space-y-1">
              {gpsStatus.recommendations.slice(0, 4).map((rec, index) => (
                <li key={index} className="text-gray-300 text-xs flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {gpsStatus.isOptimizing && (
          <div className="mt-3 p-2 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <RefreshCw className="animate-spin text-blue-400" size={16} />
              <span className="text-blue-300 text-sm">Acquiring GPS signal...</span>
            </div>
            <div className="text-xs text-blue-400 mt-1">This may take 30-60 seconds for best accuracy</div>
          </div>
        )}
      </div>
    </div>
  )
}
