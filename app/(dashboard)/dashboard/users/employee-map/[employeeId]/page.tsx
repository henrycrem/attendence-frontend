"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "apps/user-ui/src/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L, { type LatLngTuple } from "leaflet";
import { MapPin, AlertCircle, CheckCircle, ArrowLeft, User, Clock, Wifi, WifiOff } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { getEmployeeDetails } from "apps/user-ui/src/actions/attendence";

const currentLocationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const historyIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNiIgZmlsbD0iIzM3MzNkYyIgc3Ryb2tlPSIjOTMzM2RjIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+",
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
  lastLocation?: { latitude: number; longitude: number; timestamp: string; address?: string };
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  address?: string;
}

const IndividualEmployeeMapPage = () => {
  const { socket, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  console.log("Map: Raw params from useParams:", params);
  const employeeId = Array.isArray(params.employeeId) ? params.employeeId[0] : params.employeeId;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLngTuple | null>(null);
  const [movementHistory, setMovementHistory] = useState<LocationData[]>([]);
  const [center, setCenter] = useState<LatLngTuple>([40.7128, -74.006]); // Default to NYC
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    async function fetchEmployeeData() {
      if (!employeeId) {
        console.error("Map: No employee ID provided in URL, params:", params);
        setError("No employee ID provided");
        toast.error("No employee ID provided");
        setLoading(false);
        return;
      }

      if (!isAuthenticated) {
        console.error("Map: User not authenticated");
        setError("User not authenticated");
        toast.error("Please log in to view employee details");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("Map: Fetching employee details for employeeId:", employeeId);

        const response = await getEmployeeDetails(employeeId);
        console.log("Map: Employee details response:", response);

        const { employee: employeeData, locations } = response.data;

        if (!employeeData) {
          console.error("Map: No employee data returned for employeeId:", employeeId);
          throw new Error("Employee data not found");
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
        });

        if (employeeData.lastLocation?.latitude && employeeData.lastLocation?.longitude) {
          const latLng: LatLngTuple = [employeeData.lastLocation.latitude, employeeData.lastLocation.longitude];
          setCurrentLocation(latLng);
          setCenter(latLng);
          console.log("Map: Set initial location:", latLng);
        } else {
          console.log("Map: No last location available");
          setError("No recent location data available for this employee");
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
            }))
            .slice(-50);
          setMovementHistory(history);
          console.log("Map: Movement history loaded:", history.length, "points");
        } else {
          console.log("Map: No location history available");
          setMovementHistory([]);
        }
      } catch (err: any) {
        console.error("Map: Error fetching employee data:", {
          message: err.message,
          status: err.status,
        });
        if (err.message.includes("404")) {
          setError(`Employee not found for Employee ID: ${employeeId}`);
          toast.error(`Employee not found for Employee ID: ${employeeId}`);
        } else {
          setError(err.message || "Failed to load employee data");
          toast.error(err.message || "Failed to load employee data");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchEmployeeData();
  }, [employeeId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !socket || !employeeId) {
      if (!isAuthenticated) {
        console.log("Map: User not authenticated");
        setConnectionStatus("Not authenticated");
        setError("User not authenticated");
      } else if (!socket) {
        console.log("Map: WebSocket not available");
        setConnectionStatus("WebSocket not available");
        setError("WebSocket connection not available");
      } else if (!employeeId) {
        console.log("Map: No employee ID provided");
        setConnectionStatus("No employee ID");
        setError("No employee ID provided");
      }
      return;
    }

    if (!socket.connected) {
      console.log("Map: WebSocket not connected, attempting to connect");
      setConnectionStatus("WebSocket disconnected");
      setError("WebSocket not connected, retrying...");
      socket.connect();
      return;
    }

    console.log("Map: Setting up WebSocket listeners for employeeId:", employeeId);
    setConnectionStatus("Connected");
    setError(null);

    // Map employeeId to userId for WebSocket
    const fetchUserId = async () => {
      const employee = await db.employee.findUnique({
        where: { id: employeeId },
        select: { userId: true },
      });
      return employee?.userId;
    };

    fetchUserId().then((userId) => {
      if (!userId) {
        console.error("Map: No userId found for employeeId:", employeeId);
        setError("No user associated with this employee");
        return;
      }

      socket.emit("join", `user_${userId}`);
      console.log("Map: Joined room user_", userId);

      const handleLocationUpdate = (data: any) => {
        console.log("Map: Received locationUpdate:", data);
        const { userId: updateUserId, latitude, longitude, accuracy, timestamp, address } = data;

        if (updateUserId === userId && latitude != null && longitude != null) {
          const latLng: LatLngTuple = [latitude, longitude];
          const newLocation: LocationData = { latitude, longitude, timestamp, accuracy, address };

          setCurrentLocation(latLng);
          setMovementHistory((prev) => [...prev, newLocation].slice(-50));
          setEmployee((prev) =>
            prev
              ? {
                  ...prev,
                  isOnline: true,
                  lastSeen: timestamp,
                  lastLocation: { latitude, longitude, timestamp, address },
                }
              : prev,
          );
          setCenter(latLng);

          if (mapRef.current) {
            mapRef.current.panTo(latLng);
            mapRef.current.invalidateSize();
          }

          toast.success(`Location updated at ${new Date(timestamp).toLocaleTimeString()}`);
        }
      };

      const handleUserStatusUpdate = (data: any) => {
        console.log("Map: Received userStatusUpdate:", data);
        const { userId: updateUserId, isOnline, lastSeen } = data;

        if (updateUserId === userId) {
          setEmployee((prev) => {
            if (!prev) return prev;
            const isRecentlyActive = lastSeen && (new Date().getTime() - new Date(lastSeen).getTime()) < 60000;
            return { ...prev, isOnline: isOnline && isRecentlyActive, lastSeen };
          });
        }
      };

      const handleLocationError = ({ error }: { error: string }) => {
        console.error("Map: Location error from server:", error);
        setError(error);
        toast.error(error);
      };

      socket.on("locationUpdate", handleLocationUpdate);
      socket.on(`locationUpdated:${userId}`, handleLocationUpdate);
      socket.on("userStatusUpdate", handleUserStatusUpdate);
      socket.on("locationError", handleLocationError);

      return () => {
        console.log("Map: Cleaning up WebSocket listeners");
        socket.off("locationUpdate", handleLocationUpdate);
        socket.off(`locationUpdated:${userId}`, handleLocationUpdate);
        socket.off("userStatusUpdate", handleUserStatusUpdate);
        socket.off("locationError", handleLocationError);
      };
    });
  }, [employeeId, socket, isAuthenticated, socket?.connected]);

  useEffect(() => {
    if (!isAuthenticated || !socket || !socket.connected || !employeeId) return;

    const sendLocationUpdate = async () => {
      const employee = await db.employee.findUnique({
        where: { id: employeeId },
        select: { userId: true },
      });
      const userId = employee?.userId;

      if (!userId) {
        console.error("Map: No userId found for employeeId:", employeeId);
        setError("No user associated with this employee");
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log("Map: Emitting locationUpdate:", { userId, latitude, longitude, accuracy });
            socket.emit("locationUpdate", {
              userId,
              latitude,
              longitude,
              source: "gps",
              accuracy,
            });
          },
          (error) => {
            console.error("Map: Geolocation error:", error.message);
            setError("Failed to get location");
            toast.error("Failed to get location");
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      } else {
        setError("Geolocation not supported");
        toast.error("Geolocation not supported");
      }
    };

    sendLocationUpdate();
    const interval = setInterval(sendLocationUpdate, 60000);

    return () => clearInterval(interval);
  }, [employeeId, socket, isAuthenticated, socket?.connected]);

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
            <p className="text-red-400 text-xl mb-4">{error || "Employee not found"}</p>
            <p className="text-gray-400 mb-4">Employee ID: {employeeId || "Not provided"}</p>
            <button
              onClick={() => router.push("/dashboard/employees/employee-list")}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
            >
              Go Back to Employee List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push("/dashboard/employees/employee-list")}
            className="mr-4 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors duration-200"
          >
            <ArrowLeft className="text-white" size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Employee Location Tracking</h1>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <User className="text-gray-400" size={40} />
              <div>
                <h2 className="text-xl font-semibold text-white">{employee.name}</h2>
                <p className="text-gray-400">{employee.email}</p>
                <p className="text-gray-400">{employee.position}</p>
                {employee.department && <p className="text-gray-400">Department: {employee.department}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {employee.isOnline ? (
                <CheckCircle className="text-green-400" size={24} />
              ) : (
                <AlertCircle className="text-red-400" size={24} />
              )}
              <p className="text-gray-400">{employee.isOnline ? "Online" : "Offline"}</p>
            </div>
          </div>
          {employee.lastSeen && (
            <p className="text-gray-400 mt-2 flex items-center">
              <Clock className="mr-2" size={16} />
              Last seen: {new Date(employee.lastSeen).toLocaleString()}
            </p>
          )}
          <div className="flex items-center mt-2">
            {connectionStatus === "Connected" ? (
              <Wifi className="text-green-400 mr-2" size={16} />
            ) : (
              <WifiOff className="text-red-400 mr-2" size={16} />
            )}
            <p className="text-gray-400">WebSocket: {connectionStatus}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-400 p-4 rounded-lg mb-6 flex items-center">
            <AlertCircle className="mr-2" size={24} />
            {error}
          </div>
        )}

        <div className="bg-slate-800 rounded-lg overflow-hidden h-[500px]">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
            className="leaflet-container"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {currentLocation && (
              <Marker position={currentLocation} icon={currentLocationIcon}>
                <Popup>
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p>
                      Last seen: {employee.lastLocation?.timestamp ? new Date(employee.lastLocation.timestamp).toLocaleString() : "Unknown"}
                    </p>
                    {employee.lastLocation?.address && <p>Address: {employee.lastLocation.address}</p>}
                  </div>
                </Popup>
              </Marker>
            )}
            {movementHistory.length > 0 && (
              <>
                <Polyline
                  positions={movementHistory.map((loc) => [loc.latitude, loc.longitude] as LatLngTuple)}
                  color="#9333dc"
                  weight={4}
                />
                {movementHistory.map((loc, index) => (
                  <Marker
                    key={index}
                    position={[loc.latitude, loc.longitude]}
                    icon={historyIcon}
                  >
                    <Popup>
                      <div>
                        <p>Timestamp: {new Date(loc.timestamp).toLocaleString()}</p>
                        {loc.address && <p>Address: {loc.address}</p>}
                        {loc.accuracy && <p>Accuracy: {loc.accuracy}m</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default IndividualEmployeeMapPage;