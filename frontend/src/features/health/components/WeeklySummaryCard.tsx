import { useQuery } from '@tanstack/react-query'
import { fetchWeeklySummary } from '../api'
import { Card } from '../../../shared/components/ui'

// Delta indicator
function DeltaIndicator({ value, inverted = false }: { value: number; inverted?: boolean }) {
  if (Math.abs(value) < 1) return null
  
  const isPositive = inverted ? value < 0 : value > 0
  const displayValue = Math.abs(value).toFixed(0)
  
  return (
    <span className={`text-sm font-medium ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
      {isPositive ? '↑' : '↓'} {displayValue}
    </span>
  )
}

// Stat row
function StatRow({ 
  label, 
  value, 
  delta,
  emoji,
  format = (v: number) => v.toFixed(0),
}: { 
  label: string
  value: number
  delta?: number
  emoji: string
  format?: (v: number) => string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold tabular-nums">{format(value)}</span>
        {delta !== undefined && <DeltaIndicator value={delta} />}
      </div>
    </div>
  )
}

// Streak badge
function StreakBadge({ type, current }: { type: string; current: number }) {
  const labels: Record<string, string> = {
    sleep_80: '😴 Sleep 80+',
    readiness_80: '⚡ Readiness 80+',
    steps_10k: '👟 10k Steps',
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
      <span className="text-amber-500">🔥</span>
      <span>{labels[type] ?? type}</span>
      <span className="font-bold">{current}d</span>
    </span>
  )
}

// Main component
export default function WeeklySummaryCard({ week = 'last' }: { week?: 'current' | 'last' }) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['weekly-summary', week],
    queryFn: () => fetchWeeklySummary(week),
  })

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded" />
        </div>
      </Card>
    )
  }

  if (error || !summary) {
    return (
      <Card className="text-center py-8 text-gray-500">
        Failed to load weekly summary
      </Card>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      {/* Header */}
      <div className="border-b pb-3 mb-3">
        <h3 className="font-semibold text-lg">
          {week === 'current' ? 'This Week' : 'Last Week'}
        </h3>
        <p className="text-sm text-gray-500">
          {formatDate(summary.week_start)} – {formatDate(summary.week_end)}
        </p>
      </div>

      {/* Stats */}
      <div className="divide-y">
        <StatRow
          emoji="😴"
          label="Avg Sleep"
          value={summary.avg_sleep}
          delta={summary.sleep_delta}
        />
        <StatRow
          emoji="⚡"
          label="Avg Readiness"
          value={summary.avg_readiness}
          delta={summary.readiness_delta}
        />
        <StatRow
          emoji="🏃"
          label="Avg Activity"
          value={summary.avg_activity}
          delta={summary.activity_delta}
        />
        <StatRow
          emoji="👟"
          label="Avg Steps"
          value={summary.avg_steps}
          delta={summary.steps_delta}
          format={(v) => v.toLocaleString()}
        />
        <StatRow
          emoji="🏋️"
          label="Workouts"
          value={summary.workout_count}
        />
      </div>

      {/* Goals */}
      {summary.goals_total > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Goals met (avg)</span>
            <span className="font-bold">
              {summary.goals_met}/{summary.goals_total}
            </span>
          </div>
        </div>
      )}

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Highlights</h4>
          <div className="space-y-1">
            {summary.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-success-500">✓</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lowlights */}
      {summary.lowlights.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Areas to improve</h4>
          <div className="space-y-1">
            {summary.lowlights.map((l, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-amber-500">!</span>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Streaks */}
      {summary.active_streaks.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Active Streaks</h4>
          <div className="flex flex-wrap gap-2">
            {summary.active_streaks.map((s) => (
              <StreakBadge key={s.type} type={s.type} current={s.current_streak} />
            ))}
          </div>
        </div>
      )}

      {/* Best/Worst days */}
      {(summary.best_sleep_day ?? summary.best_readiness_day) && (
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          {summary.best_sleep_day && (
            <div>
              <p className="text-gray-500">Best sleep</p>
              <p className="font-medium">
                {formatDate(summary.best_sleep_day)} ({summary.best_sleep_score})
              </p>
            </div>
          )}
          {summary.worst_sleep_day && summary.worst_sleep_score && summary.worst_sleep_score < 70 && (
            <div>
              <p className="text-gray-500">Worst sleep</p>
              <p className="font-medium text-amber-600">
                {formatDate(summary.worst_sleep_day)} ({summary.worst_sleep_score})
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
