import { toast } from "sonner"

// ✅ Error message mappings for user-friendly display
export const ERROR_MESSAGES = {
  // OTP Related Errors
  OTP_EXPIRED: "Your verification code has expired. Please request a new one.",
  OTP_INVALID: "The verification code you entered is incorrect. Please try again.",
  OTP_ATTEMPTS_EXCEEDED: "Too many incorrect attempts. Your account has been temporarily locked for security.",
  OTP_COOLDOWN: "Please wait before requesting another verification code.",
  OTP_SPAM_LOCK: "Too many requests detected. Please try again in an hour.",
  OTP_REQUIRED: "Please enter the verification code sent to your email.",
  
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: "The email or password you entered is incorrect.",
  AUTH_USER_NOT_FOUND: "No account found with this email address.",
  AUTH_TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  AUTH_UNAUTHORIZED: "You don't have permission to access this resource.",
  AUTH_SESSION_INVALID: "Your session is invalid. Please log in again.",
  
  // Registration Errors
  USER_ALREADY_EXISTS: "An account with this email already exists. Please use a different email or try logging in.",
  INVALID_EMAIL: "Please enter a valid email address.",
  WEAK_PASSWORD: "Your password is too weak. Please choose a stronger password.",
  REQUIRED_FIELDS: "Please fill in all required fields.",
  INVALID_ROLE: "The selected role is not valid. Please choose a different role.",
  INVALID_DEPARTMENT: "The selected department is not valid. Please choose a different department.",
  
  // Password Reset Errors
  RESET_TOKEN_INVALID: "This password reset link is invalid or has expired. Please request a new one.",
  SAME_PASSWORD: "Your new password cannot be the same as your current password.",
  RESET_NOT_VERIFIED: "Please verify your email first before resetting your password.",
  
  // Network/Server Errors
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection and try again.",
  SERVER_ERROR: "Something went wrong on our end. Please try again in a few moments.",
  TIMEOUT_ERROR: "The request took too long to complete. Please try again.",
  
  // Location Errors (New)
  LOCATION_PERMISSION_DENIED: "Please allow location access in your browser settings.",
  LOCATION_UNAVAILABLE: "Location services are currently unavailable.",
  LOCATION_TIMEOUT: "Location request timed out. Please try again.",
  LOCATION_FAILED_IP_FALLBACK: "Unable to determine your location. Please enable GPS or check your internet connection.",
  
  // Generic Fallbacks
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again or contact support if the problem persists.",
  VALIDATION_ERROR: "Please check your input and try again.",
  
  // User Registration Errors
  USER_REGISTRATION_FAILED: "Failed to register user. Please check your information and try again.",
  ROLE_FETCH_FAILED: "Unable to load user roles. Please refresh the page and try again.",
  DEPARTMENT_FETCH_FAILED: "Unable to load departments. Please refresh the page and try again.",
  FORM_VALIDATION_ERROR: "Please check all required fields and correct any errors.",
  REGISTRATION_SUCCESS: "User registered successfully! Redirecting...",
} as const

