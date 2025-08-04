"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { io, type Socket } from "socket.io-client"
import { setUser } from "../store/slices/authSlice"
import { checkAuthStatus, loginUserAction, logoutAction, getClientToken } from "../actions/auth"

interface AuthContextType {
  token: string | null
  user: any | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  socket: Socket | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUserState] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const dispatch = useDispatch()

  const initializeWebSocket = async (clientToken: string) => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000"
      console.log("AuthContext: Connecting to WebSocket:", wsUrl)

      const newSocket = io(wsUrl, {
        auth: { token: clientToken },
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      })

      newSocket.on("connect", () => {
        console.log("AuthContext: WebSocket connected:", newSocket.id)
        setError(null)

        // Authenticate with the server
        if (user?.id) {
          newSocket.emit("authenticate", {
            userId: user.id,
            token: clientToken,
          })
        }
      })

      newSocket.on("authenticated", (data) => {
        console.log("AuthContext: WebSocket authenticated:", data)
      })

      newSocket.on("authError", (error) => {
        console.error("AuthContext: WebSocket auth error:", error)
        setError("WebSocket authentication failed")
      })

      newSocket.on("connect_error", (error) => {
        console.error("AuthContext: WebSocket connect_error:", error.message)
        setError("WebSocket connection failed")
      })

      newSocket.on("disconnect", (reason) => {
        console.log("AuthContext: WebSocket disconnected:", reason)
      })

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("AuthContext: WebSocket reconnected after", attemptNumber, "attempts")
        setError(null)

        // Re-authenticate after reconnection
        if (user?.id) {
          newSocket.emit("authenticate", {
            userId: user.id,
            token: clientToken,
          })
        }
      })

      newSocket.on("reconnect_error", (error) => {
        console.error("AuthContext: WebSocket reconnect_error:", error)
      })

      newSocket.on("reconnect_failed", () => {
        console.error("AuthContext: WebSocket reconnection failed after maximum attempts")
        setError("WebSocket reconnection failed")
      })

      // Listen for user status updates
      newSocket.on("userStatusUpdate", (data) => {
        console.log("AuthContext: Received userStatusUpdate:", data)
      })

      setSocket(newSocket)
      return newSocket
    } catch (error) {
      console.error("AuthContext: Failed to initialize WebSocket:", error)
      setError("Failed to initialize WebSocket")
      return null
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true)
      setError(null)
      console.log("AuthContext: Initializing auth check...")

      try {
        const authStatus = await checkAuthStatus()
        console.log("AuthContext: Auth status:", authStatus)

        if (authStatus.isAuthenticated && authStatus.user) {
          setUserState(authStatus.user)
          dispatch(setUser(authStatus.user))
          setIsAuthenticated(true)
          setError(null)

          try {
            const clientToken = await getClientToken()
            console.log("AuthContext: Got client token:", clientToken ? clientToken.slice(0, 10) + "..." : "null")
            setToken(clientToken)

            // Initialize WebSocket after user is set
            await initializeWebSocket(clientToken)
          } catch (tokenError) {
            console.error("AuthContext: Failed to get client token:", tokenError)
            setToken(null)
          }

          console.log("AuthContext: User authenticated:", authStatus.user)
        } else {
          setUserState(null)
          setIsAuthenticated(false)
          setToken(null)
          setSocket(null)
          setError(authStatus.error)
          console.log("AuthContext: User not authenticated:", authStatus.error)
        }
      } catch (error: any) {
        console.error("AuthContext: Failed to check auth status:", error)
        setUserState(null)
        setIsAuthenticated(false)
        setToken(null)
        setSocket(null)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (socket) {
        console.log("AuthContext: Cleaning up WebSocket")
        socket.disconnect()
        setSocket(null)
      }
    }
  }, [dispatch])

  // Re-initialize WebSocket when user changes
  useEffect(() => {
    if (user?.id && token && socket && socket.connected) {
      console.log("AuthContext: Re-authenticating WebSocket for user:", user.id)
      socket.emit("authenticate", {
        userId: user.id,
        token: token,
      })
    }
  }, [user, token, socket])

  const login = async (email: string, password: string) => {
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
        throw new Error(response.error || "Login failed")
      }

      // Fetch user data after successful login
      const authStatus = await checkAuthStatus()
      if (authStatus.isAuthenticated && authStatus.user) {
        setUserState(authStatus.user)
        dispatch(setUser(authStatus.user))
        setIsAuthenticated(true)
        setError(null)

        // Get token and initialize WebSocket
        const clientToken = await getClientToken()
        console.log("AuthContext: Got client token after login:", clientToken.slice(0, 10) + "...")
        setToken(clientToken)

        await initializeWebSocket(clientToken)
      } else {
        throw new Error("Failed to fetch user data after login")
      }
    } catch (error: any) {
      console.error("AuthContext: Login error:", error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    console.log("AuthContext: Logging out")
    try {
      await logoutAction()
      if (socket) {
        socket.disconnect()
      }
    } catch (error) {
      console.error("AuthContext: Logout error:", error)
    }
    setToken(null)
    setUserState(null)
    setIsAuthenticated(false)
    setError(null)
    setSocket(null)
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
        socket,
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
