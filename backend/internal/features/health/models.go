package health

import "time"

// OuraDaily stores aggregated daily health metrics from Oura
type OuraDaily struct {
	ID        int64     `json:"id"`
	Day       string    `json:"day"` // YYYY-MM-DD
	CreatedAt time.Time `json:"created_at"`

	// Sleep metrics
	SleepScore           *int `json:"sleep_score,omitempty"`
	SleepDeepSleep       *int `json:"sleep_deep_sleep,omitempty"`
	SleepEfficiency      *int `json:"sleep_efficiency,omitempty"`
	SleepLatency         *int `json:"sleep_latency,omitempty"`
	SleepRemSleep        *int `json:"sleep_rem_sleep,omitempty"`
	SleepRestfulness     *int `json:"sleep_restfulness,omitempty"`
	SleepTiming          *int `json:"sleep_timing,omitempty"`
	SleepTotalSleep      *int `json:"sleep_total_sleep,omitempty"`

	// Readiness metrics
	ReadinessScore             *int     `json:"readiness_score,omitempty"`
	ReadinessActivityBalance   *int     `json:"readiness_activity_balance,omitempty"`
	ReadinessBodyTemperature   *int     `json:"readiness_body_temperature,omitempty"`
	ReadinessHrvBalance        *int     `json:"readiness_hrv_balance,omitempty"`
	ReadinessPreviousDayActivity *int   `json:"readiness_previous_day_activity,omitempty"`
	ReadinessPreviousNight     *int     `json:"readiness_previous_night,omitempty"`
	ReadinessRecoveryIndex     *int     `json:"readiness_recovery_index,omitempty"`
	ReadinessRestingHeartRate  *int     `json:"readiness_resting_heart_rate,omitempty"`
	ReadinessSleepBalance      *int     `json:"readiness_sleep_balance,omitempty"`
	ReadinessSleepRegularity   *int     `json:"readiness_sleep_regularity,omitempty"`
	TemperatureDeviation       *float64 `json:"temperature_deviation,omitempty"`

	// Activity metrics
	ActivityScore              *int `json:"activity_score,omitempty"`
	ActivityActiveCalories     *int `json:"activity_active_calories,omitempty"`
	ActivitySteps              *int `json:"activity_steps,omitempty"`
	ActivityTotalCalories      *int `json:"activity_total_calories,omitempty"`
	ActivityMeetDailyTargets   *int `json:"activity_meet_daily_targets,omitempty"`
	ActivityMoveEveryHour      *int `json:"activity_move_every_hour,omitempty"`
	ActivityRecoveryTime       *int `json:"activity_recovery_time,omitempty"`
	ActivityStayActive         *int `json:"activity_stay_active,omitempty"`
	ActivityTrainingFrequency  *int `json:"activity_training_frequency,omitempty"`
	ActivityTrainingVolume     *int `json:"activity_training_volume,omitempty"`
}

