import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Line } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
import { fetchBodyMetrics } from '../api'
import { Card } from '../../../shared/components/ui'
import type { BodyMetrics } from '../types'

function TrendArrow({ 
  trend, 
  delta, 
  inverted = false 
}: { 
  trend: 'up' | 'down' | 'stable'
  delta: number | string
  inverted?: boolean // For RHR where down is good
}) {
  if (trend === 'stable') {
    return <span className="text-gray-400 text-sm">→</span>
  }
  
  const isPositive = inverted ? trend === 'down' : trend === 'up'
  const color = isPositive ? 'text-success-600' : 'text-amber-600'
  const arrow = trend === 'up' ? '↑' : '↓'
  const sign = trend === 'up' ? '+' : ''
  
  return (
    <span className={`${color} text-sm flex items-center gap-0.5`}>
      {arrow} <span className="font-mono text-xs">{sign}{delta}</span>
    </span>
  )
}

interface MetricCardProps {
  emoji: string
  label: string
  value?: number | null
  unit: string
  avg7d: number
  avg30d: number
  trend: 'up' | 'down' | 'stable'
  trendDelta: number | string
  inverted?: boolean
  format?: (v: number) => string
  description?: string
}

function MetricCard({ 
  emoji, 
  label, 
  value, 
  unit, 
  avg7d, 
  avg30d, 
  trend, 
  trendDelta, 
  inverted,
  format = (v) => v.toString(),
  description
}: MetricCardProps) {
  const getScoreBg = () => {
    if (value == null) return 'bg-gray-50'
    return 'bg-primary-50'
  }

  return (
    <Card padding="sm">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${getScoreBg()} flex items-center justify-center flex-shrink-0`}>
          <span className="text-xl">{emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono tabular-nums text-gray-900">
              {value != null ? format(value) : '—'}
            </p>
            <span className="text-gray-500 text-sm">{unit}</span>
            <TrendArrow trend={trend} delta={trendDelta} inverted={inverted} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            7d: <span className="font-mono">{format(avg7d)}</span>
            <span className="ml-2">30d: <span className="font-mono">{format(avg30d)}</span></span>
          </p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
      </div>
    </Card>
  )
}

function BodyMetricsChart({ data }: { data: BodyMetrics }) {
  const chartData = useMemo(() => {
    if (!data.history || data.history.length === 0) return null

    return {
      labels: data.history.map(p => p.day.slice(5)), // MM-DD
      datasets: [
        {
          label: 'HRV',
          data: data.history.map(p => p.hrv_balance),
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          yAxisID: 'y',
        },
        {
          label: 'RHR',
          data: data.history.map(p => p.resting_heart_rate),
          borderColor: '#f59e0b',
          backgroundColor: '#f59e0b',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          yAxisID: 'y',
        },
        {
          label: 'Temp',
          data: data.history.map(p => p.temperature_deviation),
          borderColor: '#8b5cf6',
          backgroundColor: '#8b5cf6',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          yAxisID: 'y1',
        },
      ],
    }
  }, [data.history])

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex
            if (idx !== undefined && data.history) {
              return data.history[idx]?.day || ''
            }
            return ''
          },
          label: (ctx) => {
            const v = ctx.parsed.y ?? 0
            if (ctx.dataset.label === 'HRV') return `HRV Balance: ${v}`
            if (ctx.dataset.label === 'RHR') return `Resting HR: ${v}`
            if (ctx.dataset.label === 'Temp') return `Temp Dev.: ${v >= 0 ? '+' : ''}${v.toFixed(2)}°C`
            return `${ctx.dataset.label}: ${v}`
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
        },
        border: {
          display: false,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: 100,
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
        },
        border: {
          display: false,
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: -0.5,
        max: 0.5,
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          callback: (value) => `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(1)}°`,
        },
        border: {
          display: false,
        },
      },
    },
  }), [data.history])

  if (!chartData) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        No body metrics data yet
      </div>
    )
  }

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  )
}

interface Props {
  days?: number
}

export default function BodyMetricsSection({ days = 30 }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['body-metrics', days],
    queryFn: () => fetchBodyMetrics(days),
  })

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-gray-100 rounded-lg" />
  }

  if (error || !data) {
    return (
      <Card className="text-center py-8 text-gray-400">
        Unable to load body metrics
      </Card>
    )
  }

  // Format temperature deviation
  const formatTemp = (t: number) => `${t >= 0 ? '+' : ''}${t.toFixed(2)}°`
  const tempDeltaStr = data.temp_trend_delta >= 0 
    ? `+${data.temp_trend_delta.toFixed(2)}°` 
    : `${data.temp_trend_delta.toFixed(2)}°`

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          emoji="💓"
          label="HRV Balance"
          value={data.hrv_balance}
          unit=""
          avg7d={data.avg_hrv_7d}
          avg30d={data.avg_hrv_30d}
          trend={data.hrv_trend}
          trendDelta={data.hrv_trend_delta}
          format={(v) => v.toString()}
          description="Higher = better recovery"
        />
        <MetricCard
          emoji="❤️"
          label="Resting Heart Rate"
          value={data.resting_heart_rate}
          unit="bpm"
          avg7d={data.avg_rhr_7d}
          avg30d={data.avg_rhr_30d}
          trend={data.rhr_trend}
          trendDelta={data.rhr_trend_delta}
          inverted
          format={(v) => v.toString()}
          description="Lower = better fitness"
        />
        <MetricCard
          emoji="🌡️"
          label="Temperature"
          value={data.temperature_deviation}
          unit="°C"
          avg7d={data.avg_temp_7d}
          avg30d={data.avg_temp_30d}
          trend={data.temp_trend}
          trendDelta={tempDeltaStr}
          format={formatTemp}
          description="Deviation from baseline"
        />
      </div>

      {/* Chart */}
      <Card>
        <BodyMetricsChart data={data} />
      </Card>
    </div>
  )
}
