import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchGoalsOverview, fetchGoals, upsertGoal } from '../api'
import { Card } from '../../../shared/components/ui'
import type { GoalProgress, HealthGoalInput } from '../types'

// Goal type display config
const GOAL_CONFIG = {
  step_goal: {
    emoji: '👟',
    label: 'Daily Steps',
    unit: 'steps',
    format: (v: number) => v.toLocaleString(),
  },
  sleep_score: {
    emoji: '😴',
    label: 'Sleep Score',
    unit: '',
    format: (v: number) => String(v),
  },
  readiness_score: {
    emoji: '⚡',
    label: 'Readiness Score',
    unit: '',
    format: (v: number) => String(v),
  },
  workout_frequency: {
    emoji: '🏋️',
    label: 'Weekly Workouts',
    unit: '/week',
    format: (v: number) => String(v),
  },
} as const

// Progress ring component
function ProgressRing({ 
  progress, 
  size = 64, 
  strokeWidth = 6,
  met,
}: { 
  progress: number
  size?: number
  strokeWidth?: number
  met: boolean
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${
            met ? 'text-success-500' : progress >= 50 ? 'text-primary-500' : 'text-amber-400'
          }`}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {met ? (
          <span className="text-xl">✓</span>
        ) : (
          <span className="text-sm font-bold text-gray-700">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  )
}

// Single goal card
function GoalCard({ goal }: { goal: GoalProgress }) {
  const config = GOAL_CONFIG[goal.goal.goal_type as keyof typeof GOAL_CONFIG]
  if (!config) return null

  return (
    <Card padding="sm" className={goal.met ? 'border-success-200 bg-success-50/50' : ''}>
      <div className="flex items-center gap-4">
        <ProgressRing progress={goal.progress} met={goal.met} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <span className="font-medium text-gray-900">{config.label}</span>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-bold tabular-nums">
              {config.format(goal.current_value)}
            </span>
            <span className="text-gray-500 ml-1">
              / {config.format(goal.goal.target)}{config.unit}
            </span>
          </div>
          {goal.current_streak > 0 && (
            <div className="mt-1 flex items-center gap-1 text-sm">
              <span className="text-amber-500">🔥</span>
              <span className="text-gray-600">
                {goal.current_streak} day streak
                {goal.best_streak > goal.current_streak && (
                  <span className="text-gray-400 ml-1">(best: {goal.best_streak})</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Goals settings modal
function GoalsSettingsModal({ 
  onClose 
}: { 
  onClose: () => void 
}) {
  const queryClient = useQueryClient()
  const { data: goals = [] } = useQuery({
    queryKey: ['health-goals'],
    queryFn: () => fetchGoals(true),
  })

  const mutation = useMutation({
    mutationFn: upsertGoal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['health-goals'] })
      void queryClient.invalidateQueries({ queryKey: ['goals-overview'] })
    },
  })

  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleSave = (goalType: string) => {
    const target = parseInt(editValue, 10)
    if (target > 0) {
      mutation.mutate({ goal_type: goalType as HealthGoalInput['goal_type'], target, active: true })
    }
    setEditingGoal(null)
    setEditValue('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Goals</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-3">
          {Object.entries(GOAL_CONFIG).map(([type, config]) => {
            const goal = goals.find((g) => g.goal_type === type)
            const isEditing = editingGoal === type

            return (
              <div key={type} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{config.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{config.label}</p>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => { setEditValue(e.target.value); }}
                        className="w-24 px-2 py-1 border rounded text-sm"
                        placeholder="Target"
                        autoFocus
                      />
                      <button
                        onClick={() => { handleSave(type); }}
                        className="px-2 py-1 bg-primary-600 text-white text-sm rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingGoal(null); }}
                        className="px-2 py-1 text-gray-500 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Target: {goal ? `${config.format(goal.target)}${config.unit}` : 'Not set'}
                      {goal && !goal.active && (
                        <span className="ml-2 text-xs text-gray-400">(inactive)</span>
                      )}
                    </p>
                  )}
                </div>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setEditingGoal(type)
                      setEditValue(goal?.target?.toString() ?? '')
                    }}
                    className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded"
                  >
                    Edit
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// Main goals section
export default function GoalsSection() {
  const [showSettings, setShowSettings] = useState(false)

  const { data: overview, isLoading, error } = useQuery({
    queryKey: ['goals-overview'],
    queryFn: fetchGoalsOverview,
  })

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-8 text-gray-500">
        Failed to load goals
      </Card>
    )
  }

  if (!overview || overview.goals.length === 0) {
    return (
      <Card className="text-center py-8">
        <span className="text-3xl mb-2 block">🎯</span>
        <p className="text-gray-500 mb-3">No goals configured yet</p>
        <button
          onClick={() => { setShowSettings(true); }}
          className="text-primary-600 hover:underline"
        >
          Set up goals
        </button>
        {showSettings && (
          <GoalsSettingsModal onClose={() => { setShowSettings(false); }} />
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <Card padding="sm" className="bg-gradient-to-r from-primary-50 to-primary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-700">
                {overview.todays_met}/{overview.todays_total}
              </p>
              <p className="text-xs text-primary-600">Today</p>
            </div>
            <div className="h-8 w-px bg-primary-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-700">
                {overview.weekly_met}/{overview.weekly_total}
              </p>
              <p className="text-xs text-primary-600">This Week</p>
            </div>
          </div>
          <button
            onClick={() => { setShowSettings(true); }}
            className="p-2 hover:bg-primary-200 rounded-lg transition-colors"
            title="Edit goals"
          >
            ⚙️
          </button>
        </div>
      </Card>

      {/* Individual goals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {overview.goals.map((goal) => (
          <GoalCard key={goal.goal.goal_type} goal={goal} />
        ))}
      </div>

      {showSettings && (
        <GoalsSettingsModal onClose={() => { setShowSettings(false); }} />
      )}
    </div>
  )
}
