import { useState } from 'react'

interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove after duration (default 5 seconds)
    const duration = notification.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const showSuccess = (title: string, message?: string) => {
    return addNotification({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    return addNotification({ type: 'error', title, message, duration: 8000 })
  }

  const showInfo = (title: string, message?: string) => {
    return addNotification({ type: 'info', title, message })
  }

  const showWarning = (title: string, message?: string) => {
    return addNotification({ type: 'warning', title, message })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }
}
