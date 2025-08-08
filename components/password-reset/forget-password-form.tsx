'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { forgetPasswordAction } from '@/actions/auth'
import { errorHandlers } from '@/errorHandler'

const ForgetPasswordPageForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // ✅ Basic validation with user-friendly messages
    if (!email) {
      const friendlyError = errorHandlers.passwordReset('Email is required', false)
      setError(friendlyError)
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      const friendlyError = errorHandlers.passwordReset('Invalid email', false)
      setError(friendlyError)
      setIsLoading(false)
      return
    }

    try {
      const result = await forgetPasswordAction(email)
      
      if (result.success) {
        // ✅ Show success message and toast
        setSuccess('Password reset code sent to your email! Please check your inbox.')
        toast.success('Reset code sent successfully!')
        
        setTimeout(() => {
          router.push(`/verify-reset-password?email=${encodeURIComponent(email)}`)
        }, 2000)
      } else {
        // ✅ Error is already user-friendly from errorHandler
        setError(result.error || 'Failed to send password reset email')
        toast.error(result.error || 'Failed to send password reset email')
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
              <Mail className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Forgot Password?
            </h2>
            <p className="text-gray-600 text-sm">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>
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
            {/* Email input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    // Clear error when user starts typing
                    if (error) setError('')
                  }}
                  className="w-full p-3 pl-10 bg-white text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Submit button */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Sending Reset Code...
                  </div>
                ) : (
                  'Send Reset Code'
                )}
              </button>

              {/* Back to login button */}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </button>
            </div>
          </form>
        </div>

        {/* Bottom helper text */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Remember your password?{' '}
            <button
              onClick={() => router.push('/')}
              className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
              disabled={isLoading}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgetPasswordPageForm
