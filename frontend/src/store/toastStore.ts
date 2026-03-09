import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    
    // Auto remove after duration
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || 3000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clearAll: () => set({ toasts: [] }),
}));

// Helper functions for common toasts
export const showSuccess = (message: string, duration?: number) => {
  useToastStore.getState().addToast({ type: 'success', message, duration });
};

export const showError = (message: string, duration?: number) => {
  useToastStore.getState().addToast({ type: 'error', message, duration });
};

export const showInfo = (message: string, duration?: number) => {
  useToastStore.getState().addToast({ type: 'info', message, duration });
};

export const showWarning = (message: string, duration?: number) => {
  useToastStore.getState().addToast({ type: 'warning', message, duration });
};
