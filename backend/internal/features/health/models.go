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

// HealthDashboard summarizes health metrics
type HealthDashboard struct {
	LatestDay        string  `json:"latest_day"`
	SleepScore       *int    `json:"sleep_score,omitempty"`
	ReadinessScore   *int    `json:"readiness_score,omitempty"`
	ActivityScore    *int    `json:"activity_score,omitempty"`
	AvgSleepScore7d  float64 `json:"avg_sleep_score_7d"`
	AvgReadiness7d   float64 `json:"avg_readiness_7d"`
	AvgActivity7d    float64 `json:"avg_activity_7d"`
}

// ScoreHistoryPoint represents a single day's scores for charting
type ScoreHistoryPoint struct {
	Day            string `json:"day"`
	SleepScore     *int   `json:"sleep_score,omitempty"`
	ReadinessScore *int   `json:"readiness_score,omitempty"`
	ActivityScore  *int   `json:"activity_score,omitempty"`
}
