export type ErrorType = "authentication" | "validation" | "network" | "server" | "unknown"

export interface ParsedError {
  type: ErrorType
  message: string
  shouldRedirect?: boolean
}

export function parseError(error: unknown): ParsedError {
  // Handle non-Error objects
  if (!(error instanceof Error)) {
    return {
      type: "unknown",
      message: "An unexpected error occurred. Please try again.",
    }
  }

  const message = error.message
  const errorMessage = message.toLowerCase()

  // === SPECIFIC VALIDATION ERRORS (high specificity first) ===
  if (/invalid.*current.*password|current.*password.*invalid/i.test(message)) {
    return {
      type: "validation",
      message: "The current password you entered is incorrect. Please try again.",
    }
  }

  if (errorMessage.includes("password cannot be the same")) {
    return {
      type: "validation",
      message: "Your new password must be different from your current password.",
    }
  }

  if (errorMessage.includes("new password and confirmation do not match")) {
    return {
      type: "validation",
      message: "The new password and confirmation password do not match.",
    }
  }

  if (errorMessage.includes("all password fields are required") || errorMessage.includes("current password and new password are required")) {
    return {
      type: "validation",
      message: "Please fill in all password fields.",
    }
  }

  if (errorMessage.includes("password must be at least")) {
    return {
      type: "validation",
      message: "Password must be at least 8 characters long with uppercase, lowercase, and numbers.",
    }
  }

  if (errorMessage.includes("name is required")) {
    return {
      type: "validation",
      message: "Name is required and cannot be empty.",
    }
  }

  if (errorMessage.includes("invalid file type")) {
    return {
      type: "validation",
      message: "Please upload a valid image file (JPEG, PNG, GIF, or WEBP).",
    }
  }

  if (errorMessage.includes("file too large") || errorMessage.includes("body exceeded")) {
    return {
      type: "validation",
      message: "The file is too large. Please choose an image smaller than 5MB.",
    }
  }

  // Role and Department specific errors
  if (errorMessage.includes("role") && errorMessage.includes("already exists")) {
    return {
      type: "validation",
      message: "A role with this name already exists. Please choose a different name.",
    }
  }

  if (errorMessage.includes("department") && errorMessage.includes("already exists")) {
    return {
      type: "validation",
      message: "A department with this name already exists. Please choose a different name.",
    }
  }

  if (errorMessage.includes("role not found") || errorMessage.includes("department not found")) {
    return {
      type: "validation",
      message: "The requested item was not found. It may have been deleted.",
    }
  }

  // === AUTHENTICATION & SESSION ERRORS (should redirect) ===
  if (
    errorMessage.includes("no access token") ||
    errorMessage.includes("token expired") ||
    errorMessage.includes("session expired") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("authentication failed") ||
    errorMessage.includes("invalid token") ||
    errorMessage.includes("jwt") ||
    errorMessage.includes("not authenticated") ||
    errorMessage.includes("user not authenticated")
  ) {
    return {
      type: "authentication",
      message: "Your session has expired. Please log in again.",
      shouldRedirect: true,
    }
  }

  if (errorMessage.includes("super admin privileges required")) {
    return {
      type: "authentication",
      message: "You don't have permission to perform this action.",
    }
  }

  // === NETWORK ERRORS ===
  if (
    errorMessage.includes("network error") ||
    errorMessage.includes("failed to fetch") ||
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("timeout")
  ) {
    return {
      type: "network",
      message: "Network error. Please check your connection and try again.",
    }
  }

  // === SERVER ERRORS ===
  if (
    errorMessage.includes("http 5") ||
    errorMessage.includes("internal server error") ||
    errorMessage.includes("500")
  ) {
    return {
      type: "server",
      message: "Server error. Please try again in a few moments.",
    }
  }

  // === FINAL FALLBACK ===
  // If the original message is short and doesn't contain noisy keywords, use it
  const isUserFriendly =
    !errorMessage.includes("http") &&
    !errorMessage.includes("fetch") &&
    !errorMessage.includes("undefined") &&
    !errorMessage.includes("not found") &&
    message.length < 100 &&
    message.trim() !== ""

  return {
    type: "unknown",
    message: isUserFriendly ? message : "An unexpected error occurred. Please try again.",
  }
}

// === Utility Helpers ===

export function getErrorMessage(error: unknown): string {
  return parseError(error).message
}

export function shouldRedirectOnError(error: unknown): boolean {
  return Boolean(parseError(error).shouldRedirect)
}

export function handleError(error: unknown, context?: string): ParsedError {
  const parsedError = parseError(error)
  if (context) {
    console.error(`Error in ${context}:`, error)
  }
  return parsedError
}

export function handleManagementError(
  error: unknown,
  operation: string,
  itemType: "role" | "department"
): ParsedError {
  const parsedError = parseError(error)

  if (parsedError.type === "validation") {
    if (parsedError.message.includes("already exists")) {
      parsedError.message = `A ${itemType} with this name already exists. Please choose a different name.`
    }

    if (parsedError.message.includes("not found")) {
      parsedError.message = `The ${itemType} was not found. It may have been deleted by another user.`
    }
  }

  console.error(`Error ${operation} ${itemType}:`, error)
  return parsedError
}