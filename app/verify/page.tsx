'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

const VerifyOtp: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Extract query params from URL using Next.js useSearchParams
    setEmail(searchParams.get('email') || '');
    setName(searchParams.get('name') || '');
    setRoleId(searchParams.get('roleId') || '');
    
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [searchParams]);

  const handleChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Clear error when user starts typing
      if (error) setError('');

      // Move focus to next input if value is entered
      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const numbers = text.replace(/\D/g, '').slice(0, 5);
        if (numbers.length <= 5) {
          const newOtp = [...otp];
          for (let i = 0; i < numbers.length; i++) {
            newOtp[i] = numbers[i];
          }
          setOtp(newOtp);
          // Focus on the next empty input or the last filled one
          const nextIndex = Math.min(numbers.length, 4);
          inputRefs.current[nextIndex]?.focus();
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const otpCode = otp.join('');
    if (otpCode.length !== 5) {
      setError('Please enter a 5-digit OTP');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/verify-user`, {
        email,
        name,
        roleId,
        otp: otpCode,
      });

      setSuccess(response.data.message);
      
      // Use the redirect URL from the backend response which contains the user data
      setTimeout(() => {
        if (response.data.redirect) {
          // Use the redirect URL from backend that contains all user data
          router.push(response.data.redirect);
        } else {
          // Fallback: manually construct the URL with user data
          const redirectUrl = `/setPassword?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&roleId=${roleId}`;
          router.push(redirectUrl);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setError('');
      // Use the registration endpoint to resend OTP with the current user data
      await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/register`, {
        name,
        email,
        roleId,
      });
      setSuccess('OTP resent successfully!');
      // Clear the success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-96 h-96 bg-cyan-500 rounded-full opacity-10 animate-pulse filter blur-3xl"></div>
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-blue-500 rounded-full opacity-15 animate-bounce filter blur-2xl"></div>
        <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-indigo-500 rounded-full opacity-10 animate-pulse filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Main card with 3D effect */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white border-opacity-20 p-8 transform hover:scale-105 transition-all duration-300">
          {/* Floating shield icon */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl animate-bounce">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          {/* Header section */}
          <div className="text-center mb-8 mt-6">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-wide">
              Verify Your Account
            </h2>
            <p className="text-cyan-200 text-sm opacity-80 leading-relaxed">
              We've sent a 5-digit verification code to
            </p>
            <p className="text-white font-medium text-sm mt-1">
              {email || 'your email address'}
            </p>
            {/* Display user details for verification */}
            {name && (
              <div className="mt-3 text-xs text-cyan-200 opacity-80">
                <p>Verifying account for: <span className="font-medium text-white">{name}</span></p>
              </div>
            )}
          </div>

          {/* Error message with glass effect */}
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-20 backdrop-blur-sm border border-red-400 border-opacity-30 text-red-200 rounded-xl shadow-lg animate-shake">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Success message with glass effect */}
          {success && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-20 backdrop-blur-sm border border-green-400 border-opacity-30 text-green-200 rounded-xl shadow-lg animate-pulse">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* OTP Input Fields with 3D effect */}
            <div className="flex justify-center gap-3 mb-8">
              {otp.map((digit, index) => (
                <div key={index} className="relative group">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="w-14 h-16 text-center text-2xl font-bold bg-white bg-opacity-10 backdrop-blur-sm border-2 border-white border-opacity-20 rounded-2xl text-white placeholder-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:ring-opacity-50 focus:border-cyan-400 transition-all duration-300 hover:bg-opacity-20 shadow-lg transform hover:scale-110"
                    required
                  />
                  {/* Floating gradient effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
                  {/* Active state glow */}
                  {digit && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-400 opacity-30 animate-pulse pointer-events-none"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit button with 3D effect */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:ring-opacity-50 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              {/* Resend OTP button */}
              <button
                type="button"
                onClick={handleResendOtp}
                className="w-full bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 text-cyan-200 font-medium py-3 px-6 rounded-2xl hover:bg-opacity-20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50"
              >
                Didn't receive the code? Resend OTP
              </button>
            </div>
          </form>

          {/* Decorative floating elements */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-10 animate-ping"></div>
          <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full opacity-10 animate-pulse"></div>
        </div>

        {/* Bottom helper text */}
        <div className="text-center mt-6">
          <p className="text-cyan-300 text-sm opacity-70">
            Enter the 5-digit code sent to your email
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;