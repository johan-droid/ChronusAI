import { useState } from 'react'
import { Calendar, Clock, Users } from 'lucide-react'
import AvailabilityCalendar from './AvailabilityCalendar'
import TimeSlotPicker from './TimeSlotPicker'
import Button from './Button'
import Input from './Input'
import { Card, CardContent, CardHeader, CardTitle } from './Card'

interface MeetingSchedulerProps {
  onSchedule: (meetingData: {
    date: Date
    time: string
    attendees: string[]
    title: string
    description?: string
  }) => void
  availableDates?: Date[]
  busyDates?: Date[]
  availableTimeSlots?: Array<{
    time: string
    available: boolean
    duration?: number
  }>
}

export default function MeetingScheduler({
  onSchedule,
  availableDates = [],
  busyDates = [],
  availableTimeSlots = []
}: MeetingSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attendees, setAttendees] = useState('')
  const [step, setStep] = useState(1)

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setStep(2)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep(3)
  }

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime || !title.trim()) return

    const attendeesList = attendees
      .split(',')
      .map(email => email.trim())
      .filter(email => email)

    onSchedule({
      date: selectedDate,
      time: selectedTime,
      attendees: attendeesList,
      title: title.trim(),
      description: description.trim() || undefined
    })

    // Reset form
    setStep(1)
    setSelectedDate(undefined)
    setSelectedTime(undefined)
    setTitle('')
    setDescription('')
    setAttendees('')
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedDate !== undefined
      case 2:
        return selectedTime !== undefined
      case 3:
        return title.trim().length > 0
      default:
        return false
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Select Date'
      case 2:
        return 'Select Time'
      case 3:
        return 'Meeting Details'
      default:
        return 'Schedule Meeting'
    }
  }

  const getStepIcon = () => {
    switch (step) {
      case 1:
        return <Calendar className="h-5 w-5" />
      case 2:
        return <Clock className="h-5 w-5" />
      case 3:
        return <Users className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= stepNumber
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {stepNumber}
            </div>
            {stepNumber < 3 && (
              <div
                className={`w-16 h-1 mx-2 transition-colors ${
                  step > stepNumber ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {getStepIcon()}
            <span className="ml-2">{getStepTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Select a date for your meeting. Available dates are highlighted in green.
              </p>
              <AvailabilityCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                availableDates={availableDates}
                busyDates={busyDates}
              />
            </div>
          )}

          {step === 2 && selectedDate && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Select a time slot for {selectedDate.toLocaleDateString()}.
              </p>
              <TimeSlotPicker
                date={selectedDate}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                timeSlots={availableTimeSlots}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Add meeting details for {selectedDate?.toLocaleDateString()} at {selectedTime}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Meeting Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter meeting title"
                    icon={<Users className="h-4 w-4" />}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add meeting description"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Attendees"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    placeholder="Enter email addresses, separated by commas"
                    icon={<Users className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Previous
        </Button>
        
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSchedule}
            disabled={!canProceed()}
          >
            Schedule Meeting
          </Button>
        )}
      </div>
    </div>
  )
}
