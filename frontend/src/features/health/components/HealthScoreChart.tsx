import { useState, useCallback, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
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

function isSeriesKey(key: string): key is SeriesKey {
  return key === 'sleep_score' || key === 'readiness_score' || key === 'activity_score'
}

export default function HealthScoreChart({ history }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('ma7')
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    sleep_score: true,
    readiness_score: true,
    activity_score: true,
  })

  const handleLegendClick = useCallback((dataKey: string) => {
    if (isSeriesKey(dataKey)) {
      setVisibleSeries(prev => ({
        ...prev,
        [dataKey]: !prev[dataKey],
      }))
    }
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

  const chartData = useMemo(() => ({
    labels: data.map(d => d.displayDay),
    datasets: (Object.keys(SERIES_CONFIG) as SeriesKey[])
      .filter(key => visibleSeries[key])
      .map(key => ({
        label: SERIES_CONFIG[key].name,
        data: data.map(d => d[key] ?? null),
        borderColor: SERIES_CONFIG[key].color,
        backgroundColor: SERIES_CONFIG[key].color,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        spanGaps: true,
      })),
  }), [data, visibleSeries])

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex
            if (idx !== undefined) {
              return `Date: ${data[idx]?.displayDay || ''}`
            }
            return ''
          },
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y ?? 0}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#e8e8e8',
        },
        ticks: {
          font: { size: 10 },
          color: '#737373',
          maxTicksLimit: 8,
        },
        border: {
          color: '#e8e8e8',
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: '#e8e8e8',
        },
        ticks: {
          font: { size: 10 },
          color: '#737373',
        },
        border: {
          color: '#e8e8e8',
        },
      },
    },
  }), [data])

  if (!history || history.length === 0) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500 text-sm">
        No history data available
      </div>
    )
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-3 sm:mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 sm:p-1">
          {VIEW_MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setViewMode(value); }}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
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

      <div className="h-[200px] sm:h-[300px]">
        <Line data={chartData} options={options} />
      </div>

      {/* Custom Legend */}
      <div className="flex justify-center gap-2 sm:gap-4 mt-3 sm:mt-4 flex-wrap">
        {(Object.keys(SERIES_CONFIG) as SeriesKey[]).map(key => {
          const config = SERIES_CONFIG[key]
          const isVisible = visibleSeries[key]
          return (
            <button
              key={key}
              onClick={() => { handleLegendClick(key); }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all ${
                isVisible 
                  ? 'opacity-100 hover:bg-gray-100' 
                  : 'opacity-40 line-through hover:bg-gray-50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700">{config.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
