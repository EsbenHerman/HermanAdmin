import { useQuery } from '@tanstack/react-query'
import { fetchHealthDashboard, fetchHealthHistory } from '../api'
import HealthScoreChart from '../components/HealthScoreChart'
import StepsTrendChart from '../components/StepsTrendChart'
import WorkoutSection from '../components/WorkoutSection'
import GoalsSection from '../components/GoalsSection'
import { Card, Section } from '../../../shared/components/ui'
import type { ScoreInsight, Contributor, ActivityMetrics } from '../types'

// Trend arrow component
function TrendArrow({ trend, delta }: { trend: 'up' | 'down' | 'stable', delta: number }) {
  if (trend === 'stable') {
    return <span className="text-gray-400 text-sm">→</span>
  }
  if (trend === 'up') {
    return (
      <span className="text-success-600 text-sm flex items-center gap-0.5">
        ↑ <span className="font-mono text-xs">+{delta}</span>
      </span>
    )
  }
  return (
    <span className="text-danger-600 text-sm flex items-center gap-0.5">
      ↓ <span className="font-mono text-xs">{delta}</span>
    </span>
  )
}

// Contributor pills
function ContributorPills({ contributors }: { contributors: Contributor[] }) {
  if (!contributors || contributors.length === 0) return null

  const getColor = (impact: string) => {
    if (impact === 'positive') return 'bg-success-100 text-success-700'
    if (impact === 'negative') return 'bg-danger-100 text-danger-700'
    return 'bg-gray-100 text-gray-600'
  }

  const getSign = (impact: string) => {
    if (impact === 'positive') return '+'
    if (impact === 'negative') return '−'
    return ''
  }

  const shown = contributors.slice(0, 3)

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {shown.map((c, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getColor(c.impact)}`}
        >
          <span>{c.name}</span>
          <span className="opacity-70">{getSign(c.impact)}</span>
        </span>
      ))}
    </div>
  )
}

// Activity score hero card
function ActivityScoreCard({ insight, metrics }: { insight?: ScoreInsight, metrics?: ActivityMetrics }) {
  const score = insight?.score
  const avg7d = insight?.avg_7d ?? 0

  const getScoreColor = (s?: number) => {
    if (!s) return 'text-gray-400'
    if (s >= 80) return 'text-success-600'
    if (s >= 60) return 'text-warning-500'
    return 'text-danger-600'
  }

  return (
    <Card>
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Score */}
        <div className="text-center sm:text-left">
          <span className="text-4xl">🏃</span>
          <p className={`text-5xl font-bold font-mono tabular-nums mt-2 ${getScoreColor(score)}`}>
            {score ?? '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Activity Score</p>
          <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
            <span className="text-gray-500 text-sm">7d:</span>
            <span className="font-mono">{avg7d.toFixed(0)}</span>
            {insight?.trend && <TrendArrow trend={insight.trend} delta={insight.trend_delta} />}
          </div>
        </div>

        {/* Today's Metrics */}
        {metrics && (
          <div className="flex-1 grid grid-cols-3 gap-3">
            <MetricBox
              emoji="👟"
              label="Steps"
              value={metrics.steps}
              format={(v) => v.toLocaleString()}
              goal={10000}
            />
            <MetricBox
              emoji="🔥"
              label="Active Cal"
              value={metrics.active_calories}
              format={(v) => v.toLocaleString()}
            />
            <MetricBox
              emoji="⚡"
              label="Total Cal"
              value={metrics.total_calories}
              format={(v) => v.toLocaleString()}
            />
          </div>
        )}
      </div>
      {insight?.contributors && (
        <div className="mt-4 pt-4 border-t">
          <ContributorPills contributors={insight.contributors} />
        </div>
      )}
    </Card>
  )
}

function MetricBox({ 
  emoji, 
  label, 
  value, 
  format, 
  goal 
}: { 
  emoji: string
  label: string
  value?: number
  format: (v: number) => string
  goal?: number
}) {
  const progress = goal && value ? Math.min((value / goal) * 100, 100) : null

  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <span className="text-lg">{emoji}</span>
      <p className="text-xl font-bold font-mono tabular-nums mt-1">
        {value != null ? format(value) : '—'}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
      {progress !== null && (
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-success-500' : 'bg-primary-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

interface ActivityTabProps {
  days: number
}

export function ActivityTab({ days }: ActivityTabProps) {
  const { data: dashboard } = useQuery({
    queryKey: ['health-dashboard'],
    queryFn: fetchHealthDashboard,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['health-history', days],
    queryFn: () => fetchHealthHistory(days),
  })

  return (
    <div className="space-y-6">
      {/* Activity Score Hero */}
      <ActivityScoreCard insight={dashboard?.activity} metrics={dashboard?.activity_metrics} />

      {/* Goals */}
      <Section title="Today's Goals" subtitle="Track your daily targets">
        <GoalsSection />
      </Section>

      {/* Steps Trend */}
      <Section title="Steps Trend" subtitle="Daily step count">
        <Card>
          <StepsTrendChart history={history} days={days} />
        </Card>
      </Section>

      {/* Score Trends */}
      <Section title="Score Trends" subtitle="All scores over time">
        <Card>
          <HealthScoreChart history={history} />
        </Card>
      </Section>

      {/* Workouts */}
      <Section title="Workouts" subtitle="Recent training sessions">
        <WorkoutSection />
      </Section>
    </div>
  )
}
