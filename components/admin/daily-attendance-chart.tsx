"use client";
import { useState, useEffect } from "react";
import { Clock, TrendingUp, Calendar, AlertCircle, RefreshCw, WifiOff, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { getHourlyAttendanceFlow, getUserRole } from '@/actions/dashboard';
import { errorHandlers } from '@/errorHandler';

interface AttendanceData {
  time: string;
  clockIns: number;
  clockOuts: number;
}

export default function DailyAttendanceChart() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredData, setHoveredData] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("Today");
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    // ✅ Monitor online status
    const handleOnline = () => {
      setIsOnline(true);
      if (error && error.includes('connection')) {
        checkUserAccess(); // Retry when back online
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ Check user role first
  useEffect(() => {
    checkUserAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchHourlyData();
    }
  }, [activeFilter, hasAccess]);

  // ✅ Enhanced user access check
  const checkUserAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const roleResponse = await getUserRole();
      if (roleResponse.success) {
        const { role, isAdmin } = roleResponse.data;
        setUserRole(role);
        setHasAccess(isAdmin);
        
        if (!isAdmin) {
          setError("Access denied. Administrator privileges required to view attendance flow.");
        }
      }
    } catch (err: any) {
      console.error('Failed to check user role:', err);
      
      // ✅ Use error handler for user-friendly messages
      const friendlyError = errorHandlers.auth(err, false);
      setError(friendlyError);
      
      // Show appropriate toast
      if (err.message.includes('session') || err.message.includes('log in')) {
        toast.error('Your session has expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Enhanced fetch with better error handling
  const fetchHourlyData = async () => {
    if (!hasAccess) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let dateParam = '';
      
      if (activeFilter === 'Yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dateParam = yesterday.toISOString().split('T')[0];
      } else if (activeFilter === 'This Week') {
        // For now, just use today - you can implement week logic later
        dateParam = new Date().toISOString().split('T')[0];
      }

      const response = await getHourlyAttendanceFlow(dateParam || undefined);
      if (response.success) {
        setAttendanceData(response.data || []);
        setRetryCount(0); // Reset retry count on success
        
        // Show success toast only after retry
        if (retryCount > 0) {
          toast.success('Chart data loaded successfully!');
        }
      } else {
        throw new Error('Failed to fetch hourly data');
      }
    } catch (err: any) {
      console.error('Failed to fetch hourly data:', err);
      
      // ✅ Use error handler for user-friendly messages
      const friendlyError = errorHandlers.auth(err, false);
      setError(friendlyError);
      
      // Show appropriate toast based on error type
      if (err.message.includes('session') || err.message.includes('log in')) {
        toast.error('Your session has expired. Please log in again.');
      } else if (err.message.includes('connection') || err.message.includes('network')) {
        toast.error('Connection issue. Please check your internet.');
      } else if (err.message.includes('Access denied')) {
        toast.error('Access denied. Administrator privileges required.');
      } else {
        toast.error('Failed to load chart data. Please try again.');
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
    
    if (hasAccess) {
      fetchHourlyData();
    } else {
      checkUserAccess();
    }
  };

  const maxValue = Math.max(...attendanceData.map(d => Math.max(d.clockIns, d.clockOuts)), 1);

  // ✅ Enhanced access denied message
  if (!loading && !hasAccess && error) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {!isOnline ? (
              <WifiOff className="h-12 w-12 text-gray-400" />
            ) : error.includes('Access denied') ? (
              <Shield className="h-12 w-12 text-red-500" />
            ) : (
              <AlertCircle className="h-12 w-12 text-orange-500" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {!isOnline ? 'No Internet Connection' : 
             error.includes('Access denied') ? 'Access Denied' : 
             'Unable to Load Chart'}
          </h3>
          
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            {error}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={handleRetry}
              disabled={loading || !isOnline}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
          
          {userRole && (
            <p className="text-sm text-gray-500 mt-4">
              Current role: <span className="font-medium">{userRole}</span>
            </p>
          )}
          
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Retry attempt: {retryCount}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ✅ Enhanced loading state
  if (loading && attendanceData.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded mb-4"></div>
          <div className="flex justify-center space-x-8">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Enhanced error state
  if (error && attendanceData.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {!isOnline ? (
              <WifiOff className="h-12 w-12 text-gray-400" />
            ) : (
              <RefreshCw className="h-12 w-12 text-orange-500" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {!isOnline ? 'No Internet Connection' : 'Unable to Load Chart Data'}
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {error}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={handleRetry}
              disabled={loading || !isOnline}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
        </div>
      </div>
    );
  }

  const totalClockIns = attendanceData.reduce((sum, data) => sum + data.clockIns, 0);
  const totalClockOuts = attendanceData.reduce((sum, data) => sum + data.clockOuts, 0);
  const attendanceRate = totalClockIns > 0 ? ((totalClockOuts / totalClockIns) * 100).toFixed(1) : '0';

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6 transition-all duration-700 ${
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    }`}>
      {/* Connection Status Indicator */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center space-x-2">
          <WifiOff className="w-4 h-4 text-orange-600" />
          <span className="text-sm text-orange-700">You're currently offline</span>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Clock className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Daily Attendance Flow</h3>
            <p className="text-sm text-gray-600">Clock-in and clock-out patterns</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            disabled={loading}
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
          </select>
          
          <button
            onClick={fetchHourlyData}
            disabled={loading || !isOnline}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh chart"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-80 mb-6">
        <div className="absolute inset-0 flex items-end justify-between px-4">
          {attendanceData.map((data, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-2 flex-1"
              onMouseEnter={() => setHoveredData(index)}
              onMouseLeave={() => setHoveredData(null)}
            >
              {/* Tooltip */}
              {hoveredData === index && (
                <div className="absolute -top-20 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10">
                  <div className="text-center">
                    <div className="font-medium">{data.time}</div>
                    <div>Clock-ins: {data.clockIns}</div>
                    <div>Clock-outs: {data.clockOuts}</div>
                  </div>
                </div>
              )}
              
              {/* Bars */}
              <div className="flex items-end space-x-1 h-64">
                {/* Clock-in bar */}
                <div
                  className={`w-4 bg-gradient-to-t from-green-500 to-green-400 rounded-t-sm transition-all duration-1000 ${
                    hoveredData === index ? 'opacity-100 transform scale-110' : 'opacity-80'
                  }`}
                  style={{
                    height: isVisible ? `${(data.clockIns / maxValue) * 100}%` : '0%',
                    transitionDelay: `${index * 50}ms`
                  }}
                ></div>
                
                {/* Clock-out bar */}
                <div
                  className={`w-4 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-1000 ${
                    hoveredData === index ? 'opacity-100 transform scale-110' : 'opacity-80'
                  }`}
                  style={{
                    height: isVisible ? `${(data.clockOuts / maxValue) * 100}%` : '0%',
                    transitionDelay: `${(index * 50) + 200}ms`
                  }}
                ></div>
              </div>
              
              {/* Time label */}
              <span className={`text-xs text-gray-600 font-medium transition-colors duration-200 ${
                hoveredData === index ? 'text-gray-800' : ''
              }`}>
                {data.time}
              </span>
            </div>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-8">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-3 bg-gradient-to-t from-green-500 to-green-400 rounded-sm"></div>
          <span className="text-sm text-gray-600">Clock-ins</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded-sm"></div>
          <span className="text-sm text-gray-600">Clock-outs</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-800">{totalClockIns}</div>
            <div className="text-sm text-gray-600">Total Clock-ins</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{totalClockOuts}</div>
            <div className="text-sm text-gray-600">Total Clock-outs</div>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-lg font-semibold text-green-600">{attendanceRate}%</span>
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