// OuraDailyInput is the request body for creating/updating daily health data
type OuraDailyInput struct {
	Day string `json:"day"`

	// Sleep
	SleepScore       *int `json:"sleep_score,omitempty"`
	SleepDeepSleep   *int `json:"sleep_deep_sleep,omitempty"`
	SleepEfficiency  *int `json:"sleep_efficiency,omitempty"`
	SleepLatency     *int `json:"sleep_latency,omitempty"`
	SleepRemSleep    *int `json:"sleep_rem_sleep,omitempty"`
	SleepRestfulness *int `json:"sleep_restfulness,omitempty"`
	SleepTiming      *int `json:"sleep_timing,omitempty"`
	SleepTotalSleep  *int `json:"sleep_total_sleep,omitempty"`

	// Readiness
	ReadinessScore             *int     `json:"readiness_score,omitempty"`
	ReadinessActivityBalance   *int     `json:"readiness_activity_balance,omitempty"`
	ReadinessBodyTemperature   *int     `json:"readiness_body_temperature,omitempty"`
	ReadinessHrvBalance        *int     `json:"readiness_hrv_balance,omitempty"`
	ReadinessPreviousDayActivity *int   `json:"readiness_previous_day_activity,omitempty"`
	ReadinessPreviousNight     *int     `json:"readiness_previous_night,omitempty"`
	ReadinessRecoveryIndex     *int     `json:"readiness_recovery_index,omitempty"`
	ReadinessRestingHeartRate  *int     `json:"readiness_resting_heart_rate,omitempty"`
	ReadinessSleepBalance      *int     `json:"readiness_sleep_balance,omitempty"`
	ReadinessSleepRegularity   *int     `json:"readiness_sleep_regularity,omitempty"`
	TemperatureDeviation       *float64 `json:"temperature_deviation,omitempty"`

	// Activity
	ActivityScore              *int `json:"activity_score,omitempty"`
	ActivityActiveCalories     *int `json:"activity_active_calories,omitempty"`
	ActivitySteps              *int `json:"activity_steps,omitempty"`
	ActivityTotalCalories      *int `json:"activity_total_calories,omitempty"`
	ActivityMeetDailyTargets   *int `json:"activity_meet_daily_targets,omitempty"`
	ActivityMoveEveryHour      *int `json:"activity_move_every_hour,omitempty"`
	ActivityRecoveryTime       *int `json:"activity_recovery_time,omitempty"`
	ActivityStayActive         *int `json:"activity_stay_active,omitempty"`
	ActivityTrainingFrequency  *int `json:"activity_training_frequency,omitempty"`
	ActivityTrainingVolume     *int `json:"activity_training_volume,omitempty"`
}

// Contributor represents a factor affecting a score
type Contributor struct {
	Name   string `json:"name"`
	Value  int    `json:"value"`
	Impact string `json:"impact"` // "positive", "negative", "neutral"
}

// ScoreInsight provides context for a single score
type ScoreInsight struct {
	Score        *int          `json:"score,omitempty"`
	Avg7d        float64       `json:"avg_7d"`
	Avg30d       float64       `json:"avg_30d"`
	Trend        string        `json:"trend"`         // "up", "down", "stable"
	TrendDelta   int           `json:"trend_delta"`   // difference from 7d avg
	Contributors []Contributor `json:"contributors"`  // top contributors
}

// ActivityMetrics holds activity-specific data for display
type ActivityMetrics struct {
	Steps          *int `json:"steps,omitempty"`
	ActiveCalories *int `json:"active_calories,omitempty"`
	TotalCalories  *int `json:"total_calories,omitempty"`
}

// HealthDashboard summarizes health metrics
type HealthDashboard struct {
	LatestDay string `json:"latest_day"`

	// Verdict
	Verdict     string `json:"verdict"`      // Human-readable recommendation
	VerdictType string `json:"verdict_type"` // "push", "normal", "recovery"

	// Legacy fields (for backward compatibility)
	SleepScore      *int    `json:"sleep_score,omitempty"`
	ReadinessScore  *int    `json:"readiness_score,omitempty"`
	ActivityScore   *int    `json:"activity_score,omitempty"`
	AvgSleepScore7d float64 `json:"avg_sleep_score_7d"`
	AvgReadiness7d  float64 `json:"avg_readiness_7d"`
	AvgActivity7d   float64 `json:"avg_activity_7d"`

	// Enhanced insights (Phase 1)
	Sleep     *ScoreInsight `json:"sleep,omitempty"`
	Readiness *ScoreInsight `json:"readiness,omitempty"`
	Activity  *ScoreInsight `json:"activity,omitempty"`

	// Activity metrics (Phase 2)
	ActivityMetrics *ActivityMetrics `json:"activity_metrics,omitempty"`
}

// ScoreHistoryPoint represents a single day's scores for charting
type ScoreHistoryPoint struct {
	Day            string `json:"day"`
	SleepScore     *int   `json:"sleep_score,omitempty"`
	ReadinessScore *int   `json:"readiness_score,omitempty"`
	ActivityScore  *int   `json:"activity_score,omitempty"`
	Steps          *int   `json:"steps,omitempty"`
}

