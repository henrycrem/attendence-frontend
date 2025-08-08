"use client";
import { useState, useEffect } from "react";
import { Clock, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { getHourlyAttendanceFlow, getUserRole } from '@/actions/dashboard';

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
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

  // ✅ Check if user has access to this component
  const checkUserAccess = async () => {
    try {
      const roleResponse = await getUserRole();
      if (roleResponse.success) {
        const { role, isAdmin } = roleResponse.data;
        setUserRole(role);
        setHasAccess(isAdmin);
        
        if (!isAdmin) {
          setError("Access denied. Admin privileges required to view attendance flow.");
        }
      }
    } catch (err: any) {
      console.error('Failed to check user role:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Use server action instead of direct API call
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
      } else {
        throw new Error('Failed to fetch hourly data');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch hourly data:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(...attendanceData.map(d => Math.max(d.clockIns, d.clockOuts)), 1);

  // ✅ Show access denied message for non-admin users
  if (!loading && !hasAccess) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You need administrator privileges to view attendance flow charts.
          </p>
          <p className="text-sm text-gray-500">
            Current role: <span className="font-medium">{userRole || 'Unknown'}</span>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
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

  if (error) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading chart data: {error}</p>
          <button 
            onClick={fetchHourlyData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
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
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
          </select>
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
