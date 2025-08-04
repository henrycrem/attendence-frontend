"use client"

import React, { useState, useEffect } from 'react';
import { HelpCircle, Signal, Wifi } from 'lucide-react';

const LoginHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [animateTitle, setAnimateTitle] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    setTimeout(() => setAnimateTitle(true), 500);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-gradient-to-r from-red-900 via-red-800 to-red-700 shadow-xl mb-3
      transition-all duration-500 ease-in-out ${scrolled ? 'py-6' : 'py-4'}`}>
      
      {/* Animated network pattern background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 left-1/4 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
        <div className="absolute top-6 right-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-2 left-1/2 w-1.5 h-1.5 bg-red-300 rounded-full animate-bounce"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center group">
            <div className={`flex items-center justify-center w-12 h-12
              bg-gradient-to-br from-red-500 to-red-600
              rounded-xl shadow-lg transform transition-all duration-500
              group-hover:rotate-6 group-hover:scale-110
              relative overflow-hidden border border-red-300/20`}>
              
              {/* Signal waves animation */}
              <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                  <div className="absolute -inset-1 border border-white/20 rounded-full animate-pulse"></div>
                  <div className="absolute -inset-2 border border-white/10 rounded-full animate-ping animation-delay-75"></div>
                </div>
              </div>
              
              <Signal className="w-6 h-6 text-white relative z-10" />
            </div>
            
            <div className={`ml-4 transition-all duration-700 ${animateTitle ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <h1 className="text-white text-xl font-bold transform perspective-1000
                transition-all duration-500 group-hover:text-red-300">
                <span className="inline-block transform group-hover:scale-105">Telecel Liberia</span>
              </h1>
              <p className="text-red-200 text-sm transform transition-all duration-500
                group-hover:text-white flex items-center">
                <Wifi className="w-3 h-3 mr-1" />
                Attendance System
              </p>
            </div>
          </div>
          
          <div className="perspective-1000">
            <button 
              type="button"
              className="flex items-center bg-gradient-to-r from-red-500 to-red-600
                hover:from-red-400 hover:to-red-500 px-4 py-2 rounded-full shadow-lg
                text-white text-sm font-medium
                transition-all duration-300 ease-out
                transform hover:scale-105 hover:shadow-red-500/30
                relative overflow-hidden border border-red-300/20"
            >
              <div className="absolute inset-0 bg-white/10 transform skew-x-12 -translate-x-full 
                group-hover:translate-x-full transition-transform duration-700"></div>
              <HelpCircle className="w-4 h-4 mr-2" />
              <span className="relative z-10">Support</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default LoginHeader;