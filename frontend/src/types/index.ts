export interface User {
  id: string;
  email: string;
  full_name?: string;
  timezone: string;
  provider: 'google' | 'outlook';
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
  provider: 'google' | 'outlook';
  raw_user_input?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
  intent: string;
  meeting?: Meeting;
  requires_clarification: boolean;
}

export interface AuthUrlResponse {
  auth_url: string;
}
