// Utility functions for notification handling

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

export const showBrowserNotification = (title: string, message: string, icon?: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: icon || "/hospital-icon.png",
      badge: "/notification-badge.png",
      tag: "insurance-notification",
      requireInteraction: true,
    })
  }
}

export const formatNotificationTime = (timestamp: string | Date): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return "Just now"
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `${days}d ago`
  }
}

export const getNotificationTypeColor = (type: string): string => {
  switch (type) {
    case "INSURANCE_SELECTED":
      return "bg-blue-100 text-blue-800"
    case "INSURANCE_CONFIRMED":
      return "bg-green-100 text-green-800"
    case "INSURANCE_REJECTED":
      return "bg-red-100 text-red-800"
    case "INSURANCE_CLAIM_RESPONSE":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getNotificationIcon = (type: string): string => {
  switch (type) {
    case "INSURANCE_SELECTED":
      return "ℹ️"
    case "INSURANCE_CONFIRMED":
      return "✅"
    case "INSURANCE_REJECTED":
      return "❌"
    case "INSURANCE_CLAIM_RESPONSE":
      return "📋"
    default:
      return "🔔"
  }
}
