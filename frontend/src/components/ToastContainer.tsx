import { useState, useEffect } from 'react'
import Toast from './Toast'

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (toasts.length > 0) {
      setExpanded(true)
    }
  }, [toasts.length])

  const handleRemove = (id: string) => {
    onRemove(id)
    if (toasts.length === 1) {
      setTimeout(() => setExpanded(false), 300)
    }
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out ${
      expanded ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={handleRemove}
          />
        ))}
      </div>
    </div>
  )
}
