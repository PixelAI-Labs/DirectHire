import { create } from 'zustand'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

let notificationId = 0

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: String(++notificationId) }],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
}))

export function useNotification() {
  const add = useNotificationStore((state) => state.addNotification)

  return {
    success: (message: string) => add({ type: 'success', message }),
    error: (message: string) => add({ type: 'error', message }),
    warning: (message: string) => add({ type: 'warning', message }),
    info: (message: string) => add({ type: 'info', message }),
  }
}
