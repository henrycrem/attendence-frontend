"use client"

import { useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { useDispatch } from "react-redux"
import { addNotification, setConnectionStatus } from "../store/slices/notificationSlice"
import type { NotificationPayload } from "../libs/types/insurance-billing"

export function useWebSocket(isAuthenticated: boolean, token: string | null): Socket | null {
  const socketRef = useRef<Socket | null>(null)
  const dispatch = useDispatch()

  useEffect(() => {
    console.log("useWebSocket: Auth status:", isAuthenticated)
    console.log("useWebSocket: Token available:", token ? token.slice(0, 10) + "..." : "null")

    if (!isAuthenticated) {
      console.error("useWebSocket: User not authenticated")
      dispatch(setConnectionStatus(false))
      return
    }

    if (!token) {
      console.error("useWebSocket: No token available")
      dispatch(setConnectionStatus(false))
      return
    }

    // Use the correct WebSocket URL (your backend server port)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:6001"
    console.log("useWebSocket: Connecting to:", wsUrl)

    const socket = io(wsUrl, {
      auth: { token }, // Pass the token in the auth object as expected by your server
      withCredentials: true,
      transports: ["websocket", "polling"], // Fallback to polling if websocket fails
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000, // 10 second timeout
    })

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("WebSocket connected:", socket.id)
      dispatch(setConnectionStatus(true))
    })

    // EXISTING: Insurance claim notifications
    socket.on("insurance_claim_submission", (notification: NotificationPayload) => {
      console.log("Received insurance_claim_submission:", notification)
      dispatch(addNotification(notification))
    })

    socket.on("insurance_claim_response", (notification: NotificationPayload) => {
      console.log("Received insurance_claim_response:", notification)
      dispatch(addNotification(notification))
    })

    // 🔥 FIX #1: ADD THIS MISSING EVENT LISTENER
    socket.on("insurance_response_received", (notification: NotificationPayload) => {
      console.log("🏥 Hospital received insurance_response_received:", notification)
      dispatch(addNotification(notification))

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/hospital-icon.png",
        })
      }
    })

    // NEW: Insurance selection notifications
    socket.on("insurance_selection_notification", (notification: NotificationPayload) => {
      console.log("Received insurance_selection_notification:", notification)
      dispatch(addNotification(notification))
    })

    socket.on("insurance_selection_confirmed", (notification: NotificationPayload) => {
      console.log("Received insurance_selection_confirmed:", notification)
      dispatch(addNotification(notification))
    })

    socket.on("insurance_selection_error", (notification: NotificationPayload) => {
      console.log("Received insurance_selection_error:", notification)
      dispatch(addNotification(notification))
    })

    socket.on("connect_error", (error) => {
      console.error("WebSocket connect_error:", error.message)
      console.error("WebSocket connect_error details:", error)
      dispatch(setConnectionStatus(false))
    })

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason)
      dispatch(setConnectionStatus(false))
    })

    socket.on("reconnect", (attemptNumber) => {
      console.log("WebSocket reconnected after", attemptNumber, "attempts")
      dispatch(setConnectionStatus(true))
    })

    socket.on("reconnect_error", (error) => {
      console.error("WebSocket reconnect_error:", error)
    })

    socket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed after maximum attempts")
      dispatch(setConnectionStatus(false))
    })

    return () => {
      console.log("useWebSocket: Cleaning up connection")
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      dispatch(setConnectionStatus(false))
    }
  }, [isAuthenticated, token, dispatch])

  return socketRef.current
}
