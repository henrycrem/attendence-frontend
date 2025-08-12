"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react"
import { toast } from "sonner"
import { resetPasswordAction } from "@/actions/user"

// ✅ Remove this line:
// import { parseError } from "@/lib/error-handler"

// ✅ Import classifyError and classifyError type instead
import { classifyError, ERROR_MESSAGES, errorHandlers } from "@/errorHandler"

type ResetPasswordFormProps = {
  onSuccessfulReset?: () => void
}

export function ResetPasswordForm({ onSuccessfulReset }: ResetPasswordFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false)
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [confirmPasswordError, setConfirmPasswordError] = useState("")

  useEffect(() => {
    if (newPassword) {
      let strength = 0
      if (newPassword.length >= 6) strength += 1
      if (newPassword.match(/[A-Z]/)) strength += 1
      if (newPassword.match(/[0-9]/)) strength += 1
      if (newPassword.match(/[^A-Za-z0-9]/)) strength += 1
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(0)
    }
  }, [newPassword])

  useEffect(() => {
    if (confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        setConfirmPasswordError("Passwords do not match")
      } else {
        setConfirmPasswordError("")
      }
    } else {
      setConfirmPasswordError("")
    }
  }, [newPassword, confirmNewPassword])

  const getPasswordStrengthText = () => {
    if (passwordStrength < 2) return "Weak"
    if (passwordStrength < 4) return "Medium"
    return "Strong"
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 2) return "bg-red-500"
    if (passwordStrength < 4) return "bg-yellow-500"
    return "bg-green-500"
  }

  const isFormValid = () => {
    return (
      currentPassword.length > 0 &&
      passwordStrength >= 4 &&
      confirmPasswordError === "" &&
      newPassword === confirmNewPassword
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Client-side validation
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter")
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error("Password must contain at least one number")
      return
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error("Password must contain at least one special character")
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match")
      return
    }

    const formData = new FormData()
    formData.append("currentPassword", currentPassword)
    formData.append("newPassword", newPassword)
    formData.append("confirmNewPassword", confirmNewPassword)

    startTransition(async () => {
      const result = await resetPasswordAction(formData)

      if (result.success) {
        toast.success(result.message || "Password reset successfully!")
        setFormKey((prevKey) => prevKey + 1)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmNewPassword("")
        setPasswordStrength(0)
        setConfirmPasswordError("")
        onSuccessfulReset?.()
      } else {
        // ✅ Use classifyError to detect session expiration
        const errorType = classifyError(result.error)

        if (errorType === 'SESSION_EXPIRED' || errorType === 'AUTH_TOKEN_EXPIRED') {
          toast.error("Your session has expired. Redirecting to login...")
          setTimeout(() => router.push("/login"), 2000)
        } else {
          // ✅ Show user-friendly message from ERROR_MESSAGES
          toast.error(result.error)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4" key={formKey}>
      {/* Current Password */}
      <div className="grid gap-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            name="currentPassword"
            type={isCurrentPasswordVisible ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={isPending}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
          >
            {isCurrentPasswordVisible ? (
              <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="grid gap-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={isNewPasswordVisible ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isPending}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
          >
            {isNewPasswordVisible ? (
              <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>

        {newPassword && (
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Password Strength</span>
              <span
                className={`text-xs font-medium ${
                  passwordStrength < 2 ? "text-red-600" : passwordStrength < 4 ? "text-yellow-600" : "text-green-600"
                }`}
              >
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

            <div className="mt-2 space-y-1">
              <div
                className={`flex items-center text-xs ${newPassword.length >= 6 ? "text-green-600" : "text-red-600"}`}
              >
                <Check className={`w-3 h-3 mr-2 ${newPassword.length >= 6 ? "text-green-600" : "text-red-600"}`} />
                At least 6 characters
              </div>
              <div
                className={`flex items-center text-xs ${/[A-Z]/.test(newPassword) ? "text-green-600" : "text-red-600"}`}
              >
                <Check className={`w-3 h-3 mr-2 ${/[A-Z]/.test(newPassword) ? "text-green-600" : "text-red-600"}`} />
                One uppercase letter
              </div>
              <div
                className={`flex items-center text-xs ${/[0-9]/.test(newPassword) ? "text-green-600" : "text-red-600"}`}
              >
                <Check className={`w-3 h-3 mr-2 ${/[0-9]/.test(newPassword) ? "text-green-600" : "text-red-600"}`} />
                One number
              </div>
              <div
                className={`flex items-center text-xs ${/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : "text-red-600"}`}
              >
                <Check
                  className={`w-3 h-3 mr-2 ${/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : "text-red-600"}`}
                />
                One special character
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm New Password */}
      <div className="grid gap-2">
        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmNewPassword"
            name="confirmNewPassword"
            type={isConfirmPasswordVisible ? "text" : "password"}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className={confirmPasswordError ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
            required
            disabled={isPending}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
          >
            {isConfirmPasswordVisible ? (
              <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>

        {confirmNewPassword && (
          <div className="mt-1">
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

      <Button type="submit" disabled={isPending || !isFormValid()} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  )
}