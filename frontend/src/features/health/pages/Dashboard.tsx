import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchHealthDashboard, fetchHealthHistory } from '../api'
import HealthScoreChart from '../components/HealthScoreChart'
import WeekdayAveragesChart from '../components/WeekdayAveragesChart'
import { Card, PageHeader, Section } from '../../../shared/components/ui'

const DATE_RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
] as const

function ScoreCard({ 
  emoji, 
  label, 
  score, 
  avg7d 
}: { 
  emoji: string
  label: string
  score?: number
  avg7d: number
}) {
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
    <Card padding="sm">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${getScoreBg(score)} flex items-center justify-center flex-shrink-0`}>
          <span className="text-xl sm:text-2xl">{emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
          <p className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${getScoreColor(score)}`}>
            {score ?? '—'}
          </p>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
            7d: <span className="font-mono">{avg7d.toFixed(0)}</span>
          </p>
        </div>
      </div>
    </Card>
  )
}

function DateRangeSelector({ 
  value, 
  onChange 
}: { 
  value: number
  onChange: (days: number) => void 
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {DATE_RANGES.map(({ label, days }) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            value === days
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Dashboard() {
  const [selectedDays, setSelectedDays] = useState(30)

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['health-dashboard'],
    queryFn: fetchHealthDashboard,
  })

  const { data: history } = useQuery({
    queryKey: ['health-history', selectedDays],
    queryFn: () => fetchHealthHistory(selectedDays),
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
      <div className="space-y-6">
        <PageHeader title="Health Dashboard" />
        <Card className="text-center py-12">
          <span className="text-4xl mb-4 block">💪</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No health data yet</h3>
          <p className="text-gray-500">Run the Oura sync to get started.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Health Dashboard"
        subtitle={`Latest data: ${dashboard.latest_day}`}
        actions={
          <DateRangeSelector value={selectedDays} onChange={setSelectedDays} />
        }
      />

      {/* Score Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScoreCard
          emoji="😴"
          label="Sleep Score"
          score={dashboard.sleep_score}
          avg7d={dashboard.avg_sleep_score_7d}
        />
        <ScoreCard
          emoji="⚡"
          label="Readiness Score"
          score={dashboard.readiness_score}
          avg7d={dashboard.avg_readiness_7d}
        />
        <ScoreCard
          emoji="🏃"
          label="Activity Score"
          score={dashboard.activity_score}
          avg7d={dashboard.avg_activity_7d}
        />
      </div>

      {/* Score History Chart */}
      <Section title="Score History">
        <Card>
          <HealthScoreChart history={history || []} />
        </Card>
      </Section>

      {/* Weekday Averages Chart */}
      <Section 
        title="Weekday Averages"
        subtitle="Average scores by day of week"
      >
        <Card>
          <WeekdayAveragesChart history={history || []} />
        </Card>
      </Section>
    </div>
  )
}
