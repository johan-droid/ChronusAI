import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns'

interface AvailabilityCalendarProps {
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  availableDates?: Date[]
  busyDates?: Date[]
}

export default function AvailabilityCalendar({ 
  selectedDate, 
  onDateSelect, 
  availableDates = [], 
  busyDates = [] 
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = useMemo(() => {
    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }, [startDate, endDate])

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const getDayStatus = (day: Date) => {
    if (isToday(day)) return 'today'
    if (busyDates.some(date => isSameDay(date, day))) return 'busy'
    if (availableDates.some(date => isSameDay(date, day))) return 'available'
    return 'normal'
  }

  const getDayClasses = (day: Date) => {
    const status = getDayStatus(day)
    const isSelected = selectedDate && isSameDay(day, selectedDate)
    const isCurrentMonth = isSameMonth(day, currentMonth)

    const baseClasses = 'h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer'
    
    if (isSelected) {
      return `${baseClasses} bg-primary text-primary-foreground`
    }

    const statusClasses = {
      today: 'bg-primary/10 text-primary ring-2 ring-primary/20',
      busy: 'bg-destructive/10 text-destructive line-through',
      available: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      normal: 'hover:bg-accent hover:text-accent-foreground'
    }

    const monthClasses = isCurrentMonth ? '' : 'text-muted-foreground opacity-50'

    return `${baseClasses} ${statusClasses[status]} ${monthClasses}`
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-card border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => onDateSelect(day)}
            className={getDayClasses(day)}
            disabled={getDayStatus(day) === 'busy'}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t space-y-2">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900/20"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-destructive/10"></div>
          <span>Busy</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-primary/10 ring-2 ring-primary/20"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
