import { useQuery } from '@tanstack/react-query'
import { fetchHealthHistory } from '../api'
import WeekdayAveragesChart from '../components/WeekdayAveragesChart'
import InsightsSection from '../components/InsightsSection'
import WeeklySummaryCard from '../components/WeeklySummaryCard'
import { Card, Section } from '../../../shared/components/ui'

interface InsightsTabProps {
  days: number
}

export function InsightsTab({ days }: InsightsTabProps) {
  const { data: history = [] } = useQuery({
    queryKey: ['health-history', days],
    queryFn: () => fetchHealthHistory(days),
  })

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <Section title="Weekly Summary" subtitle="Your week at a glance">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WeeklySummaryCard week="current" />
          <WeeklySummaryCard week="last" />
        </div>
      </Section>

      {/* Weekday Patterns */}
      <Section title="Weekday Patterns" subtitle="Your average scores by day of week">
        <Card>
          <WeekdayAveragesChart history={history} />
        </Card>
      </Section>

      {/* Insights */}
      <Section title="Insights" subtitle="Patterns and correlations">
        <InsightsSection days={days} />
      </Section>
    </div>
  )
}
