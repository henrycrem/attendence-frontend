"use client"

import { useAuth } from "../contexts/AuthContext"
import { useSelector } from "react-redux"
import type { RootState } from "../store"

export default function WebSocketDebug() {
  const { isAuthenticated, token, user } = useAuth()
  const isConnected = useSelector((state: RootState) => state.notifications.isConnected)
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:6001"

  return (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-medium text-yellow-800 mb-2">WebSocket Debug Information</h3>
      <div className="space-y-1 text-sm">
        <p className="text-yellow-700">
          <strong>Auth Status:</strong> {isAuthenticated ? "✅ Authenticated" : "❌ Not Authenticated"}
        </p>
        <p className="text-yellow-700">
          <strong>Token Available:</strong> {token ? "✅ Yes" : "❌ No"}
        </p>
        <p className="text-yellow-700">
          <strong>User ID:</strong> {user?.id || "Unknown"}
        </p>
        <p className="text-yellow-700">
          <strong>WebSocket URL:</strong> {wsUrl}
        </p>
        <p className="text-yellow-700">
          <strong>Connection Status:</strong> {isConnected ? "✅ Connected" : "❌ Disconnected"}
        </p>
        {token && (
          <p className="text-yellow-700">
            <strong>Token Preview:</strong> {token.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  )
}
