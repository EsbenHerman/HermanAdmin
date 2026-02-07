import { Card } from '../../../shared/components/ui'

interface Props {
  averages: Record<string, number>
}

const COMPONENT_CONFIG: Record<string, { name: string; emoji: string; description: string }> = {
  score: { name: 'Overall', emoji: '😴', description: 'Sleep score' },
  deep_sleep: { name: 'Deep', emoji: '🌙', description: 'Deep sleep quality' },
  rem_sleep: { name: 'REM', emoji: '💭', description: 'REM sleep quality' },
  efficiency: { name: 'Efficiency', emoji: '⚡', description: 'Time asleep vs in bed' },
  latency: { name: 'Latency', emoji: '⏱️', description: 'Time to fall asleep' },
  restfulness: { name: 'Restful', emoji: '🧘', description: 'Movement during sleep' },
  timing: { name: 'Timing', emoji: '🕐', description: 'Bedtime consistency' },
  total_sleep: { name: 'Duration', emoji: '⏰', description: 'Total sleep time' },
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-success-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-danger-600'
}

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-success-50'
  if (score >= 60) return 'bg-amber-50'
  return 'bg-danger-50'
}

export default function SleepAveragesCard({ averages }: Props) {
  if (!averages) return null
  
  // Define display order
  const displayOrder = ['score', 'deep_sleep', 'rem_sleep', 'efficiency', 'total_sleep', 'timing', 'restfulness', 'latency']
  
  const components = displayOrder
    .filter(key => averages[key] != null)
    .map(key => ({
      key,
      value: Math.round(averages[key]),
      ...COMPONENT_CONFIG[key],
    }))

  if (components.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {components.map(({ key, name, emoji, value, description }) => (
        <Card key={key} padding="sm" className="text-center">
          <div className={`w-10 h-10 mx-auto rounded-lg ${getScoreBg(value)} flex items-center justify-center mb-2`}>
            <span className="text-lg">{emoji}</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${getScoreColor(value)}`}>
            {value}
          </p>
          <p className="text-xs font-medium text-gray-700">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{description}</p>
        </Card>
      ))}
    </div>
  )
}
