"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "apps/user-ui/src/contexts/AuthContext";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { getEmployeeDetails } from "apps/user-ui/src/actions/attendence";

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const MapPage = () => {
  const { user, socket, isAuthenticated } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LatLngTuple | null>(null);
  const [movementHistory, setMovementHistory] = useState<LatLngTuple[]>([]);
  const [center, setCenter] = useState<LatLngTuple>([0, 0]);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Fetch initial location and movement history
  useEffect(() => {
    async function fetchInitialData() {
      try {
        console.log("Map: Fetching employee details for userId:", user.id);
        const response = await getEmployeeDetails(user.id);
        const { lastLocation, locations } = response.data;

        // Set initial center and current location
        if (lastLocation?.latitude && lastLocation?.longitude) {
          const latLng: LatLngTuple = [lastLocation.latitude, lastLocation.longitude];
          setCurrentLocation(latLng);
          setCenter(latLng);
        } else {
          console.log("Map: No last location, defaulting to [0, 0]");
          setCenter([0, 0]);
        }

        // Set movement history
        const history = locations
          .filter((loc: any) => loc.latitude != null && loc.longitude != null)
          .map((loc: any) => [loc.latitude, loc.longitude] as LatLngTuple);
        setMovementHistory(history);
        console.log("Map: Movement history loaded:", history);
      } catch (err: any) {
        console.error("Map: Error fetching initial data:", err.message);
        setError(err.message);
        toast.error(err.message);
      }
    }

    if (user?.id && isAuthenticated) {
      fetchInitialData();
    }
  }, [user?.id, isAuthenticated]);

  // Handle WebSocket location updates
  useEffect(() => {
    if (!isAuthenticated || !socket) {
      console.log("Map: WebSocket not connected, isAuthenticated:", isAuthenticated);
      setError("WebSocket not connected");
      toast.error("WebSocket not connected");
      return;
    }

    console.log("Map: Setting up WebSocket listeners");
    socket.on("locationUpdated", (data) => {
      console.log("Map: Received locationUpdated:", data);
      const { userId, latitude, longitude, accuracy, timestamp } = data;

      if (userId === user.id && latitude != null && longitude != null) {
        const latLng: LatLngTuple = [latitude, longitude];
        setCurrentLocation(latLng);
        setMovementHistory((prev) => [...prev, latLng].slice(-50)); // Keep last 50 points
        setCenter(latLng);
        if (mapRef.current) {
          mapRef.current.panTo(latLng);
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
      socket.off("locationUpdated");
      socket.off("locationError");
    };
  }, [user?.id, socket, isAuthenticated]);

  // Handle map initialization
  const handleMapCreated = (map: L.Map) => {
    mapRef.current = map;
    if (currentLocation) {
      map.panTo(currentLocation);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Toaster position="top-right" toastOptions={{ duration: 5000, style: { background: '#1e293b', color: '#e5e7eb', border: '1px solid #475569' } }} />
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-200 mb-2">Location Tracking</h1>
          <p className="text-gray-400 text-lg">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        {/* Map Container */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
            <MapPin className="mr-2 text-red-500" size={20} />
            User Location Map
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
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {currentLocation && (
                <Marker position={currentLocation} icon={customIcon}>
                  <Popup>
                    Current Location<br />
                    Lat: {currentLocation[0].toFixed(6)}<br />
                    Lng: {currentLocation[1].toFixed(6)}<br />
                    Updated: {new Date().toLocaleTimeString()}
                  </Popup>
                </Marker>
              )}
              {movementHistory.length > 1 && (
                <Polyline
                  positions={movementHistory}
                  color="red"
                  weight={4}
                  opacity={0.7}
                />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Status Messages */}
        {currentLocation && (
          <div className="mt-8 bg-green-500/20 border border-green-400/50 rounded-2xl p-4 text-center">
            <CheckCircle className="mx-auto mb-2 text-green-400" size={32} />
            <p className="text-green-400 font-medium">Tracking location for {user?.name || "User"}</p>
          </div>
        )}
        {error && (
          <div className="mt-8 bg-red-500/20 border border-red-400/50 rounded-2xl p-4 text-center">
            <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;