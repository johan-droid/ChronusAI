import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Users } from 'lucide-react'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import TimeSlotPicker from '../components/TimeSlotPicker'
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import Button from '../components/Button'
import { useAuthStore } from '../store/authStore'

export default function Availability() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [busyDates, setBusyDates] = useState<Date[]>([])
  const [timeSlots, setTimeSlots] = useState<Array<{time: string, available: boolean, duration?: number}>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        navigate('/login')
        return
      }

      try {
        // Mock availability data - in real app, fetch from API
        const today = new Date()
        const mockAvailableDates = Array.from({ length: 14 }, (_, i) => {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          return date
        }).filter(date => date.getDay() !== 0 && date.getDay() !== 6) // Weekdays only

        const mockBusyDates = Array.from({ length: 5 }, (_, i) => {
          const date = new Date(today)
          date.setDate(today.getDate() + i * 3)
          return date
        })

        setAvailableDates(mockAvailableDates)
        setBusyDates(mockBusyDates)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load availability:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    
    // Mock time slots for selected date
    const mockTimeSlots = Array.from({ length: 24 }, (_, hour) => ({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available: Math.random() > 0.3, // 70% availability
      duration: 30
    }))
    
    setTimeSlots(mockTimeSlots)
  }

  const handleTimeSelect = (time: string) => {
    // Navigate to meeting scheduler with pre-selected date and time
    navigate('/dashboard', { 
      state: { 
        selectedDate, 
        selectedTime: time,
        action: 'schedule' 
      } 
    })
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 animate-spin" />
          <p>Loading availability...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Check Availability
              </h1>
              <p className="text-muted-foreground">
                {user?.full_name || user?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                availableDates={availableDates}
                busyDates={busyDates}
              />
            </CardContent>
          </Card>

          {/* Time Slots */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Available Time Slots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Selected date: <span className="font-medium text-foreground">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </p>
                </div>
                
                <TimeSlotPicker
                  date={selectedDate}
                  selectedTime={undefined}
                  onTimeSelect={handleTimeSelect}
                  timeSlots={timeSlots}
                />

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Quick Tips
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Green slots are available for booking</li>
                    <li>• Red slots are already booked</li>
                    <li>• Click any available slot to schedule</li>
                    <li>• Meetings are scheduled in your timezone</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Availability Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {availableDates.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available Days
                  </div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {busyDates.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Busy Days
                  </div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((availableDates.length / (availableDates.length + busyDates.length)) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Availability Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