// Workout represents a single workout session
type Workout struct {
	ID        int64     `json:"id"`
	Date      string    `json:"date"`      // YYYY-MM-DD
	Type      string    `json:"type"`      // strength, cardio
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}

// WorkoutInput is the request body for creating a workout
type WorkoutInput struct {
	Date  string `json:"date"`  // YYYY-MM-DD, defaults to today
	Type  string `json:"type"`  // strength, cardio
	Notes string `json:"notes"`
}

// SleepBreakdownPoint represents sleep component scores for a single day
type SleepBreakdownPoint struct {
	Day          string `json:"day"`
	Score        *int   `json:"score,omitempty"`
	DeepSleep    *int   `json:"deep_sleep,omitempty"`
	RemSleep     *int   `json:"rem_sleep,omitempty"`
	Efficiency   *int   `json:"efficiency,omitempty"`
	Latency      *int   `json:"latency,omitempty"`
	Restfulness  *int   `json:"restfulness,omitempty"`
	Timing       *int   `json:"timing,omitempty"`
	TotalSleep   *int   `json:"total_sleep,omitempty"`
}

// SleepDebtData tracks accumulated sleep debt
type SleepDebtData struct {
	CurrentDebt     float64 `json:"current_debt"`      // Accumulated debt (negative = surplus)
	DebtTrend       string  `json:"debt_trend"`        // "increasing", "decreasing", "stable"
	DaysInDebt      int     `json:"days_in_debt"`      // Consecutive days below threshold
	LastGoodNight   string  `json:"last_good_night"`   // Last night with score >= threshold
	WeeklyAvgScore  float64 `json:"weekly_avg_score"`  // 7-day average sleep score
	RecommendedRest int     `json:"recommended_rest"`  // Extra rest days recommended
}

// SleepTimingPoint represents timing consistency for a single day
type SleepTimingPoint struct {
	Day           string `json:"day"`
	TimingScore   *int   `json:"timing_score,omitempty"`
	DayOfWeek     int    `json:"day_of_week"` // 0=Sunday, 1=Monday, etc.
}

// SleepAnalysis is the full sleep deep dive response
type SleepAnalysis struct {
	// Breakdown data for charting
	Breakdown []SleepBreakdownPoint `json:"breakdown"`

	// Current sleep debt status
	Debt SleepDebtData `json:"debt"`

	// Timing consistency data
	Timing []SleepTimingPoint `json:"timing"`

	// Averages for each component (last 30 days)
	Averages map[string]float64 `json:"averages"`

	// Weekday timing averages
	WeekdayTimingAvg map[string]float64 `json:"weekday_timing_avg"`
}

