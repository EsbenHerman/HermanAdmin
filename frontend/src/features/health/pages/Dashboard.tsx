import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchHealthDashboard, fetchHealthHistory } from '../api'
import HealthScoreChart from '../components/HealthScoreChart'
import WeekdayAveragesChart from '../components/WeekdayAveragesChart'

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
    if (s >= 80) return 'text-green-600'
    if (s >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl">{emoji}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
              <dd className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {score ?? '—'}
              </dd>
              <dd className="text-sm text-gray-400">
                7d avg: {avg7d.toFixed(0)}
              </dd>
            </dl>
          </div>
        </div>
      </div>
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
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Error loading health data: {(error as Error).message}</p>
      </div>
    )
  }

  if (!dashboard || !dashboard.latest_day) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Health Dashboard</h1>
        <p className="text-gray-500">No health data yet. Run the Oura sync to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-sm text-gray-500">Latest data: {dashboard.latest_day}</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          {DATE_RANGES.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedDays === days
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } ${days !== 30 ? 'border-l border-gray-300' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Score History</h2>
        <HealthScoreChart history={history || []} />
      </div>

      {/* Weekday Averages Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Weekday Averages</h2>
        <p className="text-sm text-gray-500 mb-4">Average scores by day of week</p>
        <WeekdayAveragesChart history={history || []} />
      </div>
    </div>
  )
}
