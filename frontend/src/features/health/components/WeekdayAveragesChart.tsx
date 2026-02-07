import { useState, useCallback, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ScoreHistoryPoint } from '../types'

interface Props {
  history: ScoreHistoryPoint[]
}

type SeriesKey = 'sleep_score' | 'readiness_score' | 'activity_score'

// Mercury-style coordinated colors
const SERIES_CONFIG: Record<SeriesKey, { name: string; color: string }> = {
  sleep_score: { name: 'Sleep', color: '#6366f1' },
  readiness_score: { name: 'Readiness', color: '#f59e0b' },
  activity_score: { name: 'Activity', color: '#10b981' },
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface WeekdayAverage {
  weekday: string
  weekdayIndex: number
  sleep_score: number
  readiness_score: number
  activity_score: number
}

export default function WeekdayAveragesChart({ history }: Props) {
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    sleep_score: true,
    readiness_score: true,
    activity_score: true,
  })

  const handleLegendClick = useCallback((dataKey: string) => {
    setVisibleSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey as SeriesKey],
    }))
  }, [])

  const weekdayAverages = useMemo(() => {
    if (!history || history.length === 0) return []

    const groups: Record<number, { sleep: number[]; readiness: number[]; activity: number[] }> = {}
    for (let i = 0; i < 7; i++) {
      groups[i] = { sleep: [], readiness: [], activity: [] }
    }

    history.forEach(point => {
      const date = new Date(point.day)
      const weekdayIndex = (date.getDay() + 6) % 7

      if (point.sleep_score != null) {
        groups[weekdayIndex].sleep.push(point.sleep_score)
      }
      if (point.readiness_score != null) {
        groups[weekdayIndex].readiness.push(point.readiness_score)
      }
      if (point.activity_score != null) {
        groups[weekdayIndex].activity.push(point.activity_score)
      }
    })

    const result: WeekdayAverage[] = []
    for (let i = 0; i < 7; i++) {
      const g = groups[i]
      result.push({
        weekday: WEEKDAY_NAMES[i],
        weekdayIndex: i,
        sleep_score: g.sleep.length > 0 
          ? Math.round(g.sleep.reduce((a, b) => a + b, 0) / g.sleep.length) 
          : 0,
        readiness_score: g.readiness.length > 0 
          ? Math.round(g.readiness.reduce((a, b) => a + b, 0) / g.readiness.length) 
          : 0,
        activity_score: g.activity.length > 0 
          ? Math.round(g.activity.reduce((a, b) => a + b, 0) / g.activity.length) 
          : 0,
      })
    }

    return result
  }, [history])

  if (!history || history.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const key = entry.dataKey as SeriesKey
          const isVisible = visibleSeries[key]
          return (
            <button
              key={`legend-${index}`}
              onClick={() => handleLegendClick(entry.dataKey)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                isVisible 
                  ? 'opacity-100 hover:bg-gray-100' 
                  : 'opacity-40 line-through hover:bg-gray-50'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-gray-700">{entry.value}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={weekdayAverages}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
        <XAxis 
          dataKey="weekday" 
          tick={{ fontSize: 12, fill: '#737373' }}
          axisLine={{ stroke: '#e8e8e8' }}
          tickLine={{ stroke: '#e8e8e8' }}
        />
        <YAxis 
          domain={[0, 100]} 
          tick={{ fontSize: 12, fill: '#737373' }}
          axisLine={{ stroke: '#e8e8e8' }}
          tickLine={{ stroke: '#e8e8e8' }}
        />
        <Tooltip 
          formatter={(value) => [value ?? 0, '']}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
          }}
        />
        <Legend content={renderLegend} />
        {(Object.keys(SERIES_CONFIG) as SeriesKey[]).map(key => (
          <Bar
            key={key}
            dataKey={key}
            name={SERIES_CONFIG[key].name}
            fill={SERIES_CONFIG[key].color}
            hide={!visibleSeries[key]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
