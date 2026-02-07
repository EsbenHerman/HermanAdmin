import { API_BASE } from '../../shared/api/client'
import type { HealthDashboard, ScoreHistoryPoint, OuraDaily, Workout, WorkoutInput, SleepAnalysis, WeightTrend, WeightInput, BodyMetrics, HealthInsights, HealthGoal, HealthGoalInput, GoalsOverview, WeeklySummary } from './types'

export async function fetchHealthDashboard(): Promise<HealthDashboard> {
  const res = await fetch(`${API_BASE}/dashboard/health`)
  if (!res.ok) throw new Error('Failed to fetch health dashboard')
  return res.json() as Promise<HealthDashboard>
}

export async function fetchHealthHistory(days = 30): Promise<ScoreHistoryPoint[]> {
  const res = await fetch(`${API_BASE}/dashboard/health/history?days=${String(days)}`)
  if (!res.ok) throw new Error('Failed to fetch health history')
  return res.json() as Promise<ScoreHistoryPoint[]>
}

export async function fetchOuraDaily(limit = 90): Promise<OuraDaily[]> {
  const res = await fetch(`${API_BASE}/health/oura?limit=${String(limit)}`)
  if (!res.ok) throw new Error('Failed to fetch Oura data')
  return res.json() as Promise<OuraDaily[]>
}

export async function fetchOuraDayDetail(day: string): Promise<OuraDaily> {
  const res = await fetch(`${API_BASE}/health/oura/${day}`)
  if (!res.ok) throw new Error('Failed to fetch Oura day')
  return res.json() as Promise<OuraDaily>
}

// Workout API functions
export async function fetchWorkouts(limit = 100): Promise<Workout[]> {
  const res = await fetch(`${API_BASE}/health/workouts?limit=${String(limit)}`)
  if (!res.ok) throw new Error('Failed to fetch workouts')
  return res.json() as Promise<Workout[]>
}

export async function createWorkout(input: WorkoutInput): Promise<{ id: number; date: string; type: string }> {
  const res = await fetch(`${API_BASE}/health/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create workout')
  return res.json() as Promise<{ id: number; date: string; type: string }>
}

export async function deleteWorkout(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/health/workouts/${String(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete workout')
}

// Sleep analysis API
export async function fetchSleepAnalysis(days = 30): Promise<SleepAnalysis> {
  const res = await fetch(`${API_BASE}/dashboard/health/sleep?days=${String(days)}`)
  if (!res.ok) throw new Error('Failed to fetch sleep analysis')
  return res.json() as Promise<SleepAnalysis>
}

// Weight API functions
export async function fetchWeightTrend(days = 90): Promise<WeightTrend> {
  const res = await fetch(`${API_BASE}/dashboard/health/weight?days=${String(days)}`)
  if (!res.ok) throw new Error('Failed to fetch weight trend')
  return res.json() as Promise<WeightTrend>
}

export async function createWeightEntry(input: WeightInput): Promise<{ id: number; date: string; weight_kg: number }> {
  const res = await fetch(`${API_BASE}/health/weight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create weight entry')
  return res.json() as Promise<{ id: number; date: string; weight_kg: number }>
}

export async function deleteWeightEntry(date: string): Promise<void> {
  const res = await fetch(`${API_BASE}/health/weight/${date}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete weight entry')
}

// Body metrics API
export async function fetchBodyMetrics(days = 30): Promise<BodyMetrics> {
  const res = await fetch(`${API_BASE}/dashboard/health/body?days=${String(days)}`)
  if (!res.ok) throw new Error('Failed to fetch body metrics')
  return res.json() as Promise<BodyMetrics>
}

// Insights API (Phase 5)
export async function fetchHealthInsights(days = 90): Promise<HealthInsights> {
  const res = await fetch(`${API_BASE}/dashboard/health/insights?days=${String(days)}`)
  if (!res.ok) throw new Error('Failed to fetch health insights')
  return res.json() as Promise<HealthInsights>
}

// Goals API (Phase 6)
export async function fetchGoals(includeInactive = false): Promise<HealthGoal[]> {
  const url = includeInactive ? `${API_BASE}/health/goals?all=true` : `${API_BASE}/health/goals`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch goals')
  return res.json() as Promise<HealthGoal[]>
}

export async function upsertGoal(input: HealthGoalInput): Promise<{ id: number; goal_type: string; target: number }> {
  const res = await fetch(`${API_BASE}/health/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to save goal')
  return res.json() as Promise<{ id: number; goal_type: string; target: number }>
}

export async function deleteGoal(goalType: string): Promise<void> {
  const res = await fetch(`${API_BASE}/health/goals/${goalType}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete goal')
}

export async function fetchGoalsOverview(): Promise<GoalsOverview> {
  const res = await fetch(`${API_BASE}/dashboard/health/goals`)
  if (!res.ok) throw new Error('Failed to fetch goals overview')
  return res.json() as Promise<GoalsOverview>
}

export async function fetchWeeklySummary(week: 'current' | 'last' = 'last'): Promise<WeeklySummary> {
  const url = week === 'current' 
    ? `${API_BASE}/dashboard/health/weekly?week=current`
    : `${API_BASE}/dashboard/health/weekly`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch weekly summary')
  return res.json() as Promise<WeeklySummary>
}
