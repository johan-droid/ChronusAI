export interface User {
  id: string;
  email: string;
  full_name?: string;
  timezone: string;
  provider: 'google' | 'outlook' | 'zoom' | 'email';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  email: string;
  name?: string;
  response_status?: string;
}

export interface Meeting {
  id: string;
  user_id: string;
  external_event_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  attendees: Attendee[];
  status: 'scheduled' | 'canceled' | 'rescheduled' | 'pending';
  provider: 'google' | 'outlook' | 'zoom' | 'email';
  meeting_url?: string;
  raw_user_input?: string;
  reminder_schedule_minutes?: number[];
  reminder_methods?: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  meeting?: Meeting;
  meetings?: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time?: string;
  }>;
  availability?: Array<{
    start: string;
    end: string;
  }>;
  suggestions?: Array<{
    time: string;
    confidence?: number;
    reason?: string;
  }>;
  intent?: string;
  reminder_confirmed?: boolean;
}

export interface ChatRequest {
  message: string;
  reminder_schedule_minutes?: number[];
  reminder_methods?: string[];
}

export interface ChatResponse {
  response: string;
  intent: string;
  meeting?: Meeting;
  requires_clarification: boolean;
  reminder_confirmed?: boolean;
  meetings?: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time?: string;
  }>;
  availability?: Array<{
    start: string;
    end: string;
  }>;
  suggestions?: Array<{
    time: string;
    confidence?: number;
    reason?: string;
  }>;
  confidence?: number;
}

export interface AuthUrlResponse {
  auth_url: string;
  state?: string;
  verifier?: string;
}

export type SlotStatus = 'available' | 'busy' | 'past';

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  status: SlotStatus;
  timezone: string;
}

export interface AvailabilityResponse {
  date: string;
  timezone: string;
  slots: TimeSlot[];
  available_count: number;
  busy_count: number;
  past_count: number;
}
