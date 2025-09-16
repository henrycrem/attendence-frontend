'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileX, Search, ArrowLeft, Home, AlertCircle, RefreshCw } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleSearchSite = () => {
    // You can redirect to your search page or implement search functionality
    alert('Redirecting to search page...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center px-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content Container */}
      <div
        className={`relative z-10 max-w-5xl mx-auto text-center transform transition-all duration-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          {/* Left Section - Icon and Error Code */}
          <div className="lg:text-right">
            <div className="w-32 h-32 mx-auto lg:ml-auto lg:mr-0 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-200 shadow-lg mb-6">
              <FileX className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-8xl font-bold text-red-700 mb-2">404</h1>
          </div>

          {/* Center Section - Main Message */}
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-6">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              <h2 className="text-2xl font-semibold text-red-800">Page Not Found</h2>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Oops! Page Not Found</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The page you're looking for doesn't exist in the Telecel Liberia Attendence & Sales Management System. 
              It may have been moved, deleted, or the URL might be incorrect.
            </p>

            {/* Error Details */}
            <div className="text-xs text-gray-500 bg-gray-100 rounded p-3 font-mono border mb-4">
              <div>Error Code: HM-404-NOT-FOUND</div>
              <div>Timestamp: {new Date().toLocaleString()}</div>
              <div>Module: Telecel Liberia Attendence & Sales Management System</div>
            </div>

            <p className="text-sm text-gray-600">
              Need help? Contact our support team or return to the main dashboard.
            </p>
          </div>

          {/* Right Section - Actions and Suggestions */}
          <div className="lg:text-left">
            <div className="bg-red-50 rounded-lg p-4 mb-6 border-l-4 border-red-400">
              <h4 className="text-red-700 font-medium mb-3">What you can do:</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Check the URL for typos</li>
                <li>• Go back to the previous page</li>
                <li>• Visit the homepage and navigate from there</li>
                <li>• Use the search function to find what you need</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoBack}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>

              <Link
                href="/dashboard"
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>

              <button
                onClick={handleSearchSite}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <Search className="w-4 h-4" />
                Search
              </button>

              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;