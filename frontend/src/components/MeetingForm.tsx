import { useState } from 'react'
import { Calendar, Clock, Users } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import Textarea from './Textarea'
import Modal from './Modal'
import type { Meeting } from '../types'

interface MeetingFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (meeting: Partial<Meeting>) => void
  meeting?: Meeting
  loading?: boolean
}

export default function MeetingForm({ isOpen, onClose, onSubmit, meeting, loading = false }: MeetingFormProps) {
  const [formData, setFormData] = useState({
    title: meeting?.title || '',
    description: meeting?.description || '',
    start_time: meeting?.start_time ? new Date(meeting.start_time).toISOString().slice(0, 16) : '',
    end_time: meeting?.end_time ? new Date(meeting.end_time).toISOString().slice(0, 16) : '',
    attendees: meeting?.attendees?.map(a => a.email).join(', ') || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required'
    }
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required'
    }
    if (formData.start_time && formData.end_time && new Date(formData.start_time) >= new Date(formData.end_time)) {
      newErrors.end_time = 'End time must be after start time'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const attendees = formData.attendees
      .split(',')
      .map(email => email.trim())
      .filter(email => email)
      .map(email => ({ email, name: email.split('@')[0] }))

    onSubmit({
      ...formData,
      attendees,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString()
    })
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={meeting ? 'Edit Meeting' : 'Create Meeting'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={handleChange('title')}
            error={errors.title}
            placeholder="Meeting title"
            icon={<Calendar className="h-4 w-4" />}
          />
          
          <Input
            label="Duration"
            value={formData.end_time && formData.start_time ? 
              Math.round((new Date(formData.end_time).getTime() - new Date(formData.start_time).getTime()) / 60000) + ' minutes' : 
              ''
            }
            disabled
            icon={<Clock className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="datetime-local"
            value={formData.start_time}
            onChange={handleChange('start_time')}
            error={errors.start_time}
          />
          
          <Input
            label="End Time"
            type="datetime-local"
            value={formData.end_time}
            onChange={handleChange('end_time')}
            error={errors.end_time}
          />
        </div>

        <Textarea
          label="Description"
          value={formData.description}
          onChange={handleChange('description')}
          placeholder="Meeting description (optional)"
          rows={3}
        />

        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
            Attendees
          </label>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Input
                value={formData.attendees}
                onChange={handleChange('attendees')}
                placeholder="Enter email addresses, separated by commas"
                label=""
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Add email addresses separated by commas
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {meeting ? 'Update Meeting' : 'Create Meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
