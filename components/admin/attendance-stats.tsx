"use client";
import { useState, useEffect } from "react";
import { Clock, Users, CheckCircle, Timer, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminDashboardStats } from '@/actions/dashboard';
import { errorHandlers } from '@/errorHandler';

interface StatsData {
  totalEmployees: number;
  presentToday: number;
  lateArrivals: number;
  notClockedIn: number;
  attendanceRate: string;
  attendanceGrowth: number;
}

export default function AttendanceStats() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statsData, setStatsData] = useState<StatsData | null>(null);
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
        fetchStats(); // Retry when back online
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
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getAdminDashboardStats();
      setStatsData(result.data);
      setRetryCount(0); // Reset retry count on success
      
      // Show success toast only after retry
      if (retryCount > 0) {
        toast.success('Dashboard data loaded successfully!');
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      
      // ✅ Use error handler for user-friendly messages
      const friendlyError = errorHandlers.auth(err, false);
      setError(friendlyError);
      
      // ✅ Show appropriate toast based on error type
      if (err.message.includes('session') || err.message.includes('log in')) {
        toast.error('Your session has expired. Please log in again.');
      } else if (err.message.includes('connection') || err.message.includes('network')) {
        toast.error('Connection issue. Please check your internet.');
      } else if (err.message.includes('Access denied')) {
        toast.error('Access denied. Administrator privileges required.');
      } else {
        toast.error('Failed to load dashboard data. Please try again.');
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
    
    fetchStats();
  };

  const getStatsCards = () => {
    if (!statsData) return [];
    
    return [
      {
        title: "Total Employees",
        icon: <Users size={24} />,
        value: statsData.totalEmployees,
        subtitle: "Registered",
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600"
      },
      {
        title: "Present Today",
        icon: <CheckCircle size={24} />,
        value: statsData.presentToday,
        subtitle: `${statsData.attendanceRate}% attendance rate`,
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-50",
        textColor: "text-green-600"
      },
      {
        title: "Late Arrivals",
        icon: <Timer size={24} />,
        value: statsData.lateArrivals,
        subtitle: "After 9:00 AM",
        color: "from-orange-500 to-orange-600",
        bgColor: "bg-orange-50",
        textColor: "text-orange-600"
      },
      {
        title: "Not Clocked In",
        icon: <Clock size={24} />,
        value: statsData.notClockedIn,
        subtitle: "No record yet",
        color: "from-gray-500 to-gray-600",
        bgColor: "bg-gray-50",
        textColor: "text-gray-600"
      },
    ];
  };

  // ✅ Enhanced loading state
  if (loading && !statsData) {
    return (
      <div className="mb-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ Enhanced error state
  if (error && !statsData) {
    return (
      <div className="mb-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {!isOnline ? (
                <WifiOff className="h-12 w-12 text-gray-400" />
              ) : error.includes('Access denied') ? (
                <AlertCircle className="h-12 w-12 text-red-500" />
              ) : (
                <RefreshCw className="h-12 w-12 text-orange-500" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {!isOnline ? 'No Internet Connection' : 
               error.includes('Access denied') ? 'Access Denied' : 
               'Unable to Load Dashboard'}
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

  const cards = getStatsCards();

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Current Time</h2>
            <p className="text-sm text-gray-600">Track attendance for today</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRetry}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-right text-red-900">
              <div className="text-2xl font-bold text-red-900">
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, index) => (
          <div
            key={index}
            className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-700 hover:shadow-md transform hover:-translate-y-1 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{
              transitionDelay: `${index * 100}ms`,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <div className={stat.textColor}>
                  {stat.icon}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
              </div>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>

            {/* Progress bar for visual appeal */}
            <div className="mt-4">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000`}
                  style={{
                    width: isVisible ? `${Math.min((stat.value / (statsData?.totalEmployees || 1)) * 100, 100)}%` : "0%",
                    transitionDelay: `${(index * 100) + 500}ms`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Growth indicator */}
      {statsData && statsData.attendanceGrowth !== 0 && (
        <div className="mt-4 text-center">
          <span className={`text-sm font-medium ${
            statsData.attendanceGrowth > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {statsData.attendanceGrowth > 0 ? '+' : ''}{statsData.attendanceGrowth}% vs yesterday
          </span>
        </div>
      )}
    </div>
  );
}
