"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Users, CheckCircle, UserX, Calendar } from "lucide-react";

export default function StatCards() {
  const [isVisible, setIsVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    const animationTimer = setTimeout(() => {
      setAnimate(true);
    }, 1200);

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(animationTimer);
    };
  }, []);

  const cardsData = [
    {
      title: "Total Employees",
      icon: <Users size={20} />,
      value: 150,
      badge: { text: "Active", color: "bg-green-100 text-green-800" },
      stats: [
        { value: 80, label: "Permanent", icon: <Users size={12} className="mr-1" /> },
        { value: 50, label: "Contract", icon: <Users size={12} className="mr-1" /> },
        { value: 20, label: "Part-Time", icon: <Users size={12} className="mr-1" /> },
      ],
      color: "from-red-500 to-red-600",
      cardColor: "from-red-50 to-red-100",
    },
    {
      title: "Present Employees",
      icon: <CheckCircle size={20} />,
      value: 120,
      badge: { text: "Today", color: "bg-green-100 text-green-800" },
      stats: [
        { value: 5, label: "Late Check-ins", badge: { text: "Late", color: "bg-yellow-100 text-yellow-800" } },
      ],
      description: "Shows the number of employees present today.",
      color: "from-red-500 to-red-600",
      cardColor: "from-red-50 to-red-100",
    },
    {
      title: "Absent Employees",
      icon: <UserX size={20} />,
      value: 30,
      trend: { value: 5, direction: "up" },
      description: "Tracks absent employees today.",
      color: "from-red-500 to-red-600",
      cardColor: "from-red-50 to-red-100",
    },
    {
      title: "Leave Requests",
      icon: <Calendar size={20} />,
      value: 15,
      trend: { value: 10, direction: "down" },
      description: "Displays pending leave requests.",
      color: "from-red-500 to-red-600",
      cardColor: "from-red-50 to-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cardsData.map((card, index) => (
        <div
          key={index}
          className={`relative bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-md overflow-hidden transform transition-all duration-700 border border-slate-700/50 hover:shadow-red-500/30 hover:backdrop-blur-2xl hover:scale-105 group ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{
            transitionDelay: `${index * 100}ms`,
            transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          onMouseEnter={() => setActiveCard(index)}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400/20 rounded-full animate-ping"></div>
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-500/20 rounded-full animate-pulse"></div>
          </div>
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`}></div>
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.cardColor} opacity-0 transition-opacity duration-300`}
            style={{
              opacity: activeCard === index ? 0.3 : 0,
            }}
          ></div>
          <div
            className="absolute -inset-px rounded-full opacity-0 transition-all duration-300"
            style={{
              background:
                activeCard === index ? "radial-gradient(circle at center, rgba(255,0,0,0.2) 0%, rgba(255,0,0,0) 70%)" : "none",
              opacity: activeCard === index ? 0.5 : 0,
            }}
          ></div>
          <div className="relative p-2 sm:p-5 z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3
                className={`text-base sm:text-lg font-semibold text-red-600 group-hover:text-red-400 transition-colors duration-300 ${
                  animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                {card.title}
              </h3>
              <div
                className={`p-2 rounded-xl shadow-sm flex items-center justify-center transition-all duration-500 ${
                  animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{
                  background: `linear-gradient(to right bottom,${card.cardColor.replace("from-", "").replace("to-", "")})`,
                }}
              >
                <div className="text-red-400 group-hover:text-red-600 transition-colors duration-200">{card.icon}</div>
              </div>
            </div>
            <div
              className={`flex items-center transition-all duration-700 ${
                animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: "300ms" }}
            >
              <h2
                className="text-3xl sm:text-4xl font-bold mr-1 sm:mr-3 transition-colors duration-200 text-white group-hover:text-red-400"
              >
                {card.value}
              </h2>
              {card.badge && (
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded shadow-sm transition-all duration-500 ${card.badge.color} ${
                    animate ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                  style={{ transitionDelay: "400ms" }}
                >
                  {card.badge.text}
                </span>
              )}
              {card.trend && (
                <span
                  className={`text-xs font-medium flex items-center transition-all duration-500 ${
                    animate ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                  style={{
                    transitionDelay: "400ms",
                    color: card.trend.direction === "up" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {card.trend.direction === "up" ? (
                    <ArrowUpRight size={14} className="mr-1" />
                  ) : (
                    <ArrowDownRight size={14} className="mr-1" />
                  )}
                  {card.trend.value}%
                </span>
              )}
            </div>
            {card.stats && (
              <div
                className={`grid grid-cols-3 gap-2 mt-1 sm:mt-4 text-xs sm:text-sm transition-all duration-500 ${
                  animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: "500ms" }}
              >
                {card.stats.map((stat, statIndex) => (
                  <div
                    key={statIndex}
                    className="transform transition-all duration-300 hover:scale-105 overflow-hidden rounded-lg p-1 sm:p-2 bg-slate-700/50 backdrop-blur-sm"
                    style={{
                      transitionDelay: `${500 + statIndex * 100}ms`,
                    }}
                  >
                    <div className="flex items-center text-red-300">
                      {stat.icon}
                      <p className="font-semibold">{stat.value}</p>
                      {stat.badge && (
                        <span className={`text-[0.6rem] sm:text-xs ml-1 px-1 rounded ${stat.badge.color}`}>
                          {stat.badge.text}
                        </span>
                      )}
                    </div>
                    <p className="text-[0.6rem] sm:text-xs text-red-400 truncate">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
            {card.description && (
              <p
                className={`text-xs sm:text-sm text-red-400 mt-1 sm:mt-4 transition-all duration-500 ${
                  animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: "600ms" }}
              >
                {card.description}
              </p>
            )}
            {!card.stats && card.trend && (
              <div
                className={`mt-1 sm:mt-4 h-1 bg-slate-700/50 rounded-full overflow-hidden transition-all duration-1000 ${
                  animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: "700ms" }}
              >
                <div
                  className={`h-full rounded-full transition-all duration-1500 ease-out ${
                    card.trend.direction === "up" ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{
                    width: animate ? `${card.trend.direction === "up" ? 70 : 30}%` : "0%",
                    transitionDelay: "800ms",
                  }}
                ></div>
              </div>
            )}
            <div
              className="absolute bottom-2 right-2 w-12 sm:w-24 h-12 sm:h-24 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, ${card.color.replace("from-", "").replace("to-", "")}, transparent 70%)`,
                opacity: animate ? 0.15 : 0,
                transition: "opacity 1s ease-out",
                transitionDelay: "900ms",
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}