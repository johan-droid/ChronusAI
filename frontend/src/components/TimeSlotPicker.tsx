import { useState } from 'react'
import { Clock, Check } from 'lucide-react'

interface TimeSlot {
  time: string
  available: boolean
  duration?: number
}

interface TimeSlotPickerProps {
  date: Date
  selectedTime?: string
  onTimeSelect: (time: string) => void
  timeSlots?: TimeSlot[]
  duration?: number
}

export default function TimeSlotPicker({ 
  selectedTime, 
  onTimeSelect, 
  timeSlots = [],
  duration = 30 
}: TimeSlotPickerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Generate default time slots if none provided
  const defaultTimeSlots: TimeSlot[] = timeSlots.length > 0 ? timeSlots : 
    Array.from({ length: 24 }, (_, hour) => ({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available: true,
      duration
    }))

  const groupedSlots = defaultTimeSlots.reduce((acc, slot) => {
    const hour = parseInt(slot.time.split(':')[0])
    const period = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
    
    if (!acc[period]) acc[period] = []
    acc[period].push(slot)
    
    return acc
  }, {} as Record<string, TimeSlot[]>)

  const handleTimeSelect = (time: string) => {
    if (defaultTimeSlots.find(slot => slot.time === time)?.available) {
      onTimeSelect(time)
    }
  }

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${period}`
  }

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Available Time Slots
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'grid' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {defaultTimeSlots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => handleTimeSelect(slot.time)}
              disabled={!slot.available}
              className={`p-2 text-sm rounded-md border transition-all ${
                selectedTime === slot.time
                  ? 'bg-primary text-primary-foreground border-primary'
                  : slot.available
                  ? 'hover:bg-accent hover:border-accent-foreground border-input'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              }`}
            >
              <div className="text-center">
                <div>{formatTimeDisplay(slot.time)}</div>
                {slot.duration && (
                  <div className="text-xs opacity-75">{slot.duration}m</div>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSlots).map(([period, slots]) => (
            <div key={period}>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">{period}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={`p-3 text-sm rounded-md border transition-all flex items-center justify-between ${
                      selectedTime === slot.time
                        ? 'bg-primary text-primary-foreground border-primary'
                        : slot.available
                        ? 'hover:bg-accent hover:border-accent-foreground border-input'
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>{formatTimeDisplay(slot.time)}</span>
                    {selectedTime === slot.time && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {defaultTimeSlots.filter(slot => slot.available).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No available time slots for this date</p>
          <p className="text-sm">Try selecting a different date</p>
        </div>
      )}
    </div>
  )
}
