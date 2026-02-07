import type { SleepDebtData } from '../types'
import { Card } from '../../../shared/components/ui'

interface Props {
  debt: SleepDebtData
}

export default function SleepDebtCard({ debt }: Props) {
  if (!debt) return null
  
  const getDebtLevel = (d: number): { label: string; color: string; bg: string; emoji: string } => {
    if (d <= 0) return { label: 'No Debt', color: 'text-success-700', bg: 'bg-success-50', emoji: '✨' }
    if (d <= 10) return { label: 'Low', color: 'text-blue-700', bg: 'bg-blue-50', emoji: '😴' }
    if (d <= 20) return { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-50', emoji: '😐' }
    if (d <= 30) return { label: 'High', color: 'text-orange-700', bg: 'bg-orange-50', emoji: '😫' }
    return { label: 'Critical', color: 'text-danger-700', bg: 'bg-danger-50', emoji: '🥵' }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'decreasing') return { icon: '📉', label: 'Recovering', color: 'text-success-600' }
    if (trend === 'increasing') return { icon: '📈', label: 'Accumulating', color: 'text-danger-600' }
    return { icon: '➡️', label: 'Stable', color: 'text-gray-600' }
  }

  const level = getDebtLevel(debt.current_debt)
  const trend = getTrendIcon(debt.debt_trend)

  const formatDate = (day: string) => {
    if (!day) return '—'
    const d = new Date(day)
    return d.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
  }

  return (
    <Card className={`${level.bg} border border-gray-200`} padding="md">
      <div className="flex items-start gap-4">
        <div className="text-3xl sm:text-4xl">{level.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">Sleep Debt</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${level.color} ${level.bg}`}>
              {level.label}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Debt Level</p>
              <p className={`text-xl font-bold font-mono ${level.color}`}>
                {debt.current_debt.toFixed(1)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Trend</p>
              <p className={`text-sm font-medium ${trend.color} flex items-center gap-1`}>
                <span>{trend.icon}</span> {trend.label}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">7d Avg Score</p>
              <p className="text-lg font-bold font-mono text-gray-900">
                {debt.weekly_avg_score.toFixed(0)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Days in Debt</p>
              <p className="text-lg font-bold font-mono text-gray-900">
                {debt.days_in_debt}
              </p>
            </div>
          </div>

          {debt.current_debt > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200/50">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {debt.last_good_night && (
                  <span className="text-gray-600">
                    Last good night: <span className="font-medium">{formatDate(debt.last_good_night)}</span>
                  </span>
                )}
                {debt.recommended_rest > 0 && (
                  <span className="text-amber-700 font-medium">
                    💤 Recommend {debt.recommended_rest} early night{debt.recommended_rest > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {debt.current_debt <= 0 && (
            <p className="mt-3 text-sm text-success-700 font-medium">
              You're well-rested! Keep up the good sleep habits.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
