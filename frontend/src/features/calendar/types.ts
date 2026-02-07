// Calendar event
export interface CalendarEvent {
  id: number
  google_id: string
  title: string
  description?: string
  start_time: string // ISO 8601
  end_time: string // ISO 8601
  all_day: boolean
  location?: string
  status: 'confirmed' | 'tentative' | 'cancelled'
  created_at: string
  updated_at: string
}

// Response from /calendar/upcoming
export interface UpcomingResponse {
  events: CalendarEvent[]
  count: number
}
