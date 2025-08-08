"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle, Timer, MapPin } from 'lucide-react';
import { getEmployeeAttendanceData } from '@/actions/dashboard';

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
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
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same...
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

  if (loading) {
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

  if (error) {
    return (
      <div className="mb-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600">Error loading attendance data: {error}</p>
          <button 
            onClick={fetchAttendanceData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!attendanceData) return null;

  return (
    <div className="mb-8">
      {/* Current Time Display */}
      <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">My Attendance</h2>
            <p className="text-sm text-gray-600">Track your daily attendance</p>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
