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
      <div className="h-40 sm:h-48 flex items-center justify-center text-gray-500 text-sm">
        No data available
      </div>
    )
  }

  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex justify-center gap-2 sm:gap-4 mt-3 sm:mt-4 flex-wrap">
        {payload.map((entry: any, index: number) => {
          const key = entry.dataKey as SeriesKey
          const isVisible = visibleSeries[key]
          return (
            <button
              key={`legend-${index}`}
              onClick={() => handleLegendClick(entry.dataKey)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all ${
                isVisible 
                  ? 'opacity-100 hover:bg-gray-100' 
                  : 'opacity-40 line-through hover:bg-gray-50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700">{entry.value}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={180} className="!h-[180px] sm:!h-[220px]">
      <BarChart data={weekdayAverages} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
        <XAxis 
          dataKey="weekday" 
          tick={{ fontSize: 10, fill: '#737373' }}
          axisLine={{ stroke: '#e8e8e8' }}
          tickLine={{ stroke: '#e8e8e8' }}
          tickMargin={8}
        />
        <YAxis 
          domain={[0, 100]} 
          tick={{ fontSize: 10, fill: '#737373' }}
          axisLine={{ stroke: '#e8e8e8' }}
          tickLine={{ stroke: '#e8e8e8' }}
          width={30}
        />
        <Tooltip 
          formatter={(value) => [value ?? 0, '']}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
            fontSize: '12px'
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
            radius={[3, 3, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
