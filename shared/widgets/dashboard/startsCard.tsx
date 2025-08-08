"use client";

import { useState, useEffect } from "react";
import { Clock, Users, CheckCircle, Timer } from "lucide-react";

export default function AttendanceStats() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const statsData = [
    {
      title: "Total Employees",
      icon: <Users size={24} />,
      value: 150,
      subtitle: "Registered",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Present Today",
      icon: <CheckCircle size={24} />,
      value: 120,
      subtitle: "Clock-ins recorded",
      color: "from-green-500 to-green-600", 
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Late Arrivals",
      icon: <Timer size={24} />,
      value: 8,
      subtitle: "After 9:00 AM",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50", 
      textColor: "text-orange-600"
    },
    {
      title: "Not Clocked In",
      icon: <Clock size={24} />,
      value: 30,
      subtitle: "No record yet",
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-50",
      textColor: "text-gray-600"
    },
  ];

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
        {statsData.map((stat, index) => (
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
                    width: isVisible ? `${(stat.value / (stat.title === "Total Employees" ? 150 : 150)) * 100}%` : "0%",
                    transitionDelay: `${(index * 100) + 500}ms`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}