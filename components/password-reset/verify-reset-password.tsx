'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, ArrowLeft, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { verifyResetPasswordOtpAction, forgetPasswordAction } from '@/actions/auth'
import { errorHandlers } from '@/errorHandler' 

const VerifyResetPasswordForm: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', ''])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      const friendlyError = errorHandlers.otp('Invalid request. Please start the password reset process again.', false)
      setError(friendlyError)
    }
    
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [searchParams])

  const handleChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      
      // Clear error when user starts typing
      if (error) setError('')
      
      // Move focus to next input if value is entered
      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const numbers = text.replace(/\D/g, '').slice(0, 5)
        if (numbers.length <= 5) {
          const newOtp = [...otp]
          for (let i = 0; i < numbers.length; i++) {
            newOtp[i] = numbers[i]
          }
          setOtp(newOtp)
          // Focus on the next empty input or the last filled one
          const nextIndex = Math.min(numbers.length, 4)
          inputRefs.current[nextIndex]?.focus()
        }
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    const otpCode = otp.join('')
    
    // ✅ Validation with user-friendly messages
    if (otpCode.length !== 5) {
      const friendlyError = errorHandlers.otp('Please enter the complete 5-digit verification code', false)
      setError(friendlyError)
      setIsLoading(false)
      return
    }

    try {
      const result = await verifyResetPasswordOtpAction(email, otpCode)
      
      if (result.success) {
        setSuccess('Verification successful! Redirecting to password reset...')
        toast.success('Code verified successfully!')
        
        setTimeout(() => {
          if (result.data?.redirect) {
            router.push(result.data.redirect)
          } else {
            router.push(`/reset-password?email=${encodeURIComponent(email)}`)
          }
        }, 2000)
      } else {
        // ✅ Error is already user-friendly from errorHandler
        setError(result.error || 'Failed to verify code')
        toast.error(result.error || 'Failed to verify code')
      }
    } catch (err: any) {
      // ✅ Handle unexpected errors with user-friendly messages
      const friendlyError = errorHandlers.otp(err, false)
      setError(friendlyError)
      toast.error(friendlyError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email) {
      const friendlyError = errorHandlers.otp('Email is required to resend code', false)
      setError(friendlyError)
      return
    }

    setIsResending(true)
    setError('')
    setSuccess('')

    try {
      const result = await forgetPasswordAction(email)
      
      if (result.success) {
        setSuccess('New verification code sent to your email!')
        toast.success('Code resent successfully!')
        // Clear the OTP inputs
        setOtp(['', '', '', '', ''])
        // Focus first input
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus()
        }
        setTimeout(() => setSuccess(''), 3000)
      } else {
        // ✅ Error is already user-friendly from errorHandler
        setError(result.error || 'Failed to resend code')
        toast.error(result.error || 'Failed to resend code')
      }
    } catch (err: any) {
      // ✅ Handle unexpected errors with user-friendly messages
      const friendlyError = errorHandlers.otp(err, false)
      setError(friendlyError)
      toast.error(friendlyError)
    } finally {
      setIsResending(false)
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
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Verify Reset Code
            </h2>
            <p className="text-gray-600 text-sm mb-2">
              We've sent a 5-digit verification code to
            </p>
            <p className="text-gray-800 font-medium text-sm">
              {email || 'your email address'}
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
            {/* OTP Input Fields */}
            <div className="flex justify-center gap-3 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-14 text-center text-xl font-semibold bg-white border-2 border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 hover:border-gray-400"
                  required
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Submit button */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || otp.some(digit => !digit)}
                className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify Code'
                )}
              </button>

              {/* Resend OTP button */}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending || isLoading}
                className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin mr-2"></div>
                    Resending...
                  </div>
                ) : (
                  "Didn't receive the code? Resend OTP"
                )}
              </button>

              {/* Back button */}
              <button
                type="button"
                onClick={() => router.push('/forget-password')}
                disabled={isLoading || isResending}
                className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Email Entry
              </button>
            </div>
          </form>
        </div>

        {/* Bottom helper text */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Enter the 5-digit code sent to your email
          </p>
        </div>
      </div>
    </div>
  )
}

export default VerifyResetPasswordForm
