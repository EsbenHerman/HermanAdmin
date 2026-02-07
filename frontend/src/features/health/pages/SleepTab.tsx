import { useQuery } from '@tanstack/react-query'
import { fetchHealthDashboard, fetchSleepAnalysis } from '../api'
import SleepBreakdownChart from '../components/SleepBreakdownChart'
import SleepDebtCard from '../components/SleepDebtCard'
import SleepTimingChart from '../components/SleepTimingChart'
import SleepAveragesCard from '../components/SleepAveragesCard'
import { Card, Section } from '../../../shared/components/ui'
import type { ScoreInsight, Contributor } from '../types'

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

// Sleep score hero card
function SleepScoreCard({ insight }: { insight?: ScoreInsight }) {
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

  return (
    <Card className={`${getScoreBg(score)} border-2 ${score && score >= 80 ? 'border-success-200' : score && score >= 60 ? 'border-warning-200' : 'border-gray-200'}`}>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <span className="text-4xl">😴</span>
          <p className={`text-5xl font-bold font-mono tabular-nums mt-2 ${getScoreColor(score)}`}>
            {score ?? '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Sleep Score</p>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-sm">7d avg:</span>
            <span className="font-mono font-medium">{avg7d.toFixed(0)}</span>
            {insight?.trend && <TrendArrow trend={insight.trend} delta={insight.trend_delta} />}
          </div>
          {insight?.avg_30d && (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">30d avg:</span>
              <span className="font-mono font-medium">{insight.avg_30d.toFixed(0)}</span>
            </div>
          )}
          {insight?.contributors && <ContributorPills contributors={insight.contributors} />}
        </div>
      </div>
    </Card>
  )
}

interface SleepTabProps {
  days: number
}

export function SleepTab({ days }: SleepTabProps) {
  const { data: dashboard } = useQuery({
    queryKey: ['health-dashboard'],
    queryFn: fetchHealthDashboard,
  })

  const { data: sleepAnalysis = null } = useQuery({
    queryKey: ['sleep-analysis', days],
    queryFn: () => fetchSleepAnalysis(days),
  })

  return (
    <div className="space-y-6">
      {/* Sleep Score Hero */}
      <SleepScoreCard insight={dashboard?.sleep} />

      {/* Sleep Breakdown */}
      {sleepAnalysis && (
        <>
          <Section title="Sleep Components" subtitle="Score breakdown over time">
            <Card>
              <SleepBreakdownChart breakdown={sleepAnalysis.breakdown} />
            </Card>
          </Section>

          {/* Debt & Averages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Section title="Sleep Debt" subtitle="Accumulated deficit">
              <SleepDebtCard debt={sleepAnalysis.debt} />
            </Section>
            <Section title="Averages" subtitle="Key metrics">
              <SleepAveragesCard averages={sleepAnalysis.averages} />
            </Section>
          </div>

          {/* Timing */}
          <Section title="Bedtime Consistency" subtitle="Timing score by weekday">
            <Card>
              <SleepTimingChart weekdayAvg={sleepAnalysis.weekday_timing_avg} />
            </Card>
          </Section>
        </>
      )}

      {!sleepAnalysis && (
        <Card className="text-center py-12">
          <span className="text-4xl mb-4 block">😴</span>
          <p className="text-gray-500">No sleep analysis data available</p>
        </Card>
      )}
    </div>
  )
}
