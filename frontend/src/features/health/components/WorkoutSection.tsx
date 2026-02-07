import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWorkouts, createWorkout, deleteWorkout } from '../api'
import { Card } from '../../../shared/components/ui'
import type { Workout, WorkoutInput } from '../types'

const WORKOUT_TYPES = [
  { value: 'strength' as const, label: 'Strength', emoji: '🏋️' },
  { value: 'cardio' as const, label: 'Cardio', emoji: '🏃' },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return d.toLocaleDateString('sv-SE', { weekday: 'short', month: 'short', day: 'numeric' })
}

interface AddWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (input: WorkoutInput) => void
  isLoading: boolean
}

function AddWorkoutModal({ isOpen, onClose, onAdd, isLoading }: AddWorkoutModalProps) {
  const [type, setType] = useState<'strength' | 'cardio'>('strength')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({ type, notes: notes.trim() || undefined, date })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Log Workout</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-2">
              {WORKOUT_TYPES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setType(value); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    type === value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); }}
              placeholder="e.g., Upper body, 5km run..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function WorkoutSection() {
  const [showAddModal, setShowAddModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => fetchWorkouts(30),
  })

  const createMutation = useMutation({
    mutationFn: createWorkout,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workouts'] })
      setShowAddModal(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkout,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workouts'] })
    },
  })

  const handleAdd = (input: WorkoutInput) => {
    createMutation.mutate(input)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this workout?')) {
      deleteMutation.mutate(id)
    }
  }

  // Group workouts by week
  const thisWeek: Workout[] = []
  const earlier: Workout[] = []
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  // Guard against null
  const safeWorkouts = workouts || []
  safeWorkouts.forEach(w => {
    const wDate = new Date(w.date)
    if (wDate >= weekStart) {
      thisWeek.push(w)
    } else {
      earlier.push(w)
    }
  })

  return (
    <div>
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          {safeWorkouts.length > 0 ? (
            <>This week: <span className="font-medium text-gray-700">{thisWeek.length}</span> workout{thisWeek.length !== 1 ? 's' : ''}</>
          ) : (
            'No workouts logged yet'
          )}
        </div>
        <button
          onClick={() => { setShowAddModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <span>+</span>
          <span>Log Workout</span>
        </button>
      </div>

      {/* Workout List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : safeWorkouts.length === 0 ? (
        <Card className="text-center py-8">
          <span className="text-3xl mb-3 block">🏋️</span>
          <p className="text-gray-500">No workouts logged yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Log Workout" to get started</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* This Week */}
          {thisWeek.length > 0 && (
            <div className="space-y-2">
              {thisWeek.map(w => (
                <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* Earlier */}
          {earlier.length > 0 && (
            <>
              {thisWeek.length > 0 && (
                <div className="text-xs text-gray-400 uppercase tracking-wide pt-2">Earlier</div>
              )}
              <div className="space-y-2">
                {earlier.slice(0, 5).map(w => (
                  <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} />
                ))}
              </div>
              {earlier.length > 5 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  +{earlier.length - 5} more workouts
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AddWorkoutModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); }}
        onAdd={handleAdd}
        isLoading={createMutation.isPending}
      />
    </div>
  )
}

function WorkoutCard({ workout, onDelete }: { workout: Workout; onDelete: (id: number) => void }) {
  const typeConfig = WORKOUT_TYPES.find(t => t.value === workout.type) || WORKOUT_TYPES[0]

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
      <span className="text-xl">{typeConfig.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{typeConfig.label}</span>
          <span className="text-xs text-gray-400">{formatDate(workout.date)}</span>
        </div>
        {workout.notes && (
          <p className="text-sm text-gray-500 truncate">{workout.notes}</p>
        )}
      </div>
      <button
        onClick={() => { onDelete(workout.id); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-danger-600 rounded transition-all"
        title="Delete"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
