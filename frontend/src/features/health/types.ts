// Oura daily health data
export interface OuraDaily {
  id: number
  day: string // YYYY-MM-DD
  created_at: string

  // Sleep metrics
  sleep_score?: number
  sleep_deep_sleep?: number
  sleep_efficiency?: number
  sleep_latency?: number
  sleep_rem_sleep?: number
  sleep_restfulness?: number
  sleep_timing?: number
  sleep_total_sleep?: number

  // Readiness metrics
  readiness_score?: number
  readiness_activity_balance?: number
  readiness_body_temperature?: number
  readiness_hrv_balance?: number
  readiness_previous_day_activity?: number
  readiness_previous_night?: number
  readiness_recovery_index?: number
  readiness_resting_heart_rate?: number
  readiness_sleep_balance?: number
  readiness_sleep_regularity?: number
  temperature_deviation?: number

  // Activity metrics
  activity_score?: number
  activity_active_calories?: number
  activity_steps?: number
  activity_total_calories?: number
  activity_meet_daily_targets?: number
  activity_move_every_hour?: number
  activity_recovery_time?: number
  activity_stay_active?: number
  activity_training_frequency?: number
  activity_training_volume?: number
}

// Dashboard summary
export interface HealthDashboard {
  latest_day: string
  sleep_score?: number
  readiness_score?: number
  activity_score?: number
  avg_sleep_score_7d: number
  avg_readiness_7d: number
  avg_activity_7d: number
}

// Score history point for charts
export interface ScoreHistoryPoint {
  day: string
  sleep_score?: number
  readiness_score?: number
  activity_score?: number
}
