import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'

interface Props {
  weekdayAvg: Record<string, number>
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function SleepTimingChart({ weekdayAvg }: Props) {
  const safeWeekdayAvg = weekdayAvg || {}
  
  const data = useMemo(() => {
    return DAY_ORDER.map((day, idx) => ({
      day: DAY_SHORT[idx],
      fullDay: day,
      timing: safeWeekdayAvg[day] ? Math.round(safeWeekdayAvg[day]) : null,
      isWeekend: day === 'Saturday' || day === 'Sunday',
    }))
  }, [safeWeekdayAvg])

  const overallAvg = useMemo(() => {
    const values = Object.values(safeWeekdayAvg).filter(v => v != null)
    if (values.length === 0) return 0
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }, [safeWeekdayAvg])

  // Find best and worst days
  const { bestDay, worstDay } = useMemo(() => {
    let best = { day: '', score: -1 }
    let worst = { day: '', score: 101 }
    
    for (const [day, score] of Object.entries(safeWeekdayAvg)) {
      if (score == null) continue
      if (score > best.score) best = { day, score }
      if (score < worst.score) worst = { day, score }
    }
    
    return { bestDay: best.day, worstDay: worst.day }
  }, [safeWeekdayAvg])

  const chartData = useMemo(() => ({
    labels: data.map(d => d.day),
    datasets: [
      {
        data: data.map(d => d.timing),
        backgroundColor: '#6366f1',
        borderRadius: 4,
      },
    ],
  }), [data])

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
          title: (items) => data[items[0]?.dataIndex]?.fullDay || '',
          label: (ctx) => `Timing Score: ${ctx.parsed.y ?? '—'}`,
        },
      },
      annotation: {
        annotations: {
          avgLine: {
            type: 'line' as const,
            yMin: overallAvg,
            yMax: overallAvg,
            borderColor: '#94a3b8',
            borderWidth: 1,
            borderDash: [4, 4],
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
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
          display: false,
        },
      },
    },
  }), [data, overallAvg])

  if (Object.keys(weekdayAvg).length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
        No timing data available
      </div>
    )
  }

  return (
    <div>
      {/* Insights */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        {bestDay && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-success-50 rounded-lg">
            <span>🏆</span>
            <span className="text-success-700">Best: <span className="font-medium">{bestDay}</span></span>
          </div>
        )}
        {worstDay && worstDay !== bestDay && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg">
            <span>⚠️</span>
            <span className="text-amber-700">Needs work: <span className="font-medium">{worstDay}</span></span>
          </div>
        )}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg">
          <span>📊</span>
          <span className="text-gray-700">Average: <span className="font-mono font-medium">{overallAvg}</span></span>
        </div>
      </div>

      <div className="h-[200px]">
        <Bar data={chartData} options={options} />
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Timing score measures bedtime consistency. Higher = more consistent sleep schedule.
      </p>
    </div>
  )
}
