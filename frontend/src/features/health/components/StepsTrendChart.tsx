import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
import type { ScoreHistoryPoint } from '../types'

interface Props {
  history: ScoreHistoryPoint[]
  days?: number
}

const STEP_GOAL = 10000

export default function StepsTrendChart({ history, days = 14 }: Props) {
  const data = useMemo(() => {
    if (!history || history.length === 0) return []

    // Take last N days and reverse to chronological order
    const recent = history.slice(0, days).reverse()

    return recent.map(p => {
      const d = new Date(p.day)
      return {
        day: p.day,
        displayDay: d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric' }),
        steps: p.steps || 0,
        metGoal: (p.steps || 0) >= STEP_GOAL,
      }
    })
  }, [history, days])

  const avgSteps = useMemo(() => {
    if (data.length === 0) return 0
    const total = data.reduce((sum, d) => sum + d.steps, 0)
    return Math.round(total / data.length)
  }, [data])

  const chartData = useMemo(() => ({
    labels: data.map(d => d.displayDay),
    datasets: [
      {
        data: data.map(d => d.steps),
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
          label: (ctx) => `Steps: ${(ctx.parsed.y ?? 0).toLocaleString()}`,
        },
      },
      annotation: {
        annotations: {
          goalLine: {
            type: 'line' as const,
            yMin: STEP_GOAL,
            yMax: STEP_GOAL,
            borderColor: '#10b981',
            borderWidth: 1.5,
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
          font: { size: 10 },
          color: '#737373',
          maxRotation: 45,
          minRotation: 45,
        },
        border: {
          color: '#e8e8e8',
        },
      },
      y: {
        grid: {
          color: '#e8e8e8',
        },
        ticks: {
          font: { size: 10 },
          color: '#737373',
          callback: (value) => {
            const v = Number(value)
            return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          },
        },
        border: {
          display: false,
        },
      },
    },
  }), [])

  if (!history || history.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
        No steps data available
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">
          Avg: <span className="font-mono font-medium text-gray-700">{avgSteps.toLocaleString()}</span> steps/day
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-success-500 rounded-full" />
          Goal: {STEP_GOAL.toLocaleString()}
        </div>
      </div>

      <div className="h-[200px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
