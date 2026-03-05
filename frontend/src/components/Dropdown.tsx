import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface DropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  separator?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export default function Dropdown({ trigger, items, align = 'left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && !item.separator) {
      item.onClick?.()
      setIsOpen(false)
    }
  }

  const alignClasses = align === 'right' ? 'right-0' : 'left-0'

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-background border border-input rounded-md hover:bg-accent transition-colors"
      >
        {trigger}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full mt-1 w-48 bg-background border border-input rounded-md shadow-lg z-50 ${alignClasses}`}>
          {items.map((item, index) => {
            if (item.separator) {
              return (
                <div key={`separator-${index}`} className="h-px bg-muted my-1" />
              )
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-sm text-left transition-colors ${
                  item.disabled
                    ? 'text-muted-foreground cursor-not-allowed'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
