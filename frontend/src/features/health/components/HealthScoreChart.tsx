import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ScoreHistoryPoint } from '../types'

interface Props {
  history: ScoreHistoryPoint[]
}

export default function HealthScoreChart({ history }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No history data available
      </div>
    )
  }

  // Format date for display
  const formatDate = (day: string) => {
    const d = new Date(day)
    return d.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
  }

  const data = history.map(p => ({
    ...p,
    displayDay: formatDate(p.day),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="displayDay" 
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          domain={[0, 100]} 
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value) => [value ?? 0, '']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="sleep_score"
          name="Sleep"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="readiness_score"
          name="Readiness"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="activity_score"
          name="Activity"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
