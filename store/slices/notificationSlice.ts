import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface NotificationPayload {
  id: string
  type: string
  title: string
  message: string
  data?: any
  timestamp: string | Date
  read: boolean
}

interface NotificationState {
  notifications: NotificationPayload[]
  isConnected: boolean
  unreadCount: number
}

const initialState: NotificationState = {
  notifications: [],
  isConnected: false,
  unreadCount: 0,
}

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotificationPayload>) => {
      // Avoid duplicates
      const existingIndex = state.notifications.findIndex((n) => n.id === action.payload.id)
      if (existingIndex === -1) {
        state.notifications.unshift(action.payload)
        if (!action.payload.read) {
          state.unreadCount += 1
        }
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
    updateUnreadCount: (state) => {
      state.unreadCount = state.notifications.filter((n) => !n.read).length
    },
  },
})

export const {
  addNotification,
  markNotificationAsRead,
  clearAllNotifications,
  setConnectionStatus,
  updateUnreadCount,
} = notificationSlice.actions

export default notificationSlice.reducer
