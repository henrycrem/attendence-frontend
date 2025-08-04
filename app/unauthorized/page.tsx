'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, ArrowLeft, Home, AlertTriangle, RefreshCw } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);

    // Generate random particles for background animation
    const particleArray = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setParticles(particleArray);
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleContactAdmin = () => {
    alert('Please contact your system administrator for access permissions.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-white bg-opacity-10 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: '4s',
            }}
          />
        ))}
      </div>

      {/* Floating geometric shapes */}
      <div
        className="absolute top-20 left-20 w-20 h-20 border border-white border-opacity-20 rounded-lg transform rotate-45 animate-spin"
        style={{ animationDuration: '20s' }}
      />
      <div
        className="absolute bottom-20 right-20 w-16 h-16 border border-blue-300 border-opacity-30 rounded-full animate-bounce"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-12 h-12 bg-purple-500 bg-opacity-20 rounded-full animate-ping"
        style={{ animationDelay: '2s' }}
      />

      {/* Main Content Container */}
      <div
        className={`relative z-10 max-w-2xl mx-auto px-6 text-center transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        {/* 3D Animated Icon Container */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-red-400 border-opacity-30 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
            {/* Inner pulsing circle */}
            <div className="absolute inset-4 bg-red-500 bg-opacity-20 rounded-full animate-pulse" />
            {/* Center shield icon with 3D effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative transform hover:scale-110 transition-transform duration-300">
                <Shield className="w-16 h-16 text-red-400 drop-shadow-lg filter" />
                <Lock className="w-8 h-8 text-red-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Code with 3D Text Effect */}
        <div className="mb-6">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2 transform hover:scale-105 transition-transform duration-300">
            401
          </h1>
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mr-2 animate-bounce" />
            <h2 className="text-2xl font-bold text-white">Access Denied</h2>
            <AlertTriangle className="w-6 h-6 text-yellow-400 ml-2 animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white border-opacity-10 shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-4">Unauthorized Access</h3>
          <p className="text-gray-300 mb-4 leading-relaxed">
            You don't have permission to access this page in the Jamelia Hospital Management System. 
            This could be due to insufficient privileges or an expired session.
          </p>

          {/* Additional Information */}
          <div className="bg-blue-500 bg-opacity-10 rounded-lg p-4 mb-4 border-l-4 border-blue-400">
            <h4 className="text-blue-300 font-medium mb-2">Possible Reasons:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Your session has expired</li>
              <li>• Insufficient user privileges</li>
              <li>• Account not activated for this module</li>
              <li>• Network or authentication issues</li>
            </ul>
          </div>

          {/* Error Details */}
          <div className="text-xs text-gray-400 bg-gray-900 bg-opacity-50 rounded p-3 font-mono">
            <div>Error Code: HM-401-UNAUTHORIZED</div>
            <div>Timestamp: {new Date().toLocaleString()}</div>
            <div>Module: Jamelia Hospital Management System</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleGoBack}
            className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium transform hover:scale-105 transition-all duration-300 hover:shadow-lg flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            Go Back
          </button>

          <Link
            href="/dashboard"
            className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium transform hover:scale-105 transition-all duration-300 hover:shadow-lg flex items-center gap-2"
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            Home
          </Link>

          <button
            onClick={handleRefresh}
            className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transform hover:scale-105 transition-all duration-300 hover:shadow-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </button>

          <button
            onClick={handleContactAdmin}
            className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium transform hover:scale-105 transition-all duration-300 hover:shadow-lg"
          >
            Contact Admin
          </button>
        </div>

        {/* Additional Help Text */}
        <div className="mt-8 text-sm text-gray-400">
          <p>If you believe this is an error, please contact your system administrator or try logging in again.</p>
        </div>
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>
    </div>
  );
};

export default UnauthorizedPage;