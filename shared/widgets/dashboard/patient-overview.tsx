"use client";

import { useState, useEffect, MouseEvent } from "react";
import { Clock, Users, Calendar, ChevronRight, TrendingUp, BarChart3 } from "lucide-react";

interface DataPoint {
  date: string;
  value: number;
  cx: number;
  cy: number;
}

export default function AttendanceOverview() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<string | number | null>(null);
  const [animate, setAnimate] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"present" | "absent" | "combined">("present");

  const presentData: DataPoint[] = [
    { date: "01-04", value: 115, cx: 70, cy: 90 },
    { date: "05-10", value: 120, cx: 130, cy: 60 },
    { date: "11-16", value: 118, cx: 210, cy: 80 },
    { date: "17-21", value: 125, cx: 290, cy: 20 },
    { date: "22-26", value: 122, cx: 370, cy: 30 },
    { date: "27-31", value: 120, cx: 450, cy: 40 },
  ];

  const absentData: DataPoint[] = [
    { date: "01-04", value: 35, cx: 70, cy: 70 },
    { date: "05-10", value: 30, cx: 130, cy: 85 },
    { date: "11-16", value: 32, cx: 210, cy: 45 },
    { date: "17-21", value: 25, cx: 290, cy: 75 },
    { date: "22-26", value: 28, cx: 370, cy: 55 },
    { date: "27-31", value: 30, cx: 450, cy: 65 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    const animationTimer = setTimeout(() => {
      setAnimate(true);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(animationTimer);
    };
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.getBoundingClientRect();
    const centerX = card.left + card.width / 2;
    const centerY = card.top + card.height / 2;
    const posX = e.clientX - centerX;
    const posY = e.clientY - centerY;

    const rotateX = (posY / card.height) * 2;
    const rotateY = (posX / card.width) * -2;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case "permanent":
        return "bg-red-100 text-red-600";
      case "contract":
        return "bg-red-200 text-red-700";
      case "late":
        return "bg-yellow-100 text-yellow-600";
      case "leave":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div
      className={`bg-slate-800/80 backdrop-blur-xl p-4 sm:p-6 rounded-xl shadow-md mb-6 transform transition-all duration-700 border border-slate-700/50 hover:shadow-red-500/10 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        transformStyle: "preserve-3d",
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: "transform 0.3s ease",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400/20 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-500/20 rounded-full animate-pulse"></div>
      </div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-t-xl"></div>

      <div className="flex items-center justify-between mb-6 flex-wrap sm:flex-nowrap gap-4">
        <h3 className="text-lg font-medium text-white flex items-center">
          <Clock className="mr-2 text-red-400" size={20} />
          Attendance Overview
        </h3>
        <div className="relative">
          <select
            className="appearance-none bg-slate-800 border border-slate-600 text-red-400 py-2 pl-3 pr-8 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-sm shadow-sm hover:shadow transition-all"
            defaultValue="December 2024"
          >
            <option>December 2024</option>
            <option>November 2024</option>
            <option>October 2024</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-red-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center mb-6 bg-gradient-to-br from-slate-800 to-slate-700 p-4 rounded-lg shadow ${
          animate ? "translate-z-4" : ""
        }`}
        style={{
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
          transform: animate ? "translateZ(4px)" : "translateZ(0)",
        }}
      >
        <div className="p-3 bg-red-100 rounded-lg mr-4 shadow-inner">
          <Users size={22} className="text-red-600" />
        </div>
        <div>
          <h4 className="text-lg font-medium text-white">Employees Present</h4>
          <div className="flex items-center">
            <span className={`text-3xl font-bold mr-2 transition-all duration-700 ${animate ? "text-red-400" : "text-white"}`}>
              120
            </span>
            <span className="text-sm text-red-400">Today</span>
          </div>
        </div>
        <div className="ml-auto flex items-center">
          <span className="text-green-500 text-sm font-medium flex items-center">
            <TrendingUp size={16} className="mr-1" />
            +8%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { count: 80, label: "Permanent Employees", type: "permanent", icon: <Users size={16} /> },
          { count: 50, label: "Contract Employees", type: "contract", icon: <Users size={16} /> },
          { count: 10, label: "Late Check-ins", type: "late", icon: <Clock size={16} /> },
          { count: 10, label: "On Leave", type: "leave", icon: <Calendar size={16} /> },
        ].map((item, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg transition-all duration-500 transform hover:scale-105 hover:shadow-md cursor-pointer ${getCategoryColor(item.type)}`}
            style={{
              transformStyle: "preserve-3d",
              transform: animate ? `translateZ(${2 + index}px)` : "translateZ(0)",
              transitionDelay: `${index * 100}ms`,
            }}
          >
            <div className="flex items-center mb-1">
              {item.icon}
              <div className="ml-auto text-lg font-bold">{item.count}</div>
            </div>
            <div className="text-xs opacity-80">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex space-x-1 mb-4">
        <button
          className={`px-4 py-2 text-sm rounded-t-lg transition-all ${
            activeTab === "present" ? "bg-red-100 text-red-600 font-medium" : "text-red-400 hover:text-red-500"
          }`}
          onClick={() => setActiveTab("present")}
        >
          Present
        </button>
        <button
          className={`px-4 py-2 text-sm rounded-t-lg transition-all ${
            activeTab === "absent" ? "bg-red-200 text-red-700 font-medium" : "text-red-400 hover:text-red-500"
          }`}
          onClick={() => setActiveTab("absent")}
        >
          Absent
        </button>
        <button
          className={`px-4 py-2 text-sm rounded-t-lg transition-all ${
            activeTab === "combined" ? "bg-red-50 text-red-600 font-medium" : "text-red-400 hover:text-red-500"
          }`}
          onClick={() => setActiveTab("combined")}
        >
          Combined
        </button>
      </div>

      <div
        className="h-64 relative perspective-1000 bg-gradient-to-b from-slate-800 to-white rounded-lg p-4"
        style={{
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-0 grid grid-cols-6 gap-4">
          <div className="border-r border-r-slate-200/50">
            <div className="text-white text-xs">150</div>
            <div className="text-white text-xs">100</div>
            <div className="text-white text-xs">50</div>
            <div className="text-gray-400 text-xs">0</div>
          </div>
          <div className="col-span-5 flex flex-col justify-between">
            <div className="border-b border-b-slate-200/50" style={{ transform: animate ? "translateZ(1px)" : "translateZ(0)" }}></div>
            <div className="border-b border-b-slate-200/50" style={{ transform: animate ? "translateZ(2px)" : "translateZ(0)" }}></div>
            <div className="border-b border-b-slate-200/50" style={{ transform: animate ? "translateZ(3px)" : "translateZ(0)" }}></div>
            <div className="border-b border-b-slate-200/50" style={{ transform: animate ? "translateZ(4px)" : "translateZ(0)" }}></div>
          </div>
        </div>

        <svg
          className="h-full w-full"
          preserveAspectRatio="none"
          style={{
            filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))",
            transform: animate ? "translateZ(10px)" : "translateZ(0)",
            transition: "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {(activeTab === "present" || activeTab === "combined") && (
            <>
              <path
                d={`M30,100 ${presentData.map((p) => `L${p.cx},${p.cy}`).join(" ")}`}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3"
                className={animate ? "animate-draw-line" : ""}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 1000,
                  strokeDashoffset: animate ? 0 : 1000,
                  transition: "stroke-dashoffset 2s ease-out",
                }}
              />
              <path
                d={`M30,100 ${presentData.map((p) => `L${p.cx},${p.cy}`).join(" ")} L${presentData[presentData.length - 1].cx},160 L${presentData[0].cx},160 Z`}
                fill="url(#gradientRed)"
                opacity={animate ? "0.3" : "0"}
                className="transition-opacity duration-1000"
              />
            </>
          )}

          {(activeTab === "absent" || activeTab === "combined") && (
            <>
              <path
                d={`M30,80 ${absentData.map((p) => `L${p.cx},${p.cy}`).join(" ")}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                className={animate ? "animate-draw-line" : ""}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 1000,
                  strokeDashoffset: animate ? 0 : 1000,
                  transition: "stroke-dashoffset 2s ease-out",
                  transitionDelay: "0.5s",
                }}
              />
              <path
                d={`M${absentData[0].cx},80 ${absentData.map((p) => `L${p.cx},${p.cy}`).join(" ")} L${absentData[absentData.length - 1].cx},160 L${absentData[0].cx},160 Z`}
                fill="url(#gradientRedLight)"
                opacity={animate ? "0.3" : "0"}
                className="transition-opacity duration-1000"
              />
            </>
          )}

          {(activeTab === "present" || activeTab === "combined" ? presentData : []).map((point, index) => (
            <g
              key={`present-${index}`}
              className="transition-transform duration-300 cursor-pointer"
              style={{
                transform: hoveredPoint === `present-${index}` ? "scale(1.25) translateZ(5px)" : "scale(1) translateZ(0)",
                opacity: animate ? 1 : 0,
                transition: "transform 0.3s ease, opacity 0.5s ease",
                transitionDelay: `${index * 150}ms`,
              }}
            >
              <circle
                cx={point.cx}
                cy={point.cy}
                r={hoveredPoint === `present-${index}` ? 6 : 4}
                fill={hoveredPoint === `present-${index}` ? "#b91c1c" : "#dc2626"}
                className="transition-all duration-300"
                onMouseEnter={() => setHoveredPoint(`present-${index}`)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {hoveredPoint === `present-${index}` && (
                <g>
                  <rect x={point.cx - 30} y={point.cy - 45} width="60" height="30" rx="4" fill="#334155" className="shadow-lg" />
                  <text x={point.cx} y={point.cy - 30} textAnchor="middle" fill="white" fontSize="10">
                    {point.value} employees
                  </text>
                  <text x={point.cx} y={point.cy - 18} textAnchor="middle" fill="white" fontSize="8">
                    {point.date}
                  </text>
                </g>
              )}
            </g>
          ))}

          {(activeTab === "absent" || activeTab === "combined" ? absentData : []).map((point, index) => (
            <g
              key={`absent-${index}`}
              className="transition-transform duration-300 cursor-pointer"
              style={{
                transform: hoveredPoint === `absent-${index}` ? "scale(1.25) translateZ(5px)" : "scale(1) translateZ(0)",
                opacity: animate ? 1 : 0,
                transition: "transform 0.3s ease, opacity 0.5s ease",
                transitionDelay: `${index * 150 + 300}ms`,
              }}
            >
              <circle
                cx={point.cx}
                cy={point.cy}
                r={hoveredPoint === `absent-${index}` ? 6 : 4}
                fill={hoveredPoint === `absent-${index}` ? "#b91c1c" : "#ef4444"}
                className="transition-all duration-300"
                onMouseEnter={() => setHoveredPoint(`absent-${index}`)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {hoveredPoint === `absent-${index}` && (
                <g>
                  <rect x={point.cx - 30} y={point.cy - 45} width="60" height="30" rx="4" fill="#334155" className="shadow-lg" />
                  <text x={point.cx} y={point.cy - 30} textAnchor="middle" fill="white" fontSize="10">
                    {point.value} employees
                  </text>
                  <text x={point.cx} y={point.cy - 18} textAnchor="middle" fill="white" fontSize="8">
                    {point.date}
                  </text>
                </g>
              )}
            </g>
          ))}

          <defs>
            <linearGradient id="gradientRed" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradientRedLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-red-400">
          {presentData.map((point, index) => (
            <div
              key={index}
              className="transition-all duration-1000"
              style={{
                opacity: animate ? 1 : 0,
                transform: animate ? "translateY(0)" : "translateY(10px)",
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {point.date}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`mt-6 pt-4 border-t border-slate-100/20 transition-all duration-200 ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2 text-red-400">
            <BarChart3 size={16} className="text-red-400" />
            <span>avg. 120 employees present/day</span>
          </div>
          <div
            className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r from-red-100 to-red-200 text-red-50 transform transition-all duration-300 hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <span className="font-medium">View detailed report</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}