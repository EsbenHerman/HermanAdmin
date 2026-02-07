import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchHealthHistory, fetchHealthDashboard } from '../api'
import { TabNav } from '../components/TabNav'
import { OverviewTab } from './OverviewTab'
import { SleepTab } from './SleepTab'
import { ActivityTab } from './ActivityTab'
import { BodyTab } from './BodyTab'
import { InsightsTab } from './InsightsTab'
import { PageHeader } from '../../../shared/components/ui'

const DATE_RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
] as const

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
          onClick={() => { onChange(days); }}
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

  const { data: dashboard } = useQuery({
    queryKey: ['health-dashboard'],
    queryFn: fetchHealthDashboard,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['health-history', selectedDays],
    queryFn: () => fetchHealthHistory(selectedDays),
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Health Dashboard"
        subtitle={dashboard?.latest_day ? `Latest data: ${dashboard.latest_day}` : undefined}
        actions={
          <DateRangeSelector value={selectedDays} onChange={setSelectedDays} />
        }
      />

      <TabNav />

      <Routes>
        <Route index element={<OverviewTab days={selectedDays} history={history} />} />
        <Route path="sleep" element={<SleepTab days={selectedDays} />} />
        <Route path="activity" element={<ActivityTab days={selectedDays} />} />
        <Route path="body" element={<BodyTab days={selectedDays} />} />
        <Route path="insights" element={<InsightsTab days={selectedDays} />} />
      </Routes>
    </div>
  )
}
