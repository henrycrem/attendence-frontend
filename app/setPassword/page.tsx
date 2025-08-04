"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';

const SetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const roleId = searchParams.get('roleId');

    console.log('Query Parameters:', { email, name, roleId });

    if (!email || !name || !roleId) {
      setError('Invalid or missing user data. Please restart the registration process.');
      return;
    }

    setEmail(email);
    setName(name);
    setRoleId(roleId);
  }, [searchParams]);

  useEffect(() => {
    if (password) {
      let strength = 0;
      if (password.length >= 6) strength += 1;
      if (password.match(/[A-Z]/)) strength += 1;
      if (password.match(/[0-9]/)) strength += 1;
      if (password.match(/[^A-Za-z0-9]/)) strength += 1;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword) {
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }
  }, [password, confirmPassword]);

  const getPasswordStrengthText = () => {
    if (passwordStrength < 2) return 'Weak';
    if (passwordStrength < 4) return 'Medium';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 2) return 'from-red-500 to-red-600';
    if (passwordStrength < 4) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email || !name || !roleId) {
      setError('User data is missing. Please restart the registration process.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      setIsLoading(false);
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      setIsLoading(false);
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one special character');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/set-password`, {
        email,
        name,
        roleId,
        password,
      });

      setSuccess(response.data.message);
      setTimeout(() => {
        router.push(response.data.redirect || '/');
      }, 2000);
    } catch (err: any) {
      console.error('SetPassword Error:', err.response?.data);
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-red-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated network pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400/20 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-500/20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-red-300/20 rounded-full animate-bounce"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Main card with glassmorphism effect */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 transform hover:shadow-red-500/10 transition-all duration-500">
          {/* Floating lock icon */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8 mt-4">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Set Your Password</h2>
            <p className="text-red-200 text-sm">Create a secure password for your Telecel Liberia account</p>
            {email && name && (
              <div className="mt-4 text-sm text-white bg-slate-800/50 rounded-lg p-3 backdrop-blur-sm border border-red-500/20">
                <p className="mb-1">
                  <span className="font-medium text-red-400">Name:</span> {name}
                </p>
                <p>
                  <span className="font-medium text-red-400">Email:</span> {email}
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 rounded-xl shadow-lg animate-pulse">
              <div className="flex items-center">
                <X className="w-5 h-5 mr-2 text-red-200" />
                {error}
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-200 rounded-xl shadow-lg animate-pulse">
              <div className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-200" />
                {success}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password input */}
            <div className="relative group">
              <label htmlFor="password" className="block text-sm font-medium text-red-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pr-12 bg-slate-800 text-slate-100 border-2 border-slate-600 rounded-xl outline-none transition-all duration-300 focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)] focus:bg-slate-750 placeholder-red-300/50"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <div
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? (
                    <EyeOff className="w-5 h-5 text-slate-400 hover:text-red-400 transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-400 hover:text-red-400 transition-colors" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-400">Password Strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength < 2 ? 'text-red-300' : 
                      passwordStrength < 4 ? 'text-yellow-300' : 'text-green-300'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-slate-700/50 rounded-full h-2 backdrop-blur-sm">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength * 25}%` }}
                      ></div>
                    </div>
                  </div>
                  {/* Password Requirements */}
                  <div className="mt-2 space-y-1">
                    <div className={`flex items-center text-xs ${password.length >= 6 ? 'text-green-300' : 'text-red-300'}`}>
                      <Check className={`w-3 h-3 mr-1 ${password.length >= 6 ? 'text-green-300' : 'text-red-300'}`} />
                      At least 6 characters
                    </div>
                    <div className={`flex items-center text-xs ${/[A-Z]/.test(password) ? 'text-green-300' : 'text-red-300'}`}>
                      <Check className={`w-3 h-3 mr-1 ${/[A-Z]/.test(password) ? 'text-green-300' : 'text-red-300'}`} />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center text-xs ${/[0-9]/.test(password) ? 'text-green-300' : 'text-red-300'}`}>
                      <Check className={`w-3 h-3 mr-1 ${/[0-9]/.test(password) ? 'text-green-300' : 'text-red-300'}`} />
                      One number
                    </div>
                    <div className={`flex items-center text-xs ${/[^A-Za-z0-9]/.test(password) ? 'text-green-300' : 'text-red-300'}`}>
                      <Check className={`w-3 h-3 mr-1 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-300' : 'text-red-300'}`} />
                      One special character
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password input */}
            <div className="relative group">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-red-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full p-4 pr-12 bg-slate-800 text-slate-100 border-2 rounded-xl outline-none transition-all duration-300 focus:bg-slate-750 placeholder-red-300/50 ${
                    confirmPasswordError ? 'border-red-400 focus:ring-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-slate-600 focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  }`}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
                <div
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                >
                  {isConfirmPasswordVisible ? (
                    <EyeOff className="w-5 h-5 text-slate-400 hover:text-red-400 transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-400 hover:text-red-400 transition-colors" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {confirmPassword && (
                <div className="mt-2 flex items-center">
                  {confirmPasswordError ? (
                    <div className="flex items-center text-red-300 text-xs">
                      <X className="w-3 h-3 mr-1 text-red-300" />
                      {confirmPasswordError}
                    </div>
                  ) : (
                    <div className="flex items-center text-green-300 text-xs">
                      <Check className="w-3 h-3 mr-1 text-green-300" />
                      Passwords match
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || confirmPasswordError !== '' || passwordStrength < 4}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-4 px-6 rounded-xl shadow-lg hover:shadow-red-500/30 transform hover:scale-105 transition-all duration-300 focus:outline-none relative overflow-hidden border border-red-400/20 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Setting Password...
                    </>
                  ) : (
                    'Set Password'
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/10 transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </form>

          {/* Decorative elements */}
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full opacity-10 animate-ping"></div>
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full opacity-10 animate-pulse"></div>
        </div>

        {/* Bottom security notice */}
        <div className="text-center mt-6">
          <p className="text-red-400 text-sm flex items-center justify-center">
            <Lock className="w-4 h-4 mr-2 text-red-400" />
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;