import BodyMetricsSection from '../components/BodyMetricsSection'
import WeightSection from '../components/WeightSection'
import { Section } from '../../../shared/components/ui'

interface BodyTabProps {
  days: number
}

export function BodyTab({ days }: BodyTabProps) {
  return (
    <div className="space-y-6">
      {/* Body Metrics (HRV, HR, Temp) */}
      <Section title="Body Metrics" subtitle="HRV, heart rate, and temperature trends">
        <BodyMetricsSection days={days} />
      </Section>

      {/* Weight */}
      <Section title="Weight Tracking" subtitle="Monitor your weight over time">
        <WeightSection />
      </Section>
    </div>
  )
}
