import { API_BASE } from '../../shared/api/client'
import type { CalendarEvent, UpcomingResponse } from './types'

export async function fetchUpcomingEvents(days = 30, limit = 50): Promise<UpcomingResponse> {
  const res = await fetch(`${API_BASE}/calendar/upcoming?days=${String(days)}&limit=${String(limit)}`)
  if (!res.ok) throw new Error('Failed to fetch upcoming events')
  return res.json() as Promise<UpcomingResponse>
}

export async function fetchEvents(from?: string, to?: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const url = `${API_BASE}/calendar/events${params.size > 0 ? '?' + params.toString() : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json() as Promise<CalendarEvent[]>
}
