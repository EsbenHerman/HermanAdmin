import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '../api'
import { CalendarEvent } from '../types'
import { Card, PageHeader, Section } from '../../../shared/components/ui'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-SE', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

const WEEKDAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function MonthCalendar({ 
  year, 
  month, 
  events,
  selectedDate,
  onSelectDate,
}: { 
  year: number
  month: number 
  events: CalendarEvent[]
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get days in month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  // Get starting weekday (0 = Sunday, we want 0 = Monday)
  let startWeekday = firstDay.getDay() - 1
  if (startWeekday < 0) startWeekday = 6

  // Create event map for quick lookup - handles multi-day events
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {}
    const monthEnd = new Date(year, month + 1, 0)
    
    events.forEach(event => {
      const eventStart = new Date(event.start_time)
      const eventEnd = new Date(event.end_time)
      
      // Normalize to start of day for comparison
      eventStart.setHours(0, 0, 0, 0)
      eventEnd.setHours(0, 0, 0, 0)
      
      // For each day in the month, check if event spans it
      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const currentDay = new Date(year, month, day)
        
        // Event spans this day if: eventStart <= currentDay <= eventEnd
        if (currentDay >= eventStart && currentDay <= eventEnd) {
          if (!map[day]) map[day] = []
          // Avoid duplicates
          if (!map[day].find(e => e.id === event.id)) {
            map[day].push(event)
          }
        }
      }
    })
    return map
  }, [events, year, month])

  // Build calendar grid
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = []
  
  // Fill in blanks before first day
  for (let i = 0; i < startWeekday; i++) {
    week.push(null)
  }
  
  // Fill in days
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  
  // Fill remaining blanks
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null)
    }
    weeks.push(week)
  }

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1 sm:mb-2">
        {WEEKDAYS.map((day, i) => (
          <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-gray-500 py-1 sm:py-2">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {weeks.map((week, weekIdx) => (
          week.map((day, dayIdx) => {
            if (day === null) {
              return <div key={`${weekIdx}-${dayIdx}`} className="aspect-square" />
            }
            
            const dateObj = new Date(year, month, day)
            const isToday = isSameDay(dateObj, today)
            const isSelected = selectedDate && isSameDay(dateObj, selectedDate)
            const dayEvents = eventsByDay[day] || []
            const hasEvents = dayEvents.length > 0
            
            return (
              <button
                key={`${weekIdx}-${dayIdx}`}
                onClick={() => onSelectDate(dateObj)}
                className={`
                  aspect-square p-0.5 sm:p-1 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all
                  flex flex-col items-center justify-start
                  ${isToday ? 'bg-primary-100 text-primary-700' : ''}
                  ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''}
                  ${!isToday && !isSelected ? 'hover:bg-gray-100 active:bg-gray-200' : ''}
                  ${dateObj < today && !isToday ? 'text-gray-400' : 'text-gray-900'}
                `}
              >
                <span>{day}</span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                          dayEvents[i].all_day ? 'bg-purple-500' : 'bg-primary-500'
                        }`}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] sm:text-[10px] text-gray-400">+</span>
                    )}
                  </div>
                )}
              </button>
            )
          })
        ))}
      </div>
    </div>
  )
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className={`
          w-1 h-full min-h-[2.5rem] rounded-full
          ${event.all_day ? 'bg-purple-500' : 'bg-primary-500'}
        `} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{event.title}</p>
          <p className="text-sm text-gray-500">
            {event.all_day ? (
              'All day'
            ) : (
              `${formatTime(event.start_time)} – ${formatTime(event.end_time)}`
            )}
          </p>
          {event.location && (
            <p className="text-sm text-gray-400 truncate mt-0.5">
              📍 {event.location}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Fetch events for current month (with buffer for multi-day events)
  const fromDate = new Date(year, month, 1)
  const toDate = new Date(year, month + 1, 0)
  
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['calendar-events', year, month],
    queryFn: () => fetchEvents(
      fromDate.toISOString().split('T')[0],
      toDate.toISOString().split('T')[0]
    ),
  })

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Get events for selected date (including multi-day events that span this date)
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    
    return events.filter(event => {
      const eventStart = new Date(event.start_time)
      const eventEnd = new Date(event.end_time)
      eventStart.setHours(0, 0, 0, 0)
      eventEnd.setHours(0, 0, 0, 0)
      
      return selected >= eventStart && selected <= eventEnd
    })
  }, [events, selectedDate])

  // Get upcoming events (next 7 days from today)
  const upcomingEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate >= today && eventDate <= nextWeek
    }).slice(0, 5)
  }, [events])

  if (error) {
    return (
      <Card className="bg-danger-50 border-danger-200">
        <p className="text-danger-800">Error loading calendar: {(error as Error).message}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calendar"
        actions={
          <button
            onClick={goToToday}
            className="btn-secondary btn-sm"
          >
            Today
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Month Calendar */}
        <div className="lg:col-span-2">
          <Card padding="sm">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button
                onClick={goToPrevMonth}
                className="p-1.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-1.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <MonthCalendar
                year={year}
                month={month}
                events={events}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Selected Date Events */}
          {selectedDate && (
            <Section title={formatDate(selectedDate.toISOString())}>
              <Card padding="sm">
                {selectedDateEvents.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {selectedDateEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-3 sm:py-4 text-center">
                    No events on this day
                  </p>
                )}
              </Card>
            </Section>
          )}

          {/* Upcoming Events */}
          <Section title="Coming Up" subtitle="Next 7 days">
            <Card padding="sm">
              {upcomingEvents.length > 0 ? (
                <div>
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="py-2 border-b border-gray-100 last:border-0">
                      <p className="text-xs text-gray-400">{formatDate(event.start_time)}</p>
                      <p className="font-medium text-gray-900 text-sm truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.all_day ? 'All day' : formatTime(event.start_time)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-3 sm:py-4 text-center">
                  No upcoming events
                </p>
              )}
            </Card>
          </Section>
        </div>
      </div>
    </div>
  )
}
