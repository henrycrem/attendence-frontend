"use client"

import { useSelector } from "react-redux"
import type { RootState } from "../store"

export default function WebSocketStatus() {
  const isConnected = useSelector((state: RootState) => state.notifications.isConnected)
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:6001"

  return (
    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
        <span className="text-sm text-gray-600">WebSocket: {isConnected ? "Connected" : "Disconnected"}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">Server: {wsUrl}</p>
    </div>
  )
}
