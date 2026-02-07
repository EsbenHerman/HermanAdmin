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

// Contributor to a score
export interface Contributor {
  name: string
  value: number
  impact: 'positive' | 'negative' | 'neutral'
}

// Insight for a single score
export interface ScoreInsight {
  score?: number
  avg_7d: number
  avg_30d: number
  trend: 'up' | 'down' | 'stable'
  trend_delta: number
  contributors: Contributor[]
}

// Dashboard summary
export interface HealthDashboard {
  latest_day: string
  
  // Verdict
  verdict: string
  verdict_type: 'push' | 'normal' | 'recovery' | 'unknown'
  
  // Legacy fields
  sleep_score?: number
  readiness_score?: number
  activity_score?: number
  avg_sleep_score_7d: number
  avg_readiness_7d: number
  avg_activity_7d: number
  
  // Enhanced insights (Phase 1)
  sleep?: ScoreInsight
  readiness?: ScoreInsight
  activity?: ScoreInsight
  
  // Activity metrics (Phase 2)
  activity_metrics?: ActivityMetrics
}

// Score history point for charts
export interface ScoreHistoryPoint {
  day: string
  sleep_score?: number
  readiness_score?: number
  activity_score?: number
  steps?: number
}

// Activity metrics for display
export interface ActivityMetrics {
  steps?: number
  active_calories?: number
  total_calories?: number
}

// Workout entry
export interface Workout {
  id: number
  date: string
  type: 'strength' | 'cardio'
  notes: string
  created_at: string
}

// Workout input for creating
export interface WorkoutInput {
  date?: string
  type: 'strength' | 'cardio'
  notes?: string
}

// Sleep breakdown point for charting
export interface SleepBreakdownPoint {
  day: string
  score?: number
  deep_sleep?: number
  rem_sleep?: number
  efficiency?: number
  latency?: number
  restfulness?: number
  timing?: number
  total_sleep?: number
}

// Sleep debt tracking data
export interface SleepDebtData {
  current_debt: number
  debt_trend: 'increasing' | 'decreasing' | 'stable'
  days_in_debt: number
  last_good_night: string
  weekly_avg_score: number
  recommended_rest: number
}

// Sleep timing point
export interface SleepTimingPoint {
  day: string
  timing_score?: number
  day_of_week: number
}

// Full sleep analysis response
export interface SleepAnalysis {
  breakdown: SleepBreakdownPoint[]
  debt: SleepDebtData
  timing: SleepTimingPoint[]
  averages: Record<string, number>
  weekday_timing_avg: Record<string, number>
}

// Weight entry
export interface WeightEntry {
  id: number
  date: string
  weight_kg: number
  notes: string
  created_at: string
}

// Weight input for creating
export interface WeightInput {
  date?: string
  weight_kg: number
  notes?: string
}

// Weight trend data
export interface WeightTrend {
  latest?: WeightEntry
  history: WeightEntry[]
  avg_7d?: number
  avg_30d?: number
  trend: 'up' | 'down' | 'stable'
  trend_delta: number
  min_weight?: number
  max_weight?: number
}

// Body metric point for charts
export interface BodyMetricPoint {
  day: string
  hrv_balance?: number
  resting_heart_rate?: number
  temperature_deviation?: number
}

// Body metrics response
export interface BodyMetrics {
  latest_day: string
  hrv_balance?: number
  resting_heart_rate?: number
  temperature_deviation?: number
  avg_hrv_7d: number
  avg_hrv_30d: number
  avg_rhr_7d: number
  avg_rhr_30d: number
  avg_temp_7d: number
  avg_temp_30d: number
  hrv_trend: 'up' | 'down' | 'stable'
  hrv_trend_delta: number
  rhr_trend: 'up' | 'down' | 'stable'
  rhr_trend_delta: number
  temp_trend: 'up' | 'down' | 'stable'
  temp_trend_delta: number
  history: BodyMetricPoint[]
}

// --- Phase 5: Correlations & Insights ---

// Correlation between two metrics
export interface Correlation {
  metric1: string
  metric2: string
  coefficient: number
  strength: 'strong' | 'moderate' | 'weak' | 'none'
  direction: 'positive' | 'negative' | 'neutral'
  insight: string
}

// Weekday pattern
export interface WeekdayPattern {
  day_name: string
  day_number: number
  avg_sleep: number
  avg_readiness: number
  avg_activity: number
  avg_steps: number
  sample_size: number
}

// Weekday insight
export interface WeekdayInsight {
  day_name: string
  metric: string
  type: 'best' | 'worst'
  value: number
  avg_all: number
  insight: string
}

// Personal record
export interface PersonalRecord {
  type: string
  value: number
  date?: string
  description: string
}

// Streak tracking
export interface Streak {
  type: string
  current_streak: number
  best_streak: number
  last_achieved?: string
  is_active: boolean
}

// Full insights response
export interface HealthInsights {
  correlations: Correlation[]
  weekday_patterns: WeekdayPattern[]
  weekday_insights: WeekdayInsight[]
  records: PersonalRecord[]
  streaks: Streak[]
  total_days: number
  avg_sleep: number
  avg_readiness: number
  avg_activity: number
}

// --- Phase 6: Goals & Streaks ---

// Health goal configuration
export interface HealthGoal {
  id: number
  goal_type: 'step_goal' | 'sleep_score' | 'readiness_score' | 'workout_frequency'
  target: number
  active: boolean
  created_at: string
  updated_at: string
}

// Goal input for creating/updating
export interface HealthGoalInput {
  goal_type: 'step_goal' | 'sleep_score' | 'readiness_score' | 'workout_frequency'
  target: number
  active?: boolean
}

// Progress toward a single goal
export interface GoalProgress {
  goal: HealthGoal
  current_value: number
  progress: number // 0-100
  met: boolean
  current_streak: number
  best_streak: number
  weekly_count: number
  last_achieved?: string
}

// Goals overview for dashboard
export interface GoalsOverview {
  goals: GoalProgress[]
  todays_met: number
  todays_total: number
  weekly_met: number
  weekly_total: number
}

// Weekly health summary
export interface WeeklySummary {
  week_start: string
  week_end: string
  
  // Averages
  avg_sleep: number
  avg_readiness: number
  avg_activity: number
  avg_steps: number
  total_steps: number
  
  // Comparisons to previous week
  sleep_delta: number
  readiness_delta: number
  activity_delta: number
  steps_delta: number
  
  // Goals
  goals_met: number
  goals_total: number
  
  // Highlights and lowlights
  highlights: string[]
  lowlights: string[]
  
  // Best and worst days
  best_sleep_day?: string
  best_sleep_score?: number
  worst_sleep_day?: string
  worst_sleep_score?: number
  best_readiness_day?: string
  best_readiness_score?: number
  
  // Workouts
  workout_count: number
  
  // Active streaks
  active_streaks: Streak[]
}