// ✅ Error classification function
export function classifyError(error: string | Error): keyof typeof ERROR_MESSAGES {
  const errorMessage = typeof error === 'string' ? error.toLowerCase() : error.message.toLowerCase()
  
  // OTP Related
  if (errorMessage.includes('otp expired') || errorMessage.includes('expired')) {
    return 'OTP_EXPIRED'
  }
  if (errorMessage.includes('incorrect otp') || errorMessage.includes('invalid otp')) {
    return 'OTP_INVALID'
  }
  if (errorMessage.includes('account locked') || errorMessage.includes('multiple failed attempts')) {
    return 'OTP_ATTEMPTS_EXCEEDED'
  }
  if (errorMessage.includes('wait') && errorMessage.includes('minute')) {
    return 'OTP_COOLDOWN'
  }
  if (errorMessage.includes('too many requests') || errorMessage.includes('spam')) {
    return 'OTP_SPAM_LOCK'
  }
  if (errorMessage.includes('otp') && errorMessage.includes('required')) {
    return 'OTP_REQUIRED'
  }
  
  // Authentication
  if (errorMessage.includes('invalid email or password') || errorMessage.includes('invalid credentials')) {
    return 'AUTH_INVALID_CREDENTIALS'
  }
  if (errorMessage.includes('user not found') || errorMessage.includes('account not found')) {
    return 'AUTH_USER_NOT_FOUND'
  }
  if (errorMessage.includes('token expired') || errorMessage.includes('session expired')) {
    return 'AUTH_TOKEN_EXPIRED'
  }
  if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
    return 'AUTH_UNAUTHORIZED'
  }
  if (errorMessage.includes('session') && errorMessage.includes('invalid')) {
    return 'AUTH_SESSION_INVALID'
  }
  
  // Registration
  if (errorMessage.includes('user already exists') || errorMessage.includes('email already exists')) {
    return 'USER_ALREADY_EXISTS'
  }
  if (errorMessage.includes('invalid email')) {
    return 'INVALID_EMAIL'
  }
  if (errorMessage.includes('password') && (errorMessage.includes('weak') || errorMessage.includes('strength'))) {
    return 'WEAK_PASSWORD'
  }
  if (errorMessage.includes('required') || errorMessage.includes('all fields')) {
    return 'REQUIRED_FIELDS'
  }
  if (errorMessage.includes('invalid role')) {
    return 'INVALID_ROLE'
  }
  if (errorMessage.includes('invalid department')) {
    return 'INVALID_DEPARTMENT'
  }
  
  // Password Reset
  if (errorMessage.includes('reset') && (errorMessage.includes('invalid') || errorMessage.includes('expired'))) {
    return 'RESET_TOKEN_INVALID'
  }
  if (errorMessage.includes('same password') || errorMessage.includes('current password')) {
    return 'SAME_PASSWORD'
  }
  if (errorMessage.includes('verify') && errorMessage.includes('first')) {
    return 'RESET_NOT_VERIFIED'
  }
  
  // Network/Server
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('fetch')) {
    return 'NETWORK_ERROR'
  }
  if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('internal')) {
    return 'SERVER_ERROR'
  }
  if (errorMessage.includes('timeout') || errorMessage.includes('took too long')) {
    return 'TIMEOUT_ERROR'
  }

  // Location Related (New)
  if (errorMessage.includes('geolocation permission denied')) {
    return 'LOCATION_PERMISSION_DENIED'
  }
  if (errorMessage.includes('geolocation position unavailable')) {
    return 'LOCATION_UNAVAILABLE'
  }
  if (errorMessage.includes('geolocation request timed out')) {
    return 'LOCATION_TIMEOUT'
  }
  if (errorMessage.includes('all ip location services failed') || errorMessage.includes('location services unavailable')) {
    return 'LOCATION_FAILED_IP_FALLBACK'
  }
  
  // Validation
  if (errorMessage.includes('validation') || errorMessage.includes('invalid request')) {
    return 'VALIDATION_ERROR'
  }
  
  // User Registration
  if (errorMessage.includes('failed to register user')) {
    return 'USER_REGISTRATION_FAILED'
  }
  if (errorMessage.includes('unable to load user roles')) {
    return 'ROLE_FETCH_FAILED'
  }
  if (errorMessage.includes('unable to load departments')) {
    return 'DEPARTMENT_FETCH_FAILED'
  }
  if (errorMessage.includes('form validation error')) {
    return 'FORM_VALIDATION_ERROR'
  }
  if (errorMessage.includes('user registered successfully')) {
    return 'REGISTRATION_SUCCESS'
  }
  
  // Default fallback
  return 'UNKNOWN_ERROR'
}

// ✅ Main error handler function
export function handleError(error: string | Error, options?: {
  showToast?: boolean
  toastType?: 'error' | 'warning' | 'info'
  context?: string
}): string {
  const { showToast = false, toastType = 'error', context } = options || {}
  
  console.error(`Error${context ? ` in ${context}` : ''}:`, error)
  
  const errorType = classifyError(error)
  const userFriendlyMessage = ERROR_MESSAGES[errorType]
  
  if (showToast) {
    if (toastType === 'error') {
      toast.error(userFriendlyMessage)
    } else if (toastType === 'warning') {
      toast.warning(userFriendlyMessage)
    } else {
      toast.info(userFriendlyMessage)
    }
  }
  
  return userFriendlyMessage
}

// ✅ Specific error handlers for different contexts
export const errorHandlers = {
  auth: (error: string | Error, showToast = true) => 
    handleError(error, { showToast, context: 'Authentication' }),
    
  otp: (error: string | Error, showToast = true) => 
    handleError(error, { showToast, context: 'OTP Verification' }),
    
  registration: (error: string | Error, showToast = true) => 
    handleError(error, { showToast, context: 'Registration' }),
    
  passwordReset: (error: string | Error, showToast = true) => 
    handleError(error, { showToast, context: 'Password Reset' }),
    
  network: (error: string | Error, showToast = true) => 
    handleError(error, { showToast, context: 'Network Request', toastType: 'warning' }),

  // ✅ New location error handler
  location: (error: string | Error, showToast = true) =>
    handleError(error, { showToast, context: 'Location Services', toastType: 'warning' }),
}
