import { API_BASE } from '../../shared/api/client'
import type { HealthDashboard, ScoreHistoryPoint, OuraDaily } from './types'

export async function fetchHealthDashboard(): Promise<HealthDashboard> {
  const res = await fetch(`${API_BASE}/dashboard/health`)
  if (!res.ok) throw new Error('Failed to fetch health dashboard')
  return res.json()
}

export async function fetchHealthHistory(days = 30): Promise<ScoreHistoryPoint[]> {
  const res = await fetch(`${API_BASE}/dashboard/health/history?days=${days}`)
  if (!res.ok) throw new Error('Failed to fetch health history')
  return res.json()
}

export async function fetchOuraDaily(limit = 90): Promise<OuraDaily[]> {
  const res = await fetch(`${API_BASE}/health/oura?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch Oura data')
  return res.json()
}

export async function fetchOuraDayDetail(day: string): Promise<OuraDaily> {
  const res = await fetch(`${API_BASE}/health/oura/${day}`)
  if (!res.ok) throw new Error('Failed to fetch Oura day')
  return res.json()
}
