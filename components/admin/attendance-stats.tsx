"use client";

import { useState, useEffect } from "react";
import { Clock, Users, CheckCircle, Timer } from 'lucide-react';
import { getAdminDashboardStats } from '@/actions/dashboard';

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
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAdminDashboardStats();
      setStatsData(result.data);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same...
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

  if (loading) {
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

  if (error) {
    return (
      <div className="mb-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600">Error loading dashboard stats: {error}</p>
          <button 
            onClick={fetchStats}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const cards = getStatsCards();

  return (
    <div className="mb-8">
      {/* Current Time Display */}
      <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Current Time</h2>
            <p className="text-sm text-gray-600">Track attendance for today</p>
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
