'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { resetPasswordAction } from '@/actions/auth'
import { errorHandlers } from '@/errorHandler' 

const ResetPasswordPageForm: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      const friendlyError = errorHandlers.passwordReset('Invalid request. Please start the password reset process again.', false)
      setError(friendlyError)
    }
  }, [searchParams])

  useEffect(() => {
    if (password) {
      let strength = 0
      if (password.length >= 8) strength += 1 // Changed from 6 to 8 to match backend validation
      if (password.match(/[A-Z]/)) strength += 1
      if (password.match(/[0-9]/)) strength += 1
      if (password.match(/[^A-Za-z0-9]/)) strength += 1
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(0)
    }
  }, [password])

  useEffect(() => {
    if (confirmPassword) {
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match')
      } else {
        setConfirmPasswordError('')
      }
    } else {
      setConfirmPasswordError('')
    }
  }, [password, confirmPassword])

  const getPasswordStrengthText = () => {
    if (passwordStrength < 2) return 'Weak'
    if (passwordStrength < 4) return 'Medium'
    return 'Strong'
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 2) return 'bg-red-500'
    if (passwordStrength < 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // ✅ Validation with user-friendly messages
    if (!email) {
      const friendlyError = errorHandlers.passwordReset('Invalid request. Please start the password reset process again.', false)
      setError(friendlyError)
      setIsLoading(false)
      return
    }

    if (password.length < 8) { // Updated to match backend validation
      const friendlyError = errorHandlers.passwordReset('Password must be at least 8 characters long', false)
      setError(friendlyError)
      setIsLoading(false)
      return
    }

    if (!/[A-Z]/.test(password)) {
      const friendlyError = errorHandlers.passwordReset('Password must contain at least one uppercase letter', false)
      setError(friendlyError)
      setIsLoading(false)
      return
    }

    if (!/[0-9]/.test(password)) {
      const friendlyError = errorHandlers.passwordReset('Password must contain at least one number', false)
      setError(friendlyError)
      setIsLoading(false)
      return
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      const friendlyError = errorHandlers.passwordReset('Password must contain at least one special character', false)
      setError(friendlyError)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      const friendlyError = errorHandlers.passwordReset('Passwords do not match', false)
      setError(friendlyError)
      setIsLoading(false)
      return
    }

    try {
      const result = await resetPasswordAction(email, password)
      
      if (result.success) {
        setSuccess('Password reset successful! Redirecting to login...')
        toast.success('Password reset successfully! You can now log in.')
        
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        // ✅ Error is already user-friendly from errorHandler
        setError(result.error || 'Failed to reset password')
        toast.error(result.error || 'Failed to reset password')
      }
    } catch (err: any) {
      // ✅ Handle unexpected errors with user-friendly messages
      const friendlyError = errorHandlers.passwordReset(err, false)
      setError(friendlyError)
      toast.error(friendlyError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-md w-full">
        {/* Main card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Reset Your Password
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Create a new secure password for your account
            </p>
            
            {email && (
              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p>
                  <span className="font-medium text-red-600">Email:</span> {email}
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              <div className="flex items-center">
                <X className="w-5 h-5 mr-3 flex-shrink-0 text-red-500" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              <div className="flex items-center">
                <Check className="w-5 h-5 mr-3 flex-shrink-0 text-green-500" />
                <span className="text-sm">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    // Clear error when user starts typing
                    if (error) setError('')
                  }}
                  className="w-full p-3 pr-10 bg-white text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                  placeholder="Enter your new password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  disabled={isLoading}
                >
                  {isPasswordVisible ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Password Strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength < 2 ? 'text-red-600' :
                      passwordStrength < 4 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength * 25}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="mt-3 space-y-1">
                    <div className={`flex items-center text-xs ${password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                      <Check className={`w-3 h-3 mr-2 ${password.length >= 8 ? 'text-green-600' : 'text-red-600'}`} />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center text-xs ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                      <Check className={`w-3 h-3 mr-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}`} />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center text-xs ${/[0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                      <Check className={`w-3 h-3 mr-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}`} />
                      One number
                    </div>
                    <div className={`flex items-center text-xs ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                      <Check className={`w-3 h-3 mr-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}`} />
                      One special character
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    // Clear error when user starts typing
                    if (error) setError('')
                  }}
                  className={`w-full p-3 pr-10 bg-white text-gray-800 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-200 ${
                    confirmPasswordError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                  }`}
                  placeholder="Confirm your new password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  disabled={isLoading}
                >
                  {isConfirmPasswordVisible ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
                  )}
                </button>
              </div>
              
              {confirmPassword && (
                <div className="mt-2">
                  {confirmPasswordError ? (
                    <div className="flex items-center text-red-600 text-xs">
                      <X className="w-3 h-3 mr-1" />
                      {confirmPasswordError}
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Passwords match
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || confirmPasswordError !== '' || passwordStrength < 4}
                className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>

              {/* Back button */}
              <button
                type="button"
                onClick={() => router.push('/verify-reset-password')}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Verification
              </button>
            </div>
          </form>
        </div>

        {/* Bottom security notice */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm flex items-center justify-center">
            <Lock className="w-4 h-4 mr-2 text-red-600" />
            Your password will be encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPageForm
