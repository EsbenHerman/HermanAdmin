import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchHealthDashboard, fetchSleepAnalysis, fetchWeightTrend, fetchWorkouts, fetchHealthInsights, fetchGoalsOverview } from '../api'
import HealthScoreChart from '../components/HealthScoreChart'
import { Card, Section } from '../../../shared/components/ui'
import type { ScoreInsight, Contributor, ActivityMetrics, ScoreHistoryPoint } from '../types'

// Verdict card component
function VerdictCard({ 
  verdict, 
  verdictType 
}: { 
  verdict: string
  verdictType: 'push' | 'normal' | 'recovery' | 'unknown'
}) {
  const config = {
    push: {
      bg: 'bg-success-50 border-success-200',
      text: 'text-success-800',
      icon: '💪',
      label: 'Push Day'
    },
    normal: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: '👍',
      label: 'Normal Day'
    },
    recovery: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: '🛋️',
      label: 'Recovery Day'
    },
    unknown: {
      bg: 'bg-gray-50 border-gray-200',
      text: 'text-gray-600',
      icon: '❓',
      label: 'Unknown'
    }
  }

  const c = config[verdictType] || config.unknown

  return (
    <Card className={`${c.bg} border`} padding="md">
      <div className="flex items-center gap-4">
        <span className="text-3xl sm:text-4xl">{c.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wide ${c.text} opacity-70`}>
              {c.label}
            </span>
          </div>
          <p className={`text-lg sm:text-xl font-medium ${c.text}`}>
            {verdict}
          </p>
        </div>
      </div>
    </Card>
  )
}

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

  const shown = contributors.slice(0, 2)

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {shown.map((c, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getColor(c.impact)}`}
        >
          <span>{c.name}</span>
          <span className="opacity-70">{getSign(c.impact)}</span>
        </span>
      ))}
    </div>
  )
}

// Score card
function ScoreCard({ 
  emoji, 
  label, 
  insight,
  to
}: { 
  emoji: string
  label: string
  insight?: ScoreInsight
  to?: string
}) {
  const score = insight?.score
  const avg7d = insight?.avg_7d ?? 0

  const getScoreColor = (s?: number) => {
    if (!s) return 'text-gray-400'
    if (s >= 80) return 'text-success-600'
    if (s >= 60) return 'text-warning-500'
    return 'text-danger-600'
  }

  const getScoreBg = (s?: number) => {
    if (!s) return 'bg-gray-50'
    if (s >= 80) return 'bg-success-50'
    if (s >= 60) return 'bg-warning-50'
    return 'bg-danger-50'
  }

  const content = (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${getScoreBg(score)} flex items-center justify-center flex-shrink-0`}>
        <span className="text-xl sm:text-2xl">{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${getScoreColor(score)}`}>
            {score ?? '—'}
          </p>
          {insight && insight.trend && (
            <TrendArrow trend={insight.trend} delta={insight.trend_delta} />
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
          7d: <span className="font-mono">{avg7d.toFixed(0)}</span>
          {insight?.avg_30d ? (
            <span className="ml-2">
              30d: <span className="font-mono">{insight.avg_30d.toFixed(0)}</span>
            </span>
          ) : null}
        </p>
        {insight?.contributors && (
          <ContributorPills contributors={insight.contributors} />
        )}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to}>
        <Card padding="sm" hover>{content}</Card>
      </Link>
    )
  }
  return <Card padding="sm">{content}</Card>
}

// Activity metrics cards
function ActivityMetricsCards({ metrics }: { metrics?: ActivityMetrics }) {
  if (!metrics) return null

  const items = [
    { 
      label: 'Steps', 
      value: metrics.steps, 
      emoji: '👟',
      format: (v: number) => v.toLocaleString(),
      goal: 10000,
    },
    { 
      label: 'Active Cal', 
      value: metrics.active_calories, 
      emoji: '🔥',
      format: (v: number) => v.toLocaleString(),
    },
    { 
      label: 'Total Cal', 
      value: metrics.total_calories, 
      emoji: '⚡',
      format: (v: number) => v.toLocaleString(),
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ label, value, emoji, format, goal }) => {
        const progress = goal && value ? Math.min((value / goal) * 100, 100) : null
        
        return (
          <Card key={label} padding="sm">
            <div className="text-center">
              <span className="text-lg">{emoji}</span>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-gray-900 mt-1">
                {value != null ? format(value) : '—'}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
              {progress !== null && (
                <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-success-500' : 'bg-primary-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// Highlight card component
function HighlightCard({ 
  to, 
  emoji, 
  title, 
  value, 
  subtitle 
}: { 
  to: string
  emoji: string
  title: string
  value: string | number
  subtitle?: string
}) {
  return (
    <Link to={to}>
      <Card padding="sm" hover>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">{title}</p>
            <p className="text-lg font-bold font-mono truncate">{value}</p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          <span className="text-gray-300">→</span>
        </div>
      </Card>
    </Link>
  )
}

// Goals highlight
function GoalsHighlight() {
  const { data: overview } = useQuery({
    queryKey: ['goals-overview'],
    queryFn: fetchGoalsOverview,
  })

  if (!overview || overview.goals.length === 0) {
    return (
      <HighlightCard
        to="/health/activity"
        emoji="🎯"
        title="Goals"
        value="Not set"
        subtitle="Set up your goals"
      />
    )
  }

  return (
    <HighlightCard
      to="/health/activity"
      emoji="🎯"
      title="Today's Goals"
      value={`${overview.todays_met}/${overview.todays_total}`}
      subtitle={`${overview.weekly_met}/${overview.weekly_total} this week`}
    />
  )
}

// Sleep highlight
function SleepHighlight() {
  const { data: sleepAnalysis } = useQuery({
    queryKey: ['sleep-analysis', 30],
    queryFn: () => fetchSleepAnalysis(30),
  })

  const debt = sleepAnalysis?.debt
  const debtDays = debt?.days_in_debt ?? 0
  const debtStatus = debtDays === 0 ? 'Good' : debtDays <= 3 ? 'Moderate' : 'High'

  return (
    <HighlightCard
      to="/health/sleep"
      emoji="🛏️"
      title="Sleep Debt"
      value={debtDays === 0 ? 'None' : `${debtDays} days`}
      subtitle={debtStatus}
    />
  )
}

// Weight highlight
function WeightHighlight() {
  const { data: weightTrend } = useQuery({
    queryKey: ['weight-trend', 90],
    queryFn: () => fetchWeightTrend(90),
  })

  const current = weightTrend?.latest?.weight_kg
  const trendDelta = weightTrend?.trend_delta ?? 0
  const trend = weightTrend?.trend ?? 'stable'
  const changeText = trend === 'up' ? `+${trendDelta.toFixed(1)}kg` : trend === 'down' ? `${trendDelta.toFixed(1)}kg` : 'Stable'

  return (
    <HighlightCard
      to="/health/body"
      emoji="⚖️"
      title="Weight"
      value={current ? `${current.toFixed(1)} kg` : '—'}
      subtitle={changeText}
    />
  )
}

// Workout highlight
function WorkoutHighlight() {
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => fetchWorkouts(30),
  })

  const safeWorkouts = workouts || []
  
  // Count this week's workouts
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  
  const thisWeek = safeWorkouts.filter(w => new Date(w.date) >= weekStart).length

  // Days since last workout
  let daysSince = '—'
  if (safeWorkouts.length > 0) {
    const lastDate = new Date(safeWorkouts[0].date)
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    daysSince = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`
  }

  return (
    <HighlightCard
      to="/health/activity"
      emoji="🏋️"
      title="Workouts"
      value={`${thisWeek} this week`}
      subtitle={`Last: ${daysSince}`}
    />
  )
}

// Insights highlight
function InsightsHighlight() {
  const { data: insights } = useQuery({
    queryKey: ['health-insights', 90],
    queryFn: () => fetchHealthInsights(90),
  })

  const topInsight = insights?.correlations?.[0]?.insight ?? 'No insights yet'
  const truncated = topInsight.length > 40 ? topInsight.slice(0, 40) + '…' : topInsight

  return (
    <HighlightCard
      to="/health/insights"
      emoji="💡"
      title="Top Insight"
      value={truncated}
    />
  )
}

interface OverviewTabProps {
  days: number
  history: ScoreHistoryPoint[]
}

export function OverviewTab({ history }: OverviewTabProps) {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['health-dashboard'],
    queryFn: fetchHealthDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading health data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-danger-50 border-danger-200">
        <p className="text-danger-800">Error loading health data: {(error as Error).message}</p>
      </Card>
    )
  }

  if (!dashboard || !dashboard.latest_day) {
    return (
      <Card className="text-center py-12">
        <span className="text-4xl mb-4 block">💪</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No health data yet</h3>
        <p className="text-gray-500">Run the Oura sync to get started.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Daily Verdict */}
      {dashboard.verdict && (
        <VerdictCard 
          verdict={dashboard.verdict} 
          verdictType={dashboard.verdict_type || 'unknown'} 
        />
      )}

      {/* Score Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScoreCard
          emoji="😴"
          label="Sleep Score"
          insight={dashboard.sleep}
          to="/health/sleep"
        />
        <ScoreCard
          emoji="⚡"
          label="Readiness Score"
          insight={dashboard.readiness}
        />
        <ScoreCard
          emoji="🏃"
          label="Activity Score"
          insight={dashboard.activity}
          to="/health/activity"
        />
      </div>

      {/* Activity Metrics */}
      <Section title="Today's Activity">
        <ActivityMetricsCards metrics={dashboard.activity_metrics} />
      </Section>

      {/* Quick Highlights */}
      <Section title="Highlights" subtitle="Quick glance at key stats">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <GoalsHighlight />
          <SleepHighlight />
          <WeightHighlight />
          <WorkoutHighlight />
          <InsightsHighlight />
        </div>
      </Section>

      {/* Score Trends */}
      <Section title="Score Trends" subtitle="Track your progress over time">
        <Card>
          <HealthScoreChart history={history} />
        </Card>
      </Section>
    </div>
  )
}
