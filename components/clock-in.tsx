"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { MapPin, Wifi, QrCode, Navigation, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";

import { checkIn, checkOut, getWorkplaces, getEmployeeDetails } from "@/actions/attendence";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
// @ts-ignore
import { BrowserQRCodeReader } from '@zxing/library';

const ClockInForm = () => {
  const { user, token, socket, isAuthenticated } = useAuth();
  const [attendance, setAttendance] = useState<any>(null);
  const [workplaces, setWorkplaces] = useState<{ id: string; name: string }[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"gps" | "qr" | "manual" | "ip">("gps");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [checkInTime, setCheckInTime] = useState<string>("");
  const [checkOutTime, setCheckOutTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [showTimeInput, setShowTimeInput] = useState<"check-in" | "check-out" | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Debug toasts
  const debugToast = (type: string, message: string) => {
    console.log(`Toast triggered: ${type} - ${message}`);
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    }
  };

  // Fetch employee details and today's attendance
  useEffect(() => {
    async function fetchData() {
      try {
        console.log("fetchData: Fetching employee details and workplaces");
        const [employeeResponse, workplacesResponse] = await Promise.all([
          getEmployeeDetails(user.id),
          getWorkplaces(),
        ]);
        setEmployeeDetails(employeeResponse.data);
        setWorkplaces(workplacesResponse.data);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAttendance = employeeResponse.data.attendance.find(
          (att: any) => new Date(att.date).toDateString() === today.toDateString()
        );
        setAttendance(todayAttendance || null);
        console.log("fetchData: Success, attendance:", todayAttendance);
      } catch (err: any) {
        console.error("fetchData: Error:", err.message);
        setError(err.message);
        debugToast("error", err.message);
      }
    }
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  // Handle WebSocket location updates
  useEffect(() => {
    if (!isAuthenticated || !socket) {
      console.log("Attendance: WebSocket not connected, isAuthenticated:", isAuthenticated);
      setError("WebSocket not connected");
      debugToast("error", "WebSocket not connected");
      return;
    }

    console.log("Attendance: Setting up geolocation and WebSocket listeners");
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      setLocationPermission(result.state);
      if (result.state === "denied") {
        console.log("Attendance: Location permission denied, emitting null location");
        socket.emit("locationUpdate", { userId: user.id, latitude: null, longitude: null, source: "gps" });
      }
    });

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log("WebSocket: Sending location update:", { latitude, longitude, accuracy });
          socket.emit("locationUpdate", { userId: user.id, latitude, longitude, source: "gps", accuracy });
          setLocationPermission("granted");
        },
        (error) => {
          console.error("Attendance: Geolocation error:", error);
          socket.emit("locationUpdate", { userId: user.id, latitude: null, longitude: null, source: "gps" });
          setLocationPermission("denied");
        },
        { enableHighAccuracy: true, timeout: 50000, maximumAge: 0 }
      );

      socket.on("locationError", ({ error }) => {
        console.error("Attendance: Location error from server:", error);
        setError(error);
        debugToast("error", error);
      });

      return () => {
        console.log("Attendance: Cleaning up geolocation and WebSocket listeners");
        navigator.geolocation.clearWatch(watchId);
        socket.off("locationError");
      };
    }
  }, [user?.id, socket, isAuthenticated]);

  // Handle QR scanning
  useEffect(() => {
    if (scanning && videoRef.current && isAuthenticated && socket) {
      console.log("Attendance: Starting QR scanner");
      const codeReader = new BrowserQRCodeReader();
      codeReader
        .decodeFromVideoDevice(null, videoRef.current, (result, error) => {
          if (result) {
            console.log("Attendance: QR code scanned:", result.getText());
            setSelectedLocation(result.getText());
            const action = buttonStates.canCheckIn ? handleCheckIn : buttonStates.canCheckOut ? handleCheckOut : null;
            if (action) action();
          }
          if (error) {
            console.error("Attendance: QR scan failed:", error);
            setError("QR scan failed");
            debugToast("error", "QR scan failed");
          }
        })
        .catch((err) => {
          console.error("Attendance: Failed to start QR scanner:", err);
          setError("Failed to start QR scanner");
          debugToast("error", "Failed to start QR scanner");
        });
      return () => {
        console.log("Attendance: Resetting QR scanner");
        codeReader.reset();
      };
    }
  }, [scanning, isAuthenticated, socket]);

  // Determine button states
  const getButtonStates = () => {
    if (!attendance) {
      return { canCheckIn: true, canCheckOut: false, isCompleted: false };
    }
    if (attendance.status === "SIGNED_IN") {
      return { canCheckIn: false, canCheckOut: true, isCompleted: false };
    }
    if (attendance.status === "SIGNED_OUT") {
      return { canCheckIn: false, canCheckOut: false, isCompleted: true };
    }
    return { canCheckIn: true, canCheckOut: false, isCompleted: false };
  };

  const buttonStates = getButtonStates();

  // Get current location
  const getCurrentLocation = () => {
    return new Promise<{ latitude: number; longitude: number; accuracy: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        console.error("getCurrentLocation: Geolocation not supported");
        reject(new Error("Geolocation is not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          console.log("getCurrentLocation:", location);
          resolve(location);
        },
        (error) => {
          console.error("getCurrentLocation: Error:", error);
          setLocationPermission("denied");
          debugToast("error", error.message);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 50000, maximumAge: 0 }
      );
    });
  };

  // Get IP location
  const getIPLocation = async () => {
    try {
      console.log("getIPLocation: Fetching IP location");
      const response = await axios.get("https://ipapi.co/json/", { timeout: 100000 });
      console.log("getIPLocation:", response.data);
      return { ipAddress: response.data.ip, latitude: response.data.latitude, longitude: response.data.longitude };
    } catch (error) {
      console.error("Attendance: Failed to fetch IP location:", error);
      debugToast("error", "Failed to fetch IP location");
      throw new Error("Failed to fetch IP location");
    }
  };

  // Handle check-in
  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      console.log("handleCheckIn: Starting with method:", selectedMethod);
      let params: any = { userId: user.id, method: selectedMethod, timestamp: checkInTime || new Date().toISOString() };
      if (selectedMethod === "gps") {
        const location = await getCurrentLocation();
        params = { ...params, latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy };
      } else if (selectedMethod === "qr" || selectedMethod === "manual") {
        if (!selectedLocation) {
          console.error("handleCheckIn: Missing workplace location");
          throw new Error("Please select a workplace location");
        }
        params = { ...params, locationId: selectedLocation };
      } else if (selectedMethod === "ip") {
        const ipLocation = await getIPLocation();
        params = { ...params, ipAddress: ipLocation.ipAddress, latitude: ipLocation.latitude, longitude: ipLocation.longitude };
      }
      console.log("handleCheckIn: Sending params:", params);
      const result = await checkIn(params);
      console.log("handleCheckIn: Result:", result);
      debugToast("success", result.message);
      setMessage(result.message);
      setAttendance(result.data);
      setShowTimeInput(null);
    } catch (err: any) {
      console.error("handleCheckIn: Error:", err.message);
      setError(err.message);
      debugToast("error", err.message);
    } finally {
      setLoading(false);
      setScanning(false);
      console.log("handleCheckIn: Completed");
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      console.log("handleCheckOut: Starting with method:", selectedMethod);
      let params: any = { userId: user.id, method: selectedMethod, timestamp: checkOutTime || new Date().toISOString() };
      if (selectedMethod === "gps") {
        const location = await getCurrentLocation();
        params = { ...params, latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy };
      } else if (selectedMethod === "qr" || selectedMethod === "manual") {
        if (!selectedLocation) {
          console.error("handleCheckOut: Missing workplace location");
          throw new Error("Please select a workplace location");
        }
        params = { ...params, locationId: selectedLocation };
      } else if (selectedMethod === "ip") {
        const ipLocation = await getIPLocation();
        params = { ...params, ipAddress: ipLocation.ipAddress, latitude: ipLocation.latitude, longitude: ipLocation.longitude };
      }
      console.log("handleCheckOut: Sending params:", params);
      const result = await checkOut(params);
      console.log("handleCheckOut: Result:", result);
      debugToast("success", result.message);
      setMessage(result.message);
      setAttendance(result.data);
      setShowTimeInput(null);
    } catch (err: any) {
      console.error("handleCheckOut: Error:", err.message);
      setError(err.message);
      debugToast("error", err.message);
    } finally {
      setLoading(false);
      setScanning(false);
      console.log("handleCheckOut: Completed");
    }
  };

  // Format time and date
  const formatTime = (dateString?: string) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Today";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get last updated time
  const getLastUpdated = () => {
    if (attendance?.updatedAt) {
      return formatTime(attendance.updatedAt);
    }
    return formatTime(employeeDetails?.user.lastStatusUpdate);
  };

  // Handle Check In button click
  const handleCheckInClick = () => {
    const now = new Date();
    setCheckInTime(now.toISOString());
    setShowTimeInput("check-in");
    console.log("handleCheckInClick: Set check-in time:", now.toISOString());
  };

  // Handle Check Out button click
  const handleCheckOutClick = () => {
    const now = new Date();
    setCheckOutTime(now.toISOString());
    setShowTimeInput("check-out");
    console.log("handleCheckOutClick: Set check-out time:", now.toISOString());
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Toaster position="top-right" toastOptions={{ duration: 5000, style: { background: '#1e293b', color: '#e5e7eb', border: '1px solid #475569' } }} />
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-200 mb-2">Employee Attendance</h1>
          <p className="text-gray-400 text-lg">{formatDate(new Date().toISOString())}</p>
        </div>

        {/* User Info Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-slate-700/50">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {employeeDetails?.user.name?.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-200">{employeeDetails?.user.name}</h2>
              <p className="text-gray-400">{employeeDetails?.user.email}</p>
              <p className="text-gray-400">{employeeDetails?.user.department?.name || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  socket?.connected ? "bg-green-400" : "bg-gray-400"
                }`}
              ></div>
              <span className="text-gray-400 capitalize">{socket?.connected ? "online" : "offline"}</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Last Updated</p>
              <p className="text-gray-200">{getLastUpdated()}</p>
            </div>
          </div>
        </div>

        {/* Today's Status */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
            <Calendar className="mr-2 text-red-500" size={20} />
            Today's Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Check-in</span>
                {attendance?.signInTime ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : (
                  <XCircle className="text-gray-400" size={20} />
                )}
              </div>
              <p className="text-gray-200 text-xl font-semibold">{formatTime(attendance?.signInTime)}</p>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Check-out</span>
                {attendance?.signOutTime ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : (
                  <XCircle className="text-gray-400" size={20} />
                )}
              </div>
              <p className="text-gray-200 text-xl font-semibold">{formatTime(attendance?.signOutTime)}</p>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Status</span>
                {buttonStates.isCompleted ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : (
                  <AlertCircle className="text-yellow-400" size={20} />
                )}
              </div>
              <p className="text-gray-200 text-lg font-semibold">
                {buttonStates.isCompleted
                  ? "Completed"
                  : attendance?.status === "SIGNED_IN"
                  ? "Checked In"
                  : "Not Started"}
              </p>
            </div>
          </div>
        </div>

        {/* Check-in/Check-out Methods */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Select Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { id: "gps", icon: Navigation, label: "GPS Location", disabled: locationPermission === "denied" },
              { id: "qr", icon: QrCode, label: "QR Code", disabled: workplaces.length === 0 },
              { id: "manual", icon: MapPin, label: "Manual", disabled: workplaces.length === 0 },
              { id: "ip", icon: Wifi, label: "IP Location", disabled: false },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  setSelectedMethod(method.id as any);
                  if (method.id === "qr") setScanning(true);
                  console.log("Selected method:", method.id);
                }}
                disabled={method.disabled}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedMethod === method.id
                    ? "border-red-500 bg-red-500/20 text-gray-200"
                    : method.disabled
                    ? "border-slate-600 bg-slate-600/10 text-gray-500 cursor-not-allowed"
                    : "border-slate-700/50 bg-slate-900/50 text-gray-400 hover:border-red-500/50"
                }`}
              >
                <method.icon className="mx-auto mb-2 text-red-500" size={24} />
                <p className="text-sm font-medium">{method.label}</p>
              </button>
            ))}
          </div>

          {/* QR Scanner */}
          {selectedMethod === "qr" && scanning && (
            <div className="mb-6">
              <video
                ref={videoRef}
                style={{ width: "100%", maxHeight: 300 }}
                className="rounded-xl"
              />
              <button
                onClick={() => setScanning(false)}
                className="mt-2 bg-slate-700 text-gray-200 px-4 py-2 rounded-lg hover:bg-slate-600"
              >
                Cancel Scan
              </button>
            </div>
          )}

          {/* Location Selection for QR/Manual */}
          {(selectedMethod === "qr" || selectedMethod === "manual") && !scanning && (
            <div className="mb-6">
              <label className="block text-gray-200 mb-2">Select Workplace</label>
              {workplaces.length === 0 ? (
                <p className="text-yellow-400">No workplaces available. Please use GPS or IP method.</p>
              ) : (
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-gray-200 backdrop-blur-lg focus:outline-none focus:border-red-500"
                >
                  <option value="">Choose a workplace...</option>
                  {workplaces.map((workplace) => (
                    <option key={workplace.id} value={workplace.id} className="bg-slate-900">
                      {workplace.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Check-In Time Input */}
          {showTimeInput === "check-in" && buttonStates.canCheckIn && (
            <div className="mb-6">
              <label className="block text-gray-200 mb-2">Check-In Time</label>
              <input
                type="datetime-local"
                value={checkInTime.slice(0, 16)}
                readOnly
                className="w-full p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-gray-200 backdrop-blur-lg"
              />
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className={`mt-4 w-full p-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  !loading
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-400/50"
                    : "bg-slate-600/50 text-gray-400 cursor-not-allowed border border-slate-600/50"
                }`}
              >
                Confirm Check-In
              </button>
            </div>
          )}

          {/* Check-Out Time Input */}
          {showTimeInput === "check-out" && buttonStates.canCheckOut && (
            <div className="mb-6">
              <label className="block text-gray-200 mb-2">Check-Out Time</label>
              <input
                type="datetime-local"
                value={checkOutTime.slice(0, 16)}
                readOnly
                className="w-full p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-gray-200 backdrop-blur-lg"
              />
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className={`mt-4 w-full p-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  !loading
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-400/50"
                    : "bg-slate-600/50 text-gray-400 cursor-not-allowed border border-slate-600/50"
                }`}
              >
                Confirm Check-Out
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!showTimeInput && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={handleCheckInClick}
              disabled={!buttonStates.canCheckIn || loading}
              className={`relative p-6 rounded-3xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                buttonStates.canCheckIn && !loading
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-400/50"
                  : "bg-slate-600/50 text-gray-400 cursor-not-allowed border border-slate-600/50"
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-gray-200/30 border-t-gray-200 rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={24} />
                )}
                <span>Check In</span>
              </div>
            </button>
            <button
              onClick={handleCheckOutClick}
              disabled={!buttonStates.canCheckOut || loading}
              className={`relative p-6 rounded-3xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                buttonStates.canCheckOut && !loading
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-400/50"
                  : "bg-slate-600/50 text-gray-400 cursor-not-allowed border border-slate-600/50"
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-gray-200/30 border-t-gray-200 rounded-full animate-spin" />
                ) : (
                  <XCircle size={24} />
                )}
                <span>Check Out</span>
              </div>
            </button>
          </div>
        )}

        {/* Status Messages */}
        {message && (
          <div className="mt-8 bg-green-500/20 border border-green-400/50 rounded-2xl p-4 text-center">
            <CheckCircle className="mx-auto mb-2 text-green-400" size={32} />
            <p className="text-green-400 font-medium">{message}</p>
          </div>
        )}
        {error && (
          <div className="mt-8 bg-red-500/20 border border-red-400/50 rounded-2xl p-4 text-center">
            <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}
        {buttonStates.isCompleted && (
          <div className="mt-8 bg-green-500/20 border border-green-400/50 rounded-2xl p-4 text-center">
            <CheckCircle className="mx-auto mb-2 text-green-400" size={32} />
            <p className="text-green-400 font-medium">Attendance completed for today. See you tomorrow!</p>
          </div>
        )}
        {locationPermission === "denied" && selectedMethod === "gps" && (
          <div className="mt-8 bg-red-500/20 border border-red-400/50 rounded-2xl p-4 text-center">
            <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
            <p className="text-red-400 font-medium">
              Location access denied. Please enable location services or choose a different method.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockInForm;