import { useState, useCallback, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
import type { SleepBreakdownPoint } from '../types'

interface Props {
  breakdown: SleepBreakdownPoint[]
}

type SeriesKey = 'deep_sleep' | 'rem_sleep' | 'efficiency' | 'latency' | 'restfulness' | 'timing' | 'total_sleep'

// Color palette for sleep components
const SERIES_CONFIG: Record<SeriesKey, { name: string; color: string }> = {
  deep_sleep: { name: 'Deep Sleep', color: '#6366f1' },
  rem_sleep: { name: 'REM Sleep', color: '#8b5cf6' },
  efficiency: { name: 'Efficiency', color: '#10b981' },
  latency: { name: 'Latency', color: '#f59e0b' },
  restfulness: { name: 'Restfulness', color: '#ec4899' },
  timing: { name: 'Timing', color: '#06b6d4' },
  total_sleep: { name: 'Total Sleep', color: '#3b82f6' },
}

// Default visible series (most important ones)
const DEFAULT_VISIBLE: Record<SeriesKey, boolean> = {
  deep_sleep: true,
  rem_sleep: true,
  efficiency: true,
  latency: false,
  restfulness: false,
  timing: false,
  total_sleep: false,
}

function isSeriesKey(key: string): key is SeriesKey {
  return key in SERIES_CONFIG
}

export default function SleepBreakdownChart({ breakdown }: Props) {
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>(DEFAULT_VISIBLE)

  const handleLegendClick = useCallback((dataKey: string) => {
    if (isSeriesKey(dataKey)) {
      setVisibleSeries(prev => ({
        ...prev,
        [dataKey]: !prev[dataKey],
      }))
    }
  }, [])

  const data = useMemo(() => {
    if (!breakdown || breakdown.length === 0) return []

    const formatDate = (day: string) => {
      const d = new Date(day)
      return d.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
    }

    return breakdown.map(p => ({
      ...p,
      displayDay: formatDate(p.day),
    }))
  }, [breakdown])

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
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y ?? '—'}`,
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

  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500 text-sm">
        No sleep data available
      </div>
    )
  }

  return (
    <div>
      <div className="h-[200px] sm:h-[280px]">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Custom Legend */}
      <div className="flex justify-center gap-1 sm:gap-2 mt-3 sm:mt-4 flex-wrap">
        {(Object.keys(SERIES_CONFIG) as SeriesKey[]).map(key => {
          const config = SERIES_CONFIG[key]
          const isVisible = visibleSeries[key]
          return (
            <button
              key={key}
              onClick={() => { handleLegendClick(key); }}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all text-xs ${
                isVisible 
                  ? 'opacity-100 hover:bg-gray-100' 
                  : 'opacity-40 hover:bg-gray-50'
              }`}
            >
              <span
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <span className={`font-medium text-gray-700 ${!isVisible ? 'line-through' : ''}`}>
                {config.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
