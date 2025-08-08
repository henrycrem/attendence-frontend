"use client"
import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useDispatch } from "react-redux"
import { setUser } from "../store/slices/authSlice"
import { checkAuthStatus, loginUserAction, logoutAction, getClientToken } from "../actions/auth"

// ✅ Define the login result type
interface LoginResult {
  success: boolean
  redirect?: string
  error?: string
}

interface AuthContextType {
  token: string | null
  user: any | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<LoginResult> // ✅ Fixed return type
  logout: () => void
  refreshAuthState: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUserState] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useDispatch()

  // ✅ Enhanced token fetching with better error handling
  const fetchTokenWithRetry = async (retries = 3, delay = 500): Promise<string | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const clientToken = await getClientToken()
        console.log(`getClientToken succeeded on attempt ${i + 1}`)
        return clientToken
      } catch (err) {
        console.log(`getClientToken failed on attempt ${i + 1}:`, err)
        if (i === retries - 1) break
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(res => setTimeout(res, delay))
      }
    }
    return null
  }

  // ✅ Extract auth initialization into reusable function
  const initializeAuth = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    console.log("AuthContext: Initializing auth check...")
    
    try {
      // ✅ First, try to get the token to see if we have valid cookies
      const clientToken = await fetchTokenWithRetry(3, 300)
              
      if (!clientToken) {
        console.log("AuthContext: No valid token found, user not authenticated")
        setUserState(null)
        setIsAuthenticated(false)
        setToken(null)
        setError(null)
        if (showLoading) setLoading(false)
        return
      }

      // ✅ If we have a token, check auth status
      const authStatus = await checkAuthStatus()
      console.log("AuthContext: Auth status:", authStatus)
      
      if (authStatus.isAuthenticated && authStatus.user) {
        setUserState(authStatus.user)
        dispatch(setUser(authStatus.user))
        setIsAuthenticated(true)
        setToken(clientToken)
        setError(null)
        console.log("AuthContext: User authenticated successfully:", authStatus.user.email)
      } else {
        console.log("AuthContext: Auth check failed:", authStatus.error)
        setUserState(null)
        setIsAuthenticated(false)
        setToken(null)
        setError(null)
      }
    } catch (error: any) {
      console.error("AuthContext: Failed to initialize auth:", error)
      setUserState(null)
      setIsAuthenticated(false)
      setToken(null)
      setError(null)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [dispatch])

  // ✅ Add method to refresh auth state without showing loading
  const refreshAuthState = useCallback(async () => {
    await initializeAuth(false)
  }, [initializeAuth])

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // ✅ Fixed login method with proper return type
  const login = async (email: string, password: string): Promise<LoginResult> => {
    setLoading(true)
    setError(null)
        
    try {
      console.log("AuthContext: Attempting login for:", email)
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      
      const response = await loginUserAction({ error: "", success: false, message: null }, formData)
      console.log("AuthContext: Login response:", response)
      
      if (!response.success) {
        return {
          success: false,
          error: response.error || "Login failed"
        }
      }

      // ✅ Wait for cookies to be set, then refresh auth state
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // ✅ Refresh auth state after successful login
      await initializeAuth(false)
      
      // ✅ Verify we're actually authenticated before returning success
      if (!isAuthenticated) {
        // Try one more time with longer delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        await initializeAuth(false)
      }
      
      console.log("AuthContext: Login successful, user authenticated")
      return { 
        success: true, 
        redirect: response.redirect || "/dashboard"
      }
      
    } catch (error: any) {
      console.error("AuthContext: Login error:", error)
      setError(error.message)
      return {
        success: false,
        error: error.message || "Login failed"
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    console.log("AuthContext: Logging out")
    try {
      await logoutAction()
    } catch (error) {
      console.error("AuthContext: Logout error:", error)
    }
    setToken(null)
    setUserState(null)
    setIsAuthenticated(false)
    setError(null)
    dispatch(setUser(null))
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        refreshAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
