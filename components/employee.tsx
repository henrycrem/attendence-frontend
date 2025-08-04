"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { MapPin, AlertCircle, CheckCircle, ArrowLeft, User, Clock, Wifi, WifiOff } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { getEmployeeDetails } from "@/actions/attendence";

// Custom marker icons
const currentLocationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const historyIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNiIgZmlsbD0iIzM3MzNkYyIgc3Ryb2tlPSIjOTMzM2RjIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string | null;
  isOnline: boolean;
  lastSeen: string | null;
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  address?: string;
}

const IndividualEmployeeMapPageComponent = () => {
  const { socket, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const employeeId = params.employeeId as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLngTuple | null>(null);
  const [movementHistory, setMovementHistory] = useState<LocationData[]>([]);
  const [center, setCenter] = useState<LatLngTuple>([0, 0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  // Fetch employee data and location history
  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        setLoading(true);
        console.log("Map: Fetching employee details for employeeId:", employeeId);
        const response = await getEmployeeDetails(employeeId);
        const { employee: employeeData, locations } = response.data;

        setEmployee(employeeData);

        // Set initial center and current location
        if (employeeData.lastLocation?.latitude && employeeData.lastLocation?.longitude) {
          const latLng: LatLngTuple = [employeeData.lastLocation.latitude, employeeData.lastLocation.longitude];
          setCurrentLocation(latLng);
          setCenter(latLng);
        } else {
          console.log("Map: No last location, defaulting to [0, 0]");
          setCenter([0, 0]);
          setError("No location data available for this employee");
          toast.error("No location data available for this employee");
        }

        // Set movement history
        const history = locations
          .filter((loc: any) => loc.latitude != null && loc.longitude != null)
          .map((loc: any) => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
            timestamp: loc.timestamp,
            accuracy: loc.accuracy,
            address: loc.address,
          }));
        setMovementHistory(history);
        console.log("Map: Movement history loaded:", history);
      } catch (err: any) {
        console.error("Map: Error fetching employee data:", err.message);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (employeeId && isAuthenticated) {
      fetchEmployeeData();
    }
  }, [employeeId, isAuthenticated]);

  // Handle WebSocket location updates
  useEffect(() => {
    if (!isAuthenticated || !socket || !employeeId) {
      console.log("Map: WebSocket not connected or no employeeId, isAuthenticated:", isAuthenticated);
      setError("WebSocket not connected or no employee ID");
      toast.error("WebSocket not connected or no employee ID");
      return;
    }

    console.log("Map: Joining room user_", employeeId);
    socket.emit("join", `user_${employeeId}`);

    socket.on(`locationUpdated:${employeeId}`, (data) => {
      console.log("Map: Received locationUpdated:", data);
      const { userId, latitude, longitude, accuracy, timestamp, address } = data;

      if (userId === employeeId && latitude != null && longitude != null) {
        const latLng: LatLngTuple = [latitude, longitude];
        const newLocation: LocationData = { latitude, longitude, timestamp, accuracy, address };
        setCurrentLocation(latLng);
        setMovementHistory((prev) => [...prev, newLocation].slice(-100));
        setEmployee((prev) => (prev ? { ...prev, isOnline: true, lastSeen: timestamp } : prev));
        setCenter(latLng);
        if (mapRef.current) {
          mapRef.current.panTo(latLng);
          mapRef.current.invalidateSize();
        }
        toast.success(`Location updated at ${new Date(timestamp).toLocaleTimeString()}`);
      }
    });

    socket.on("locationError", ({ error }) => {
      console.error("Map: Location error from server:", error);
      setError(error);
      toast.error(error);
    });

    return () => {
      console.log("Map: Cleaning up WebSocket listeners");
      socket.off(`locationUpdated:${employeeId}`);
      socket.off("locationError");
    };
  }, [employeeId, socket, isAuthenticated]);

  // Handle map initialization
  const handleMapCreated = (map: L.Map) => {
    mapRef.current = map;
    if (currentLocation) {
      map.panTo(currentLocation);
    }
    map.invalidateSize();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "N/A";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString("en-US", { dateStyle: "medium" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
            <p className="text-red-400 text-xl mb-4">Employee not found</p>
            <button
              onClick={() => router.push("/attendance/employees")}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Toaster
        position="top-right"
        toastOptions={{ duration: 5000, style: { background: "#1e293b", color: "#e5e7eb", border: "1px solid #475569" } }}
      />
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push("/attendance/employees")}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-lg transition-colors duration-200 mr-4"
          >
            <ArrowLeft className="mr-2" size={18} />
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-200 flex items-center">
              <User className="mr-3 text-red-500" size={32} />
              {employee.name}
            </h1>
            <p className="text-gray-400 mt-1">{employee.position} • {employee.department || "N/A"}</p>
          </div>
        </div>

        {/* Employee Status Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              {employee.isOnline ? (
                <div className="flex items-center">
                  <Wifi className="mr-2 text-green-400" size={20} />
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-400 font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <WifiOff className="mr-2 text-red-400" size={20} />
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span className="text-red-400 font-medium">Offline</span>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 text-red-500" size={20} />
              <div>
                <p className="text-gray-400 text-sm">Last Seen</p>
                <p className="text-gray-200 font-medium">{formatLastSeen(employee.lastSeen)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="mr-2 text-red-500" size={20} />
              <div>
                <p className="text-gray-400 text-sm">Tracking Points</p>
                <p className="text-gray-200 font-medium">{movementHistory.length} locations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
            <MapPin className="mr-2 text-red-500" size={20} />
            Location Tracking - {employee.name}
          </h3>
          <div className="w-full h-[500px] rounded-xl overflow-hidden">
            <MapContainer
              center={center}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              whenCreated={handleMapCreated}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {currentLocation && (
                <Marker position={currentLocation} icon={currentLocationIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Current Location</strong>
                      <br />
                      {employee.name}
                      <br />
                      Lat: {currentLocation[0].toFixed(6)}
                      <br />
                      Lng: {currentLocation[1].toFixed(6)}
                      <br />
                      {movementHistory.length > 0 && (
                        <>
                          Updated: {formatTimestamp(movementHistory[movementHistory.length - 1].timestamp)}
                          <br />
                          {movementHistory[movementHistory.length - 1].address && (
                            <>Address: {movementHistory[movementHistory.length - 1].address}</>
                          )}
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
              {movementHistory.slice(0, -1).map((location, index) => (
                <Marker key={index} position={[location.latitude, location.longitude]} icon={historyIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Historical Location</strong>
                      <br />
                      Point {index + 1}
                      <br />
                      Lat: {location.latitude.toFixed(6)}
                      <br />
                      Lng: {location.longitude.toFixed(6)}
                      <br />
                      Time: {formatTimestamp(location.timestamp)}
                      <br />
                      {location.accuracy && <>Accuracy: {location.accuracy}m<br /></>}
                      {location.address && <>Address: {location.address}</>}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {movementHistory.length > 1 && (
                <Polyline
                  positions={movementHistory.map((loc) => [loc.latitude, loc.longitude] as LatLngTuple)}
                  color="red"
                  weight={3}
                  opacity={0.7}
                  dashArray="5, 10"
                />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Status Messages */}
        {currentLocation && (
          <div className="bg-green-500/20 border border-green-400/50 rounded-2xl p-4 text-center mb-4">
            <CheckCircle className="mx-auto mb-2 text-green-400" size={32} />
            <p className="text-green-400 font-medium">Successfully tracking {employee.name}'s location</p>
            <p className="text-green-300 text-sm mt-1">{movementHistory.length} location points recorded</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-2xl p-4 text-center">
            <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualEmployeeMapPageComponent;