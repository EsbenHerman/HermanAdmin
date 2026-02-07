import { useState, useCallback, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
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

function isSeriesKey(key: string): key is SeriesKey {
  return key === 'sleep_score' || key === 'readiness_score' || key === 'activity_score'
}

export default function WeekdayAveragesChart({ history }: Props) {
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

  const chartData = useMemo(() => ({
    labels: weekdayAverages.map(d => d.weekday),
    datasets: (Object.keys(SERIES_CONFIG) as SeriesKey[])
      .filter(key => visibleSeries[key])
      .map(key => ({
        label: SERIES_CONFIG[key].name,
        data: weekdayAverages.map(d => d[key]),
        backgroundColor: SERIES_CONFIG[key].color,
        borderRadius: 3,
      })),
  }), [weekdayAverages, visibleSeries])

  const options: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
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
  }), [])

  if (!history || history.length === 0) {
    return (
      <div className="h-40 sm:h-48 flex items-center justify-center text-gray-500 text-sm">
        No data available
      </div>
    )
  }

  return (
    <div>
      <div className="h-[180px] sm:h-[220px]">
        <Bar data={chartData} options={options} />
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
