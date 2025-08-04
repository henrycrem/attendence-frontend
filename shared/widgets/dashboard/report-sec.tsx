"use client"

import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function ReportSection() {
  const [isHovered, setIsHovered] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const categories = [
    { name: "Low Compliance", color: "red", percentage: 30 },
    { name: "Medium Compliance", color: "yellow", percentage: 20 },
    { name: "High Compliance", color: "green", percentage: 40 }
  ];
  
  const totalPercentage = categories.reduce((sum, category) => sum + category.percentage, 0);
  
  const calculateStrokeDashProps = (index) => {
    const circumference = 2 * Math.PI * 40;
    const category = categories[index];
    const percentage = category.percentage / 100;
    
    let offset = 0;
    
    for (let i = 0; i < index; i++) {
      offset += (categories[i].percentage / 100) * circumference;
    }
    
    return {
      strokeDasharray: `${percentage * circumference} ${circumference}`,
      strokeDashoffset: -offset
    };
  };
  
  return (
    <div 
      className="relative bg-slate-800/80 backdrop-blur-xl p-8 rounded-xl shadow-lg mb-6 overflow-hidden border border-slate-700/50 hover:shadow-red-500/10"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400/20 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-500/20 rounded-full animate-pulse"></div>
      </div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-100"></div>
      <div className={`absolute -inset-1 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 rounded-xl blur-xl transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white relative">
            Attendance Compliance
            <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-red-500 to-transparent"></span>
          </h3>
          <button 
            className="group flex items-center px-4 py-2 bg-gradient-to-br from-red-600 to-red-100 rounded-lg text-white text-sm font-medium 
              shadow-md hover:shadow-lg transition-all duration-300
              border border-red-200 hover:border-red-300
              transform hover:-translate-y-0.5 active:translate-y-0 active:shadow
              relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="absolute inset-0 rounded-lg shadow-inner opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <div className="relative flex items-center">
              <span className="w-5 h-5 mr-2 flex items-center justify-center bg-gradient-to-br from-red-400 to-red-500 rounded-full text-white shadow-md group-hover:shadow-red-500/30 transition-all duration-300">
                <Plus size={14} />
              </span>
              <span className="group-hover:translate-x-0.5 transition-transform duration-300">Generate Report</span>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center my-6">
          <div 
            className="relative w-64 h-64 transform transition-all duration-500"
            style={{
              transform: isHovered ? 'translateZ(10px)' : 'translateZ(0px)'
            }}
          >
            <div className="absolute inset-0 bg-black rounded-full opacity-5 blur-md -z-10 translate-y-1 scale-95"></div>
            <svg className="w-full h-full transition-transform duration-700" viewBox="0 0 100 100">
              <circle 
                className={`text-red-300/10 transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                strokeWidth="1" 
                stroke="currentColor" 
                fill="none" 
                r="46" 
                cx="50" 
                cy="50" 
              />
              <circle 
                className="text-slate-700/50" 
                strokeWidth="12" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" 
                cx="50" 
                cy="50" 
              />
              <circle 
                className={`${activeCategory === 'High Compliance' ? 'text-green-400' : 'text-green-300'} transition-colors duration-300`}
                strokeWidth="12" 
                {...calculateStrokeDashProps(2)}
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" 
                cx="50" 
                cy="50" 
                transform="rotate(-90 50 50)" 
              />
              <circle 
                className={`${activeCategory === 'Medium Compliance' ? 'text-yellow-400' : 'text-yellow-300'} transition-colors duration-300`}
                strokeWidth="12" 
                {...calculateStrokeDashProps(1)}
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" 
                cx="50" 
                cy="50" 
                transform="rotate(-90 50 50)" 
              />
              <circle 
                className={`${activeCategory === 'Low Compliance' ? 'text-red-400' : 'text-red-300'} transition-colors duration-300`}
                strokeWidth="12" 
                {...calculateStrokeDashProps(0)}
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" 
                cx="50" 
                cy="50" 
                transform="rotate(-90 50 50)" 
              />
              <circle 
                className="text-slate-800" 
                fill="currentColor" 
                r="34" 
                cx="50" 
                cy="50" 
              />
              <circle 
                className="text-slate-700/50" 
                fill="currentColor" 
                r="34" 
                cx="49" 
                cy="51" 
              />
            </svg>
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full transition-all duration-500"
              style={{
                transform: isHovered ? 'translate(-50%, -50%) translateZ(20px)' : 'translate(-50%, -50%)'
              }}
            >
              <div className="text-sm text-red-400 mb-1">Compliance Rate</div>
              <div className="text-4xl font-bold text-white mb-1 relative">
                <span>{totalPercentage}%</span>
                <span className="absolute -inset-1 bg-slate-700/40 blur-sm rounded-full -z-10"></span>
              </div>
              <div className="text-xs text-red-400">Attendance Rate</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-8">
          {categories.map((category) => (
            <div 
              key={category.name}
              className="text-center relative transform transition-all duration-300 py-3 px-2 rounded-lg bg-slate-700/50 backdrop-blur-sm"
              style={{
                transform: activeCategory === category.name ? 'translateY(-4px)' : 'none'
              }}
              onMouseEnter={() => setActiveCategory(category.name)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <div 
                className={`absolute inset-0 bg-${category.color}-50 rounded-lg opacity-0 transition-opacity duration-300 ${activeCategory === category.name ? 'opacity-100' : ''}`}
              ></div>
              <div 
                className={`absolute -bottom-1 inset-x-0 h-1 opacity-0 transition-opacity duration-300 rounded-b-lg bg-${category.color}-200/50 ${activeCategory === category.name ? 'opacity-100' : ''}`}
              ></div>
              <div className="relative">
                <div className={`text-sm font-medium text-${category.color}-400 mb-1`}>
                  {category.name}
                </div>
                <div className="text-sm text-red-400 flex justify-center items-center">
                  <span>{category.percentage}% done</span>
                  <div 
                    className={`ml-2 w-2 h-2 rounded-full bg-${category.color}-400 transition-transform duration-300 ${activeCategory === category.name ? 'scale-150' : ''}`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}