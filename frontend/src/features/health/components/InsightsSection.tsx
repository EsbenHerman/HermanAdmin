import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
import { fetchHealthInsights } from '../api'
import { Card } from '../../../shared/components/ui'
import type { Correlation, WeekdayInsight, PersonalRecord, Streak, WeekdayPattern } from '../types'

// Correlation card
function CorrelationCard({ correlation }: { correlation: Correlation }) {
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-success-600'
      case 'moderate': return 'text-amber-600'
      case 'weak': return 'text-gray-500'
      default: return 'text-gray-400'
    }
  }

  const getDirectionIcon = (direction: string) => {
    if (direction === 'positive') return '↗️'
    if (direction === 'negative') return '↘️'
    return '➡️'
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-2xl">{getDirectionIcon(correlation.direction)}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">
            {correlation.metric1} → {correlation.metric2}
          </span>
          <span className={`text-xs font-medium ${getStrengthColor(correlation.strength)}`}>
            {correlation.strength}
          </span>
        </div>
        <p className="text-sm text-gray-600">{correlation.insight}</p>
      </div>
    </div>
  )
}

// Weekday insight pill
function WeekdayInsightPill({ insight }: { insight: WeekdayInsight }) {
  const isBest = insight.type === 'best'
  const bg = isBest ? 'bg-success-100 border-success-200' : 'bg-amber-100 border-amber-200'
  const text = isBest ? 'text-success-800' : 'text-amber-800'
  const icon = isBest ? '🏆' : '⚠️'

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bg}`}>
      <span className="text-lg">{icon}</span>
      <span className={`text-sm font-medium ${text}`}>{insight.insight}</span>
    </div>
  )
}

// Record badge
function RecordBadge({ record }: { record: PersonalRecord }) {
  const icons: Record<string, string> = {
    highest_sleep: '😴',
    highest_readiness: '⚡',
    highest_activity: '🏃',
    longest_sleep_streak: '🔥',
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
      <span className="text-2xl">{icons[record.type] || '🏅'}</span>
      <div>
        <div className="font-bold text-gray-900 font-mono text-lg">{record.value}</div>
        <div className="text-xs text-gray-600">
          {record.description}
          {record.date && <span className="ml-1 text-gray-400">({record.date})</span>}
        </div>
      </div>
    </div>
  )
}

// Streak display
function StreakCard({ streak }: { streak: Streak }) {
  const labels: Record<string, { name: string; icon: string }> = {
    sleep_80: { name: 'Sleep 80+', icon: '😴' },
    readiness_80: { name: 'Readiness 80+', icon: '⚡' },
    steps_10k: { name: '10k Steps', icon: '👟' },
  }

  const info = labels[streak.type] || { name: streak.type, icon: '🎯' }

  return (
    <div className={`p-3 rounded-lg border ${streak.is_active ? 'border-success-300 bg-success-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{info.icon}</span>
          <span className="font-medium text-gray-900">{info.name}</span>
        </div>
        {streak.is_active && (
          <span className="text-xs font-medium text-success-600 bg-success-100 px-2 py-0.5 rounded">
            Active
          </span>
        )}
      </div>
      <div className="mt-2 flex gap-4 text-sm">
        <div>
          <span className="text-gray-500">Current:</span>
          <span className="ml-1 font-bold text-gray-900">{streak.current_streak}</span>
        </div>
        <div>
          <span className="text-gray-500">Best:</span>
          <span className="ml-1 font-bold text-amber-600">{streak.best_streak}</span>
        </div>
      </div>
    </div>
  )
}

// Weekday patterns chart
function WeekdayPatternsChart({ patterns }: { patterns: WeekdayPattern[] }) {
  const chartData = useMemo(() => {
    if (!patterns || patterns.length === 0) return null
    
    return {
      labels: patterns.map(p => p.day_name.slice(0, 3)),
      datasets: [
        {
          label: 'Sleep',
          data: patterns.map(p => Math.round(p.avg_sleep)),
          backgroundColor: '#8b5cf6',
          borderRadius: 4,
        },
        {
          label: 'Readiness',
          data: patterns.map(p => Math.round(p.avg_readiness)),
          backgroundColor: '#f59e0b',
          borderRadius: 4,
        },
        {
          label: 'Activity',
          data: patterns.map(p => Math.round(p.avg_activity)),
          backgroundColor: '#10b981',
          borderRadius: 4,
        },
      ],
    }
  }, [patterns])

  const options: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
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
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          font: { size: 12 },
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          font: { size: 12 },
        },
      },
    },
  }), [])

  if (!chartData) {
    return <div className="h-48 flex items-center justify-center text-gray-400">No pattern data</div>
  }

  return (
    <div className="h-[250px]">
      <Bar data={chartData} options={options} />
    </div>
  )
}

interface InsightsSectionProps {
  days?: number
}

export default function InsightsSection({ days = 90 }: InsightsSectionProps) {
  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['health-insights', days],
    queryFn: () => fetchHealthInsights(days),
  })

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-danger-50 border-danger-200">
        <p className="text-danger-800 text-sm">Failed to load insights</p>
      </Card>
    )
  }

  if (!insights || insights.total_days < 7) {
    return (
      <Card className="text-center py-8">
        <span className="text-3xl block mb-2">📊</span>
        <p className="text-gray-600">Need at least 7 days of data for insights</p>
        <p className="text-sm text-gray-400 mt-1">Currently have {insights?.total_days || 0} days</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Overview</h3>
          <span className="text-sm text-gray-500">{insights.total_days} days analyzed</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-600">{insights.avg_sleep.toFixed(0)}</div>
            <div className="text-xs text-gray-500">Avg Sleep</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{insights.avg_readiness.toFixed(0)}</div>
            <div className="text-xs text-gray-500">Avg Readiness</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{insights.avg_activity.toFixed(0)}</div>
            <div className="text-xs text-gray-500">Avg Activity</div>
          </div>
        </div>
      </Card>

      {/* Correlations */}
      {insights.correlations?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">🔗 Correlations</h3>
          <div className="space-y-3">
            {insights.correlations.map((corr, i) => (
              <CorrelationCard key={i} correlation={corr} />
            ))}
          </div>
        </Card>
      )}

      {/* Weekday Insights */}
      {insights.weekday_insights?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">📅 Weekly Patterns</h3>
          <div className="space-y-2 mb-4">
            {insights.weekday_insights.map((insight, i) => (
              <WeekdayInsightPill key={i} insight={insight} />
            ))}
          </div>
          <WeekdayPatternsChart patterns={insights.weekday_patterns || []} />
        </Card>
      )}

      {/* Records */}
      {insights.records?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">🏆 Personal Records</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.records.slice(0, 4).map((record, i) => (
              <RecordBadge key={i} record={record} />
            ))}
          </div>
        </Card>
      )}

      {/* Streaks */}
      {insights.streaks?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">🔥 Streaks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.streaks.map((streak, i) => (
              <StreakCard key={i} streak={streak} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