// WeightEntry represents a single weight measurement
type WeightEntry struct {
	ID        int64     `json:"id"`
	Date      string    `json:"date"`      // YYYY-MM-DD
	WeightKg  float64   `json:"weight_kg"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}

// WeightInput is the request body for creating/updating weight entries
type WeightInput struct {
	Date     string  `json:"date"`      // YYYY-MM-DD, defaults to today
	WeightKg float64 `json:"weight_kg"`
	Notes    string  `json:"notes"`
}

// WeightTrend contains weight history and statistics
type WeightTrend struct {
	Latest       *WeightEntry   `json:"latest,omitempty"`
	History      []WeightEntry  `json:"history"`
	Avg7d        *float64       `json:"avg_7d,omitempty"`
	Avg30d       *float64       `json:"avg_30d,omitempty"`
	Trend        string         `json:"trend"`       // "up", "down", "stable"
	TrendDelta   float64        `json:"trend_delta"` // kg difference from 7d avg
	MinWeight    *float64       `json:"min_weight,omitempty"`
	MaxWeight    *float64       `json:"max_weight,omitempty"`
}

// BodyMetricPoint represents a single day's body metrics
type BodyMetricPoint struct {
	Day                  string   `json:"day"`
	HrvBalance           *int     `json:"hrv_balance,omitempty"`
	RestingHeartRate     *int     `json:"resting_heart_rate,omitempty"`
	TemperatureDeviation *float64 `json:"temperature_deviation,omitempty"`
}

// BodyMetrics contains body metric trends from Oura data
type BodyMetrics struct {
	// Latest values
	LatestDay            string   `json:"latest_day"`
	HrvBalance           *int     `json:"hrv_balance,omitempty"`
	RestingHeartRate     *int     `json:"resting_heart_rate,omitempty"`
	TemperatureDeviation *float64 `json:"temperature_deviation,omitempty"`

	// 7-day and 30-day averages
	AvgHrv7d   float64 `json:"avg_hrv_7d"`
	AvgHrv30d  float64 `json:"avg_hrv_30d"`
	AvgRhr7d   float64 `json:"avg_rhr_7d"`
	AvgRhr30d  float64 `json:"avg_rhr_30d"`
	AvgTemp7d  float64 `json:"avg_temp_7d"`
	AvgTemp30d float64 `json:"avg_temp_30d"`

	// Trends
	HrvTrend      string  `json:"hrv_trend"`       // "up", "down", "stable"
	HrvTrendDelta int     `json:"hrv_trend_delta"`
	RhrTrend      string  `json:"rhr_trend"`
	RhrTrendDelta int     `json:"rhr_trend_delta"`
	TempTrend     string  `json:"temp_trend"`
	TempTrendDelta float64 `json:"temp_trend_delta"`

	// History for charts
	History []BodyMetricPoint `json:"history"`
}

// --- Phase 5: Correlations & Insights ---

// dailyData is used internally for insight calculations
type dailyData struct {
	day       string
	dayTime   time.Time
	sleep     *int
	readiness *int
	activity  *int
	steps     *int
}

// Correlation represents a statistical relationship between two metrics
type Correlation struct {
	Metric1     string  `json:"metric1"`
	Metric2     string  `json:"metric2"`
	Coefficient float64 `json:"coefficient"` // Pearson correlation (-1 to 1)
	Strength    string  `json:"strength"`    // "strong", "moderate", "weak", "none"
	Direction   string  `json:"direction"`   // "positive", "negative"
	Insight     string  `json:"insight"`     // Human-readable insight
}

// WeekdayPattern represents score patterns by day of week
type WeekdayPattern struct {
	DayName     string  `json:"day_name"`
	DayNumber   int     `json:"day_number"` // 0=Sunday, 6=Saturday
	AvgSleep    float64 `json:"avg_sleep"`
	AvgReadiness float64 `json:"avg_readiness"`
	AvgActivity float64 `json:"avg_activity"`
	AvgSteps    float64 `json:"avg_steps"`
	SampleSize  int     `json:"sample_size"`
}

// WeekdayInsight is a discovered pattern about a specific day
type WeekdayInsight struct {
	DayName   string  `json:"day_name"`
	Metric    string  `json:"metric"`
	Type      string  `json:"type"`      // "best", "worst"
	Value     float64 `json:"value"`
	AvgAll    float64 `json:"avg_all"`   // Overall average for comparison
	Insight   string  `json:"insight"`
}

// PersonalRecord represents a best achievement
type PersonalRecord struct {
	Type        string `json:"type"`         // "highest_sleep", "longest_streak", etc.
	Value       int    `json:"value"`
	Date        string `json:"date,omitempty"`
	Description string `json:"description"`
}

// Streak tracks consecutive days meeting a goal
type Streak struct {
	Type          string `json:"type"`           // "sleep_80", "readiness_80", "steps_10k"
	CurrentStreak int    `json:"current_streak"`
	BestStreak    int    `json:"best_streak"`
	LastAchieved  string `json:"last_achieved,omitempty"`
	IsActive      bool   `json:"is_active"`
}

// HealthInsights is the full Phase 5 response
type HealthInsights struct {
	// Score correlations
	Correlations []Correlation `json:"correlations"`

	// Weekly patterns
	WeekdayPatterns []WeekdayPattern `json:"weekday_patterns"`
	WeekdayInsights []WeekdayInsight `json:"weekday_insights"`

	// Personal records and streaks
	Records []PersonalRecord `json:"records"`
	Streaks []Streak         `json:"streaks"`

	// Summary statistics
	TotalDays      int     `json:"total_days"`
	AvgSleep       float64 `json:"avg_sleep"`
	AvgReadiness   float64 `json:"avg_readiness"`
	AvgActivity    float64 `json:"avg_activity"`
}

// --- Phase 6: Goals & Streaks ---

// HealthGoal represents a configurable health target
type HealthGoal struct {
	ID        int64     `json:"id"`
	GoalType  string    `json:"goal_type"`  // step_goal, sleep_score, readiness_score, workout_frequency
	Target    int       `json:"target"`     // Target value (e.g., 10000 steps, 80 score, 3 workouts/week)
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// HealthGoalInput is the request body for creating/updating goals
type HealthGoalInput struct {
	GoalType string `json:"goal_type"`
	Target   int    `json:"target"`
	Active   *bool  `json:"active,omitempty"`
}

// GoalProgress represents progress toward a single goal
type GoalProgress struct {
	Goal          HealthGoal `json:"goal"`
	CurrentValue  int        `json:"current_value"`   // Today's value
	Progress      float64    `json:"progress"`        // 0-100 percentage
	Met           bool       `json:"met"`             // Whether goal was met today
	CurrentStreak int        `json:"current_streak"`  // Consecutive days meeting goal
	BestStreak    int        `json:"best_streak"`     // All-time best streak
	WeeklyCount   int        `json:"weekly_count"`    // Days met this week (for workout_frequency)
	LastAchieved  string     `json:"last_achieved,omitempty"`
}

// GoalsOverview is the dashboard response for goals
type GoalsOverview struct {
	Goals       []GoalProgress `json:"goals"`
	TodaysMet   int            `json:"todays_met"`
	TodaysTotal int            `json:"todays_total"`
	WeeklyMet   int            `json:"weekly_met"`   // Goals met this week (sum across all days)
	WeeklyTotal int            `json:"weekly_total"` // Total goal opportunities this week
}

// WeeklySummary is the end-of-week health review
type WeeklySummary struct {
	WeekStart string `json:"week_start"` // Monday of the week
	WeekEnd   string `json:"week_end"`   // Sunday of the week

	// Averages
	AvgSleep     float64 `json:"avg_sleep"`
	AvgReadiness float64 `json:"avg_readiness"`
	AvgActivity  float64 `json:"avg_activity"`
	AvgSteps     float64 `json:"avg_steps"`
	TotalSteps   int     `json:"total_steps"`

	// Comparisons to previous week
	SleepDelta     float64 `json:"sleep_delta"`
	ReadinessDelta float64 `json:"readiness_delta"`
	ActivityDelta  float64 `json:"activity_delta"`
	StepsDelta     float64 `json:"steps_delta"`

	// Goals
	GoalsMet   int `json:"goals_met"`
	GoalsTotal int `json:"goals_total"`

	// Highlights and lowlights
	Highlights []string `json:"highlights"`
	Lowlights  []string `json:"lowlights"`

	// Best and worst days
	BestSleepDay      string `json:"best_sleep_day,omitempty"`
	BestSleepScore    int    `json:"best_sleep_score,omitempty"`
	WorstSleepDay     string `json:"worst_sleep_day,omitempty"`
	WorstSleepScore   int    `json:"worst_sleep_score,omitempty"`
	BestReadinessDay  string `json:"best_readiness_day,omitempty"`
	BestReadinessScore int   `json:"best_readiness_score,omitempty"`

	// Workouts
	WorkoutCount int `json:"workout_count"`

	// Streaks
	ActiveStreaks []Streak `json:"active_streaks"`
}
