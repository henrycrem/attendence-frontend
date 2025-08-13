"use client";
import { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle, Timer, MapPin, RefreshCw, AlertCircle, WifiOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { getEmployeeAttendanceData } from '@/actions/dashboard';
import { errorHandlers } from '@/errorHandler';
import Link from 'next/link';

interface AttendanceData {
  today: {
    status: string;
    clockIn: string | null;
    clockOut: string | null;
    hoursWorked: string;
    location: string | null;
  };
  monthly: {
    totalWorkingDays: number;
    presentDays: number;
    completedDays: number;
    attendanceRate: number;
    totalHoursWorked: number;
  };
}

export default function AttendanceSummaryCard() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // ✅ Monitor online status
    const handleOnline = () => {
      setIsOnline(true);
      if (error && error.includes('connection')) {
        fetchAttendanceData(); // Retry when back online
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getEmployeeAttendanceData();
      setAttendanceData(result.data);
      setRetryCount(0); // Reset retry count on success
      
      // Show success toast only after retry
      if (retryCount > 0) {
        toast.success('Attendance data loaded successfully!');
      }
    } catch (err: any) {
      console.error('Failed to fetch attendance data:', err);
      
      // ✅ Use error handler for user-friendly messages
      const friendlyError = errorHandlers.auth(err, false);
      setError(friendlyError);
      
      // Show appropriate toast based on error type
      if (err.message.includes('session') || err.message.includes('log in')) {
        toast.error('Your session has expired. Please log in again.');
      } else if (err.message.includes('connection') || err.message.includes('network')) {
        toast.error('Connection issue. Please check your internet.');
      } else if (err.message.includes('Access denied')) {
        toast.error('Access denied. Employee privileges required.');
      } else {
        toast.error('Failed to load attendance data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Enhanced retry with exponential backoff
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    // Add delay for retries to prevent spam
    if (retryCount > 0) {
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Max 5 seconds
      toast.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    fetchAttendanceData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Checked In':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Not Started':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get button text and style based on attendance status
  const getClockButtonProps = () => {
    if (!attendanceData) return { text: 'Clock In', className: 'bg-red-800 hover:bg-red-900' };
    
    const { status, clockIn, clockOut } = attendanceData.today;
    
    if (status === 'Completed') {
      return { 
        text: 'View Details', 
        className: 'bg-green-600 hover:bg-green-700' 
      };
    } else if (status === 'Checked In') {
      return { 
        text: 'Clock Out', 
        className: 'bg-orange-600 hover:bg-orange-700' 
      };
    } else {
      return { 
        text: 'Clock In', 
        className: 'bg-blue-600 hover:bg-blue-700' 
      };
    }
  };

  // ✅ Enhanced loading state
  if (loading && !attendanceData) {
    return (
      <div className="mb-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Enhanced error state
  if (error && !attendanceData) {
    return (
      <div className="mb-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {!isOnline ? (
                <WifiOff className="h-12 w-12 text-gray-400" />
              ) : (
                <AlertCircle className="h-12 w-12 text-orange-500" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {!isOnline ? 'No Internet Connection' : 'Unable to Load Attendance Data'}
            </h3>
            
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {error}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleRetry}
                disabled={loading || !isOnline}
                className="px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Retrying...' : 'Try Again'}</span>
              </button>
              
              {error.includes('session') && (
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Go to Login
                </button>
              )}
            </div>
            
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Retry attempt: {retryCount}
              </p>
            )}
            
            {!isOnline && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  You're currently offline. Please check your internet connection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!attendanceData) return null;

  const clockButtonProps = getClockButtonProps();

  return (
    <div className="mb-8">
      {/* Connection Status Indicator */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center space-x-2">
          <WifiOff className="w-4 h-4 text-orange-600" />
          <span className="text-sm text-orange-700">You're currently offline</span>
        </div>
      )}
      
      {/* Current Time Display */}
      <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">My Attendance</h2>
            <p className="text-sm text-gray-600">Track your daily attendance</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
            {/* Clock In/Out Button - Responsive */}
            <Link 
              href="/dashboard/attendance/clock-in"
              className={`${clockButtonProps.className} text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md transform hover:scale-[1.02] flex items-center justify-center space-x-2 w-full sm:w-auto min-w-[140px] group`}
            >
              <Clock className="w-4 h-4" />
              <span>{clockButtonProps.text}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAttendanceData}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
                <div className="text-sm text-gray-600">
                  {currentTime.toLocaleDateString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Today's Status</h3>
              <p className="text-sm text-gray-600">Your attendance for today</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full border text-sm font-medium ${getStatusColor(attendanceData.today.status)}`}>
            {attendanceData.today.status}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Clock In</span>
              <CheckCircle className={`${attendanceData.today.clockIn ? 'text-green-500' : 'text-gray-400'}`} size={16} />
            </div>
            <p className="text-xl font-semibold text-gray-800">
              {attendanceData.today.clockIn || '--:--'}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Clock Out</span>
              <CheckCircle className={`${attendanceData.today.clockOut ? 'text-green-500' : 'text-gray-400'}`} size={16} />
            </div>
            <p className="text-xl font-semibold text-gray-800">
              {attendanceData.today.clockOut || '--:--'}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Hours Worked</span>
              <Timer className="text-blue-500" size={16} />
            </div>
            <p className="text-xl font-semibold text-gray-800">
              {attendanceData.today.hoursWorked}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Location</span>
              <MapPin className="text-purple-500" size={16} />
            </div>
            <p className="text-sm font-medium text-gray-800 truncate" title={attendanceData.today.location || 'Not recorded'}>
              {attendanceData.today.location || 'Not recorded'}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`} style={{ transitionDelay: '200ms' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <Calendar className="text-green-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">This Month's Summary</h3>
            <p className="text-sm text-gray-600">Your attendance statistics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {attendanceData.monthly.totalWorkingDays}
            </div>
            <div className="text-sm text-gray-600">Working Days</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {attendanceData.monthly.presentDays}
            </div>
            <div className="text-sm text-gray-600">Present Days</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {attendanceData.monthly.attendanceRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {attendanceData.monthly.totalHoursWorked}h
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
        </div>
        
        {/* Progress bar for attendance rate */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Attendance Progress</span>
            <span>{attendanceData.monthly.attendanceRate.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000"
              style={{
                width: isVisible ? `${attendanceData.monthly.attendanceRate}%` : "0%",
                transitionDelay: '500ms'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}