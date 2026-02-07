import { useState, useCallback, useMemo } from 'react'
import {
  LineChart,
  Line,
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
type ViewMode = 'daily' | 'ma7' | 'ma30'

// Mercury-style coordinated colors
const SERIES_CONFIG: Record<SeriesKey, { name: string; color: string }> = {
  sleep_score: { name: 'Sleep', color: '#6366f1' },
  readiness_score: { name: 'Readiness', color: '#f59e0b' },
  activity_score: { name: 'Activity', color: '#10b981' },
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'ma7', label: 'MA7' },
  { value: 'ma30', label: 'MA30' },
]

function calculateMA(
  data: ScoreHistoryPoint[],
  index: number,
  key: SeriesKey,
  window: number
): number | null {
  const half = Math.floor(window / 2)
  const values: number[] = []
  for (let i = index - half; i <= index + half; i++) {
    if (i >= 0 && i < data.length) {
      const val = data[i][key]
      if (val != null) values.push(val)
    }
  }
  if (values.length === 0) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

export default function HealthScoreChart({ history }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('ma7')
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

  const data = useMemo(() => {
    if (!history || history.length === 0) return []

    const formatDate = (day: string) => {
      const d = new Date(day)
      return d.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
    }

    if (viewMode === 'daily') {
      return history.map(p => ({
        ...p,
        displayDay: formatDate(p.day),
      }))
    }

    const window = viewMode === 'ma7' ? 7 : 30
    return history.map((p, i) => ({
      day: p.day,
      displayDay: formatDate(p.day),
      sleep_score: calculateMA(history, i, 'sleep_score', window),
      readiness_score: calculateMA(history, i, 'readiness_score', window),
      activity_score: calculateMA(history, i, 'activity_score', window),
    }))
  }, [history, viewMode])

  if (!history || history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No history data available
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
    <div>
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {VIEW_MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          <XAxis 
            dataKey="displayDay" 
            tick={{ fontSize: 12, fill: '#737373' }}
            axisLine={{ stroke: '#e8e8e8' }}
            tickLine={{ stroke: '#e8e8e8' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 12, fill: '#737373' }}
            axisLine={{ stroke: '#e8e8e8' }}
            tickLine={{ stroke: '#e8e8e8' }}
          />
          <Tooltip 
            formatter={(value) => [value ?? 0, '']}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
            }}
          />
          <Legend content={renderLegend} />
          {(Object.keys(SERIES_CONFIG) as SeriesKey[]).map(key => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={SERIES_CONFIG[key].name}
              stroke={SERIES_CONFIG[key].color}
              strokeWidth={2}
              dot={false}
              connectNulls
              hide={!visibleSeries[key]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
