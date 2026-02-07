package health

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/EsbenHerman/HermanAdmin/backend/internal/core"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// formatDate converts time.Time to YYYY-MM-DD string
func formatDate(t time.Time) string {
	return t.Format("2006-01-02")
}

// ListOuraDaily returns all Oura daily records, ordered by day desc
func (h *Handler) ListOuraDaily(w http.ResponseWriter, r *http.Request) {
	limit := 90 // Default to 90 days
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 365 {
			limit = n
		}
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT id, day, created_at,
			sleep_score, sleep_deep_sleep, sleep_efficiency, sleep_latency,
			sleep_rem_sleep, sleep_restfulness, sleep_timing, sleep_total_sleep,
			readiness_score, readiness_activity_balance, readiness_body_temperature,
			readiness_hrv_balance, readiness_previous_day_activity, readiness_previous_night,
			readiness_recovery_index, readiness_resting_heart_rate, readiness_sleep_balance,
			readiness_sleep_regularity, temperature_deviation,
			activity_score, activity_active_calories, activity_steps, activity_total_calories,
			activity_meet_daily_targets, activity_move_every_hour, activity_recovery_time,
			activity_stay_active, activity_training_frequency, activity_training_volume
		FROM oura_daily
		ORDER BY day DESC
		LIMIT $1
	`, limit)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var results []OuraDaily
	for rows.Next() {
		var d OuraDaily
		var dayTime time.Time
		err := rows.Scan(
			&d.ID, &dayTime, &d.CreatedAt,
			&d.SleepScore, &d.SleepDeepSleep, &d.SleepEfficiency, &d.SleepLatency,
			&d.SleepRemSleep, &d.SleepRestfulness, &d.SleepTiming, &d.SleepTotalSleep,
			&d.ReadinessScore, &d.ReadinessActivityBalance, &d.ReadinessBodyTemperature,
			&d.ReadinessHrvBalance, &d.ReadinessPreviousDayActivity, &d.ReadinessPreviousNight,
			&d.ReadinessRecoveryIndex, &d.ReadinessRestingHeartRate, &d.ReadinessSleepBalance,
			&d.ReadinessSleepRegularity, &d.TemperatureDeviation,
			&d.ActivityScore, &d.ActivityActiveCalories, &d.ActivitySteps, &d.ActivityTotalCalories,
			&d.ActivityMeetDailyTargets, &d.ActivityMoveEveryHour, &d.ActivityRecoveryTime,
			&d.ActivityStayActive, &d.ActivityTrainingFrequency, &d.ActivityTrainingVolume,
		)
		if err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		d.Day = formatDate(dayTime)
		results = append(results, d)
	}

	core.WriteJSON(w, http.StatusOK, results)
}

// GetOuraDaily returns a single day's Oura data
func (h *Handler) GetOuraDaily(w http.ResponseWriter, r *http.Request) {
	day := chi.URLParam(r, "day")

	var d OuraDaily
	var dayTime time.Time
	err := h.db.QueryRow(r.Context(), `
		SELECT id, day, created_at,
			sleep_score, sleep_deep_sleep, sleep_efficiency, sleep_latency,
			sleep_rem_sleep, sleep_restfulness, sleep_timing, sleep_total_sleep,
			readiness_score, readiness_activity_balance, readiness_body_temperature,
			readiness_hrv_balance, readiness_previous_day_activity, readiness_previous_night,
			readiness_recovery_index, readiness_resting_heart_rate, readiness_sleep_balance,
			readiness_sleep_regularity, temperature_deviation,
			activity_score, activity_active_calories, activity_steps, activity_total_calories,
			activity_meet_daily_targets, activity_move_every_hour, activity_recovery_time,
			activity_stay_active, activity_training_frequency, activity_training_volume
		FROM oura_daily
		WHERE day = $1
	`, day).Scan(
		&d.ID, &dayTime, &d.CreatedAt,
		&d.SleepScore, &d.SleepDeepSleep, &d.SleepEfficiency, &d.SleepLatency,
		&d.SleepRemSleep, &d.SleepRestfulness, &d.SleepTiming, &d.SleepTotalSleep,
		&d.ReadinessScore, &d.ReadinessActivityBalance, &d.ReadinessBodyTemperature,
		&d.ReadinessHrvBalance, &d.ReadinessPreviousDayActivity, &d.ReadinessPreviousNight,
		&d.ReadinessRecoveryIndex, &d.ReadinessRestingHeartRate, &d.ReadinessSleepBalance,
		&d.ReadinessSleepRegularity, &d.TemperatureDeviation,
		&d.ActivityScore, &d.ActivityActiveCalories, &d.ActivitySteps, &d.ActivityTotalCalories,
		&d.ActivityMeetDailyTargets, &d.ActivityMoveEveryHour, &d.ActivityRecoveryTime,
		&d.ActivityStayActive, &d.ActivityTrainingFrequency, &d.ActivityTrainingVolume,
	)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "Day not found")
		return
	}
	d.Day = formatDate(dayTime)

	core.WriteJSON(w, http.StatusOK, d)
}

// UpsertOuraDaily creates or updates a day's Oura data
func (h *Handler) UpsertOuraDaily(w http.ResponseWriter, r *http.Request) {
	var input OuraDailyInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if input.Day == "" {
		core.WriteError(w, http.StatusBadRequest, "day is required")
		return
	}

	var id int64
	err := h.db.QueryRow(r.Context(), `
		INSERT INTO oura_daily (
			day,
			sleep_score, sleep_deep_sleep, sleep_efficiency, sleep_latency,
			sleep_rem_sleep, sleep_restfulness, sleep_timing, sleep_total_sleep,
			readiness_score, readiness_activity_balance, readiness_body_temperature,
			readiness_hrv_balance, readiness_previous_day_activity, readiness_previous_night,
			readiness_recovery_index, readiness_resting_heart_rate, readiness_sleep_balance,
			readiness_sleep_regularity, temperature_deviation,
			activity_score, activity_active_calories, activity_steps, activity_total_calories,
			activity_meet_daily_targets, activity_move_every_hour, activity_recovery_time,
			activity_stay_active, activity_training_frequency, activity_training_volume
		) VALUES (
			$1,
			$2, $3, $4, $5, $6, $7, $8, $9,
			$10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
			$21, $22, $23, $24, $25, $26, $27, $28, $29, $30
		)
		ON CONFLICT (day) DO UPDATE SET
			sleep_score = EXCLUDED.sleep_score,
			sleep_deep_sleep = EXCLUDED.sleep_deep_sleep,
			sleep_efficiency = EXCLUDED.sleep_efficiency,
			sleep_latency = EXCLUDED.sleep_latency,
			sleep_rem_sleep = EXCLUDED.sleep_rem_sleep,
			sleep_restfulness = EXCLUDED.sleep_restfulness,
			sleep_timing = EXCLUDED.sleep_timing,
			sleep_total_sleep = EXCLUDED.sleep_total_sleep,
			readiness_score = EXCLUDED.readiness_score,
			readiness_activity_balance = EXCLUDED.readiness_activity_balance,
			readiness_body_temperature = EXCLUDED.readiness_body_temperature,
			readiness_hrv_balance = EXCLUDED.readiness_hrv_balance,
			readiness_previous_day_activity = EXCLUDED.readiness_previous_day_activity,
			readiness_previous_night = EXCLUDED.readiness_previous_night,
			readiness_recovery_index = EXCLUDED.readiness_recovery_index,
			readiness_resting_heart_rate = EXCLUDED.readiness_resting_heart_rate,
			readiness_sleep_balance = EXCLUDED.readiness_sleep_balance,
			readiness_sleep_regularity = EXCLUDED.readiness_sleep_regularity,
			temperature_deviation = EXCLUDED.temperature_deviation,
			activity_score = EXCLUDED.activity_score,
			activity_active_calories = EXCLUDED.activity_active_calories,
			activity_steps = EXCLUDED.activity_steps,
			activity_total_calories = EXCLUDED.activity_total_calories,
			activity_meet_daily_targets = EXCLUDED.activity_meet_daily_targets,
			activity_move_every_hour = EXCLUDED.activity_move_every_hour,
			activity_recovery_time = EXCLUDED.activity_recovery_time,
			activity_stay_active = EXCLUDED.activity_stay_active,
			activity_training_frequency = EXCLUDED.activity_training_frequency,
			activity_training_volume = EXCLUDED.activity_training_volume
		RETURNING id
	`,
		input.Day,
		input.SleepScore, input.SleepDeepSleep, input.SleepEfficiency, input.SleepLatency,
		input.SleepRemSleep, input.SleepRestfulness, input.SleepTiming, input.SleepTotalSleep,
		input.ReadinessScore, input.ReadinessActivityBalance, input.ReadinessBodyTemperature,
		input.ReadinessHrvBalance, input.ReadinessPreviousDayActivity, input.ReadinessPreviousNight,
		input.ReadinessRecoveryIndex, input.ReadinessRestingHeartRate, input.ReadinessSleepBalance,
		input.ReadinessSleepRegularity, input.TemperatureDeviation,
		input.ActivityScore, input.ActivityActiveCalories, input.ActivitySteps, input.ActivityTotalCalories,
		input.ActivityMeetDailyTargets, input.ActivityMoveEveryHour, input.ActivityRecoveryTime,
		input.ActivityStayActive, input.ActivityTrainingFrequency, input.ActivityTrainingVolume,
	).Scan(&id)

	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	core.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"id":  id,
		"day": input.Day,
	})
}

// BulkUpsertOuraDaily handles bulk import of historical data
func (h *Handler) BulkUpsertOuraDaily(w http.ResponseWriter, r *http.Request) {
	var inputs []OuraDailyInput
	if err := json.NewDecoder(r.Body).Decode(&inputs); err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid JSON array")
		return
	}

	inserted := 0
	for _, input := range inputs {
		if input.Day == "" {
			continue
		}

		_, err := h.db.Exec(r.Context(), `
			INSERT INTO oura_daily (
				day,
				sleep_score, sleep_deep_sleep, sleep_efficiency, sleep_latency,
				sleep_rem_sleep, sleep_restfulness, sleep_timing, sleep_total_sleep,
				readiness_score, readiness_activity_balance, readiness_body_temperature,
				readiness_hrv_balance, readiness_previous_day_activity, readiness_previous_night,
				readiness_recovery_index, readiness_resting_heart_rate, readiness_sleep_balance,
				readiness_sleep_regularity, temperature_deviation,
				activity_score, activity_active_calories, activity_steps, activity_total_calories,
				activity_meet_daily_targets, activity_move_every_hour, activity_recovery_time,
				activity_stay_active, activity_training_frequency, activity_training_volume
			) VALUES (
				$1,
				$2, $3, $4, $5, $6, $7, $8, $9,
				$10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
				$21, $22, $23, $24, $25, $26, $27, $28, $29, $30
			)
			ON CONFLICT (day) DO UPDATE SET
				sleep_score = EXCLUDED.sleep_score,
				sleep_deep_sleep = EXCLUDED.sleep_deep_sleep,
				sleep_efficiency = EXCLUDED.sleep_efficiency,
				sleep_latency = EXCLUDED.sleep_latency,
				sleep_rem_sleep = EXCLUDED.sleep_rem_sleep,
				sleep_restfulness = EXCLUDED.sleep_restfulness,
				sleep_timing = EXCLUDED.sleep_timing,
				sleep_total_sleep = EXCLUDED.sleep_total_sleep,
				readiness_score = EXCLUDED.readiness_score,
				readiness_activity_balance = EXCLUDED.readiness_activity_balance,
				readiness_body_temperature = EXCLUDED.readiness_body_temperature,
				readiness_hrv_balance = EXCLUDED.readiness_hrv_balance,
				readiness_previous_day_activity = EXCLUDED.readiness_previous_day_activity,
				readiness_previous_night = EXCLUDED.readiness_previous_night,
				readiness_recovery_index = EXCLUDED.readiness_recovery_index,
				readiness_resting_heart_rate = EXCLUDED.readiness_resting_heart_rate,
				readiness_sleep_balance = EXCLUDED.readiness_sleep_balance,
				readiness_sleep_regularity = EXCLUDED.readiness_sleep_regularity,
				temperature_deviation = EXCLUDED.temperature_deviation,
				activity_score = EXCLUDED.activity_score,
				activity_active_calories = EXCLUDED.activity_active_calories,
				activity_steps = EXCLUDED.activity_steps,
				activity_total_calories = EXCLUDED.activity_total_calories,
				activity_meet_daily_targets = EXCLUDED.activity_meet_daily_targets,
				activity_move_every_hour = EXCLUDED.activity_move_every_hour,
				activity_recovery_time = EXCLUDED.activity_recovery_time,
				activity_stay_active = EXCLUDED.activity_stay_active,
				activity_training_frequency = EXCLUDED.activity_training_frequency,
				activity_training_volume = EXCLUDED.activity_training_volume
		`,
			input.Day,
			input.SleepScore, input.SleepDeepSleep, input.SleepEfficiency, input.SleepLatency,
			input.SleepRemSleep, input.SleepRestfulness, input.SleepTiming, input.SleepTotalSleep,
			input.ReadinessScore, input.ReadinessActivityBalance, input.ReadinessBodyTemperature,
			input.ReadinessHrvBalance, input.ReadinessPreviousDayActivity, input.ReadinessPreviousNight,
			input.ReadinessRecoveryIndex, input.ReadinessRestingHeartRate, input.ReadinessSleepBalance,
			input.ReadinessSleepRegularity, input.TemperatureDeviation,
			input.ActivityScore, input.ActivityActiveCalories, input.ActivitySteps, input.ActivityTotalCalories,
			input.ActivityMeetDailyTargets, input.ActivityMoveEveryHour, input.ActivityRecoveryTime,
			input.ActivityStayActive, input.ActivityTrainingFrequency, input.ActivityTrainingVolume,
		)
		if err == nil {
			inserted++
		}
	}

	core.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"inserted": inserted,
		"total":    len(inputs),
	})
}

// DeleteOuraDaily removes a day's Oura data
func (h *Handler) DeleteOuraDaily(w http.ResponseWriter, r *http.Request) {
	day := chi.URLParam(r, "day")

	result, err := h.db.Exec(r.Context(), `DELETE FROM oura_daily WHERE day = $1`, day)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if result.RowsAffected() == 0 {
		core.WriteError(w, http.StatusNotFound, "Day not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetDashboard returns summary health metrics with insights
func (h *Handler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	var dash HealthDashboard
	var dayTime time.Time

	// Get latest day's full data
	var latest OuraDaily
	err := h.db.QueryRow(r.Context(), `
		SELECT id, day, created_at,
			sleep_score, sleep_deep_sleep, sleep_efficiency, sleep_latency,
			sleep_rem_sleep, sleep_restfulness, sleep_timing, sleep_total_sleep,
			readiness_score, readiness_activity_balance, readiness_body_temperature,
			readiness_hrv_balance, readiness_previous_day_activity, readiness_previous_night,
			readiness_recovery_index, readiness_resting_heart_rate, readiness_sleep_balance,
			readiness_sleep_regularity, temperature_deviation,
			activity_score, activity_active_calories, activity_steps, activity_total_calories,
			activity_meet_daily_targets, activity_move_every_hour, activity_recovery_time,
			activity_stay_active, activity_training_frequency, activity_training_volume
		FROM oura_daily
		ORDER BY day DESC
		LIMIT 1
	`).Scan(
		&latest.ID, &dayTime, &latest.CreatedAt,
		&latest.SleepScore, &latest.SleepDeepSleep, &latest.SleepEfficiency, &latest.SleepLatency,
		&latest.SleepRemSleep, &latest.SleepRestfulness, &latest.SleepTiming, &latest.SleepTotalSleep,
		&latest.ReadinessScore, &latest.ReadinessActivityBalance, &latest.ReadinessBodyTemperature,
		&latest.ReadinessHrvBalance, &latest.ReadinessPreviousDayActivity, &latest.ReadinessPreviousNight,
		&latest.ReadinessRecoveryIndex, &latest.ReadinessRestingHeartRate, &latest.ReadinessSleepBalance,
		&latest.ReadinessSleepRegularity, &latest.TemperatureDeviation,
		&latest.ActivityScore, &latest.ActivityActiveCalories, &latest.ActivitySteps, &latest.ActivityTotalCalories,
		&latest.ActivityMeetDailyTargets, &latest.ActivityMoveEveryHour, &latest.ActivityRecoveryTime,
		&latest.ActivityStayActive, &latest.ActivityTrainingFrequency, &latest.ActivityTrainingVolume,
	)
	if err != nil {
		// No data yet
		core.WriteJSON(w, http.StatusOK, dash)
		return
	}
	latest.Day = formatDate(dayTime)
	dash.LatestDay = latest.Day

	// Legacy fields
	dash.SleepScore = latest.SleepScore
	dash.ReadinessScore = latest.ReadinessScore
	dash.ActivityScore = latest.ActivityScore

	// Get 7-day and 30-day averages
	var avg7dSleep, avg7dReadiness, avg7dActivity float64
	var avg30dSleep, avg30dReadiness, avg30dActivity float64

	h.db.QueryRow(r.Context(), `
		SELECT 
			COALESCE(AVG(sleep_score), 0),
			COALESCE(AVG(readiness_score), 0),
			COALESCE(AVG(activity_score), 0)
		FROM oura_daily
		WHERE day >= (SELECT MAX(day) FROM oura_daily) - INTERVAL '7 days'
	`).Scan(&avg7dSleep, &avg7dReadiness, &avg7dActivity)

	h.db.QueryRow(r.Context(), `
		SELECT 
			COALESCE(AVG(sleep_score), 0),
			COALESCE(AVG(readiness_score), 0),
			COALESCE(AVG(activity_score), 0)
		FROM oura_daily
		WHERE day >= (SELECT MAX(day) FROM oura_daily) - INTERVAL '30 days'
	`).Scan(&avg30dSleep, &avg30dReadiness, &avg30dActivity)

	dash.AvgSleepScore7d = avg7dSleep
	dash.AvgReadiness7d = avg7dReadiness
	dash.AvgActivity7d = avg7dActivity

	// Build Sleep insight
	dash.Sleep = buildScoreInsight(latest.SleepScore, avg7dSleep, avg30dSleep,
		buildSleepContributors(&latest))

	// Build Readiness insight
	dash.Readiness = buildScoreInsight(latest.ReadinessScore, avg7dReadiness, avg30dReadiness,
		buildReadinessContributors(&latest))

	// Build Activity insight
	dash.Activity = buildScoreInsight(latest.ActivityScore, avg7dActivity, avg30dActivity,
		buildActivityContributors(&latest))

	// Compute verdict
	dash.Verdict, dash.VerdictType = computeVerdict(latest.SleepScore, latest.ReadinessScore)

	// Activity metrics (Phase 2)
	dash.ActivityMetrics = &ActivityMetrics{
		Steps:          latest.ActivitySteps,
		ActiveCalories: latest.ActivityActiveCalories,
		TotalCalories:  latest.ActivityTotalCalories,
	}

	core.WriteJSON(w, http.StatusOK, dash)
}

// buildScoreInsight creates a ScoreInsight from score and averages
func buildScoreInsight(score *int, avg7d, avg30d float64, contributors []Contributor) *ScoreInsight {
	insight := &ScoreInsight{
		Score:        score,
		Avg7d:        avg7d,
		Avg30d:       avg30d,
		Contributors: contributors,
	}

	// Calculate trend vs 7d average
	if score != nil && avg7d > 0 {
		delta := float64(*score) - avg7d
		insight.TrendDelta = int(delta)
		if delta > 3 {
			insight.Trend = "up"
		} else if delta < -3 {
			insight.Trend = "down"
		} else {
			insight.Trend = "stable"
		}
	} else {
		insight.Trend = "stable"
	}

	return insight
}

// computeVerdict determines the daily recommendation
func computeVerdict(sleepScore, readinessScore *int) (string, string) {
	sleep := 0
	readiness := 0
	if sleepScore != nil {
		sleep = *sleepScore
	}
	if readinessScore != nil {
		readiness = *readinessScore
	}

	// No data
	if sleep == 0 && readiness == 0 {
		return "No data available", "unknown"
	}

	// Push day: both scores 80+
	if readiness >= 80 && sleep >= 80 {
		return "Well rested — good day for intensity", "push"
	}

	// Recovery day: either score below 60
	if readiness < 60 || sleep < 60 {
		if readiness < 50 || sleep < 50 {
			return "Recovery needed — take it easy today", "recovery"
		}
		return "Below baseline — keep activity light", "recovery"
	}

	// Normal day: scores between 60-79
	if readiness >= 70 && sleep >= 70 {
		return "Solid day — normal activity is fine", "normal"
	}

	return "Average day — listen to your body", "normal"
}

// buildSleepContributors extracts top sleep contributors
func buildSleepContributors(d *OuraDaily) []Contributor {
	contributors := []Contributor{}

	addContributor := func(name string, value *int) {
		if value == nil {
			return
		}
		impact := "neutral"
		if *value >= 80 {
			impact = "positive"
		} else if *value < 60 {
			impact = "negative"
		}
		contributors = append(contributors, Contributor{
			Name:   name,
			Value:  *value,
			Impact: impact,
		})
	}

	addContributor("Deep sleep", d.SleepDeepSleep)
	addContributor("REM sleep", d.SleepRemSleep)
	addContributor("Efficiency", d.SleepEfficiency)
	addContributor("Restfulness", d.SleepRestfulness)
	addContributor("Timing", d.SleepTiming)
	addContributor("Latency", d.SleepLatency)
	addContributor("Total sleep", d.SleepTotalSleep)

	// Sort by impact (positive first, then negative) and return top 3
	return topContributors(contributors, 3)
}

// buildReadinessContributors extracts top readiness contributors
func buildReadinessContributors(d *OuraDaily) []Contributor {
	contributors := []Contributor{}

	addContributor := func(name string, value *int) {
		if value == nil {
			return
		}
		impact := "neutral"
		if *value >= 80 {
			impact = "positive"
		} else if *value < 60 {
			impact = "negative"
		}
		contributors = append(contributors, Contributor{
			Name:   name,
			Value:  *value,
			Impact: impact,
		})
	}

	addContributor("HRV balance", d.ReadinessHrvBalance)
	addContributor("Resting HR", d.ReadinessRestingHeartRate)
	addContributor("Recovery index", d.ReadinessRecoveryIndex)
	addContributor("Sleep balance", d.ReadinessSleepBalance)
	addContributor("Previous night", d.ReadinessPreviousNight)
	addContributor("Body temperature", d.ReadinessBodyTemperature)
	addContributor("Activity balance", d.ReadinessActivityBalance)

	return topContributors(contributors, 3)
}

// buildActivityContributors extracts top activity contributors
func buildActivityContributors(d *OuraDaily) []Contributor {
	contributors := []Contributor{}

	addContributor := func(name string, value *int) {
		if value == nil {
			return
		}
		impact := "neutral"
		if *value >= 80 {
			impact = "positive"
		} else if *value < 60 {
			impact = "negative"
		}
		contributors = append(contributors, Contributor{
			Name:   name,
			Value:  *value,
			Impact: impact,
		})
	}

	addContributor("Meet daily targets", d.ActivityMeetDailyTargets)
	addContributor("Move every hour", d.ActivityMoveEveryHour)
	addContributor("Stay active", d.ActivityStayActive)
	addContributor("Training frequency", d.ActivityTrainingFrequency)
	addContributor("Training volume", d.ActivityTrainingVolume)
	addContributor("Recovery time", d.ActivityRecoveryTime)

	return topContributors(contributors, 3)
}

// topContributors returns the most significant contributors (positive and negative)
func topContributors(contributors []Contributor, max int) []Contributor {
	if len(contributors) == 0 {
		return contributors
	}

	// Separate by impact
	var positive, negative, neutral []Contributor
	for _, c := range contributors {
		switch c.Impact {
		case "positive":
			positive = append(positive, c)
		case "negative":
			negative = append(negative, c)
		default:
			neutral = append(neutral, c)
		}
	}

	// Sort each group by value (desc for positive, asc for negative)
	sortByValue := func(a, b Contributor) bool { return a.Value > b.Value }
	sortByValueAsc := func(a, b Contributor) bool { return a.Value < b.Value }

	sortContributors(positive, sortByValue)
	sortContributors(negative, sortByValueAsc)

	// Take top positive, then top negative, up to max
	result := []Contributor{}
	for i := 0; i < len(positive) && len(result) < max; i++ {
		result = append(result, positive[i])
	}
	for i := 0; i < len(negative) && len(result) < max; i++ {
		result = append(result, negative[i])
	}
	for i := 0; i < len(neutral) && len(result) < max; i++ {
		result = append(result, neutral[i])
	}

	return result
}

// sortContributors sorts contributors using the provided comparison function
func sortContributors(contributors []Contributor, less func(a, b Contributor) bool) {
	for i := 0; i < len(contributors)-1; i++ {
		for j := i + 1; j < len(contributors); j++ {
			if less(contributors[j], contributors[i]) {
				contributors[i], contributors[j] = contributors[j], contributors[i]
			}
		}
	}
}

// GetHistory returns score history for charting
func (h *Handler) GetHistory(w http.ResponseWriter, r *http.Request) {
	days := 30 // default
	if d := r.URL.Query().Get("days"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 && n <= 365 {
			days = n
		}
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT day, sleep_score, readiness_score, activity_score, activity_steps
		FROM oura_daily
		ORDER BY day DESC
		LIMIT $1
	`, days)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var history []ScoreHistoryPoint
	for rows.Next() {
		var p ScoreHistoryPoint
		var dayTime time.Time
		if err := rows.Scan(&dayTime, &p.SleepScore, &p.ReadinessScore, &p.ActivityScore, &p.Steps); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		p.Day = formatDate(dayTime)
		history = append(history, p)
	}

	// Reverse to get chronological order for charts
	for i, j := 0, len(history)-1; i < j; i, j = i+1, j-1 {
		history[i], history[j] = history[j], history[i]
	}

	core.WriteJSON(w, http.StatusOK, history)
}

// --- Workout handlers ---

// ListWorkouts returns all workouts, ordered by date desc
func (h *Handler) ListWorkouts(w http.ResponseWriter, r *http.Request) {
	limit := 100
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 500 {
			limit = n
		}
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT id, date, type, notes, created_at
		FROM workouts
		ORDER BY date DESC, id DESC
		LIMIT $1
	`, limit)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var results []Workout
	for rows.Next() {
		var wo Workout
		var dateTime time.Time
		if err := rows.Scan(&wo.ID, &dateTime, &wo.Type, &wo.Notes, &wo.CreatedAt); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		wo.Date = formatDate(dateTime)
		results = append(results, wo)
	}

	core.WriteJSON(w, http.StatusOK, results)
}

// CreateWorkout adds a new workout
func (h *Handler) CreateWorkout(w http.ResponseWriter, r *http.Request) {
	var input WorkoutInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Default to today if no date provided
	if input.Date == "" {
		input.Date = formatDate(time.Now())
	}

	// Validate type
	if input.Type != "strength" && input.Type != "cardio" {
		core.WriteError(w, http.StatusBadRequest, "type must be 'strength' or 'cardio'")
		return
	}

	var id int64
	err := h.db.QueryRow(r.Context(), `
		INSERT INTO workouts (date, type, notes)
		VALUES ($1, $2, $3)
		RETURNING id
	`, input.Date, input.Type, input.Notes).Scan(&id)

	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	core.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"id":   id,
		"date": input.Date,
		"type": input.Type,
	})
}

// GetWorkout returns a single workout by ID
func (h *Handler) GetWorkout(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var wo Workout
	var dateTime time.Time
	err = h.db.QueryRow(r.Context(), `
		SELECT id, date, type, notes, created_at
		FROM workouts
		WHERE id = $1
	`, id).Scan(&wo.ID, &dateTime, &wo.Type, &wo.Notes, &wo.CreatedAt)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "Workout not found")
		return
	}
	wo.Date = formatDate(dateTime)

	core.WriteJSON(w, http.StatusOK, wo)
}

// DeleteWorkout removes a workout by ID
func (h *Handler) DeleteWorkout(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	result, err := h.db.Exec(r.Context(), `DELETE FROM workouts WHERE id = $1`, id)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if result.RowsAffected() == 0 {
		core.WriteError(w, http.StatusNotFound, "Workout not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetSleepAnalysis returns comprehensive sleep data for the Sleep Deep Dive
func (h *Handler) GetSleepAnalysis(w http.ResponseWriter, r *http.Request) {
	days := 30 // default
	if d := r.URL.Query().Get("days"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 && n <= 365 {
			days = n
		}
	}

	analysis := SleepAnalysis{
		Breakdown:        []SleepBreakdownPoint{},
		Timing:           []SleepTimingPoint{},
		Averages:         make(map[string]float64),
		WeekdayTimingAvg: make(map[string]float64),
	}

	// Fetch sleep breakdown data
	rows, err := h.db.Query(r.Context(), `
		SELECT day, sleep_score, sleep_deep_sleep, sleep_rem_sleep, 
			sleep_efficiency, sleep_latency, sleep_restfulness, 
			sleep_timing, sleep_total_sleep
		FROM oura_daily
		ORDER BY day DESC
		LIMIT $1
	`, days)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var allPoints []SleepBreakdownPoint
	for rows.Next() {
		var p SleepBreakdownPoint
		var dayTime time.Time
		if err := rows.Scan(&dayTime, &p.Score, &p.DeepSleep, &p.RemSleep,
			&p.Efficiency, &p.Latency, &p.Restfulness, &p.Timing, &p.TotalSleep); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		p.Day = formatDate(dayTime)
		allPoints = append(allPoints, p)
	}

	// Reverse to get chronological order
	for i, j := 0, len(allPoints)-1; i < j; i, j = i+1, j-1 {
		allPoints[i], allPoints[j] = allPoints[j], allPoints[i]
	}
	analysis.Breakdown = allPoints

	// Calculate component averages
	var sumScore, sumDeep, sumRem, sumEfficiency, sumLatency, sumRestfulness, sumTiming, sumTotal float64
	var countScore, countDeep, countRem, countEfficiency, countLatency, countRestfulness, countTiming, countTotal int

	for _, p := range allPoints {
		if p.Score != nil {
			sumScore += float64(*p.Score)
			countScore++
		}
		if p.DeepSleep != nil {
			sumDeep += float64(*p.DeepSleep)
			countDeep++
		}
		if p.RemSleep != nil {
			sumRem += float64(*p.RemSleep)
			countRem++
		}
		if p.Efficiency != nil {
			sumEfficiency += float64(*p.Efficiency)
			countEfficiency++
		}
		if p.Latency != nil {
			sumLatency += float64(*p.Latency)
			countLatency++
		}
		if p.Restfulness != nil {
			sumRestfulness += float64(*p.Restfulness)
			countRestfulness++
		}
		if p.Timing != nil {
			sumTiming += float64(*p.Timing)
			countTiming++
		}
		if p.TotalSleep != nil {
			sumTotal += float64(*p.TotalSleep)
			countTotal++
		}
	}

	if countScore > 0 {
		analysis.Averages["score"] = sumScore / float64(countScore)
	}
	if countDeep > 0 {
		analysis.Averages["deep_sleep"] = sumDeep / float64(countDeep)
	}
	if countRem > 0 {
		analysis.Averages["rem_sleep"] = sumRem / float64(countRem)
	}
	if countEfficiency > 0 {
		analysis.Averages["efficiency"] = sumEfficiency / float64(countEfficiency)
	}
	if countLatency > 0 {
		analysis.Averages["latency"] = sumLatency / float64(countLatency)
	}
	if countRestfulness > 0 {
		analysis.Averages["restfulness"] = sumRestfulness / float64(countRestfulness)
	}
	if countTiming > 0 {
		analysis.Averages["timing"] = sumTiming / float64(countTiming)
	}
	if countTotal > 0 {
		analysis.Averages["total_sleep"] = sumTotal / float64(countTotal)
	}

	// Calculate sleep debt
	analysis.Debt = calculateSleepDebt(allPoints)

	// Build timing data with day of week
	weekdayTimingSum := make(map[int]float64)
	weekdayTimingCount := make(map[int]int)
	dayNames := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}

	for _, p := range allPoints {
		if t, err := time.Parse("2006-01-02", p.Day); err == nil {
			dow := int(t.Weekday())
			tp := SleepTimingPoint{
				Day:         p.Day,
				TimingScore: p.Timing,
				DayOfWeek:   dow,
			}
			analysis.Timing = append(analysis.Timing, tp)

			if p.Timing != nil {
				weekdayTimingSum[dow] += float64(*p.Timing)
				weekdayTimingCount[dow]++
			}
		}
	}

	// Calculate weekday timing averages
	for dow := 0; dow < 7; dow++ {
		if weekdayTimingCount[dow] > 0 {
			analysis.WeekdayTimingAvg[dayNames[dow]] = weekdayTimingSum[dow] / float64(weekdayTimingCount[dow])
		}
	}

	core.WriteJSON(w, http.StatusOK, analysis)
}

// --- Weight handlers ---

// ListWeightEntries returns all weight entries, ordered by date desc
func (h *Handler) ListWeightEntries(w http.ResponseWriter, r *http.Request) {
	limit := 365
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 1000 {
			limit = n
		}
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT id, date, weight_kg, notes, created_at
		FROM weight_entries
		ORDER BY date DESC
		LIMIT $1
	`, limit)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var results []WeightEntry
	for rows.Next() {
		var we WeightEntry
		var dateTime time.Time
		if err := rows.Scan(&we.ID, &dateTime, &we.WeightKg, &we.Notes, &we.CreatedAt); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		we.Date = formatDate(dateTime)
		results = append(results, we)
	}

	core.WriteJSON(w, http.StatusOK, results)
}

// CreateWeightEntry adds or updates a weight entry for a date
func (h *Handler) CreateWeightEntry(w http.ResponseWriter, r *http.Request) {
	var input WeightInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Default to today if no date provided
	if input.Date == "" {
		input.Date = formatDate(time.Now())
	}

	// Validate weight
	if input.WeightKg <= 0 || input.WeightKg > 500 {
		core.WriteError(w, http.StatusBadRequest, "weight_kg must be between 0 and 500")
		return
	}

	var id int64
	err := h.db.QueryRow(r.Context(), `
		INSERT INTO weight_entries (date, weight_kg, notes)
		VALUES ($1, $2, $3)
		ON CONFLICT (date) DO UPDATE SET
			weight_kg = EXCLUDED.weight_kg,
			notes = EXCLUDED.notes
		RETURNING id
	`, input.Date, input.WeightKg, input.Notes).Scan(&id)

	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	core.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"id":        id,
		"date":      input.Date,
		"weight_kg": input.WeightKg,
	})
}

// GetWeightEntry returns a single weight entry by date
func (h *Handler) GetWeightEntry(w http.ResponseWriter, r *http.Request) {
	date := chi.URLParam(r, "date")

	var we WeightEntry
	var dateTime time.Time
	err := h.db.QueryRow(r.Context(), `
		SELECT id, date, weight_kg, notes, created_at
		FROM weight_entries
		WHERE date = $1
	`, date).Scan(&we.ID, &dateTime, &we.WeightKg, &we.Notes, &we.CreatedAt)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "Weight entry not found")
		return
	}
	we.Date = formatDate(dateTime)

	core.WriteJSON(w, http.StatusOK, we)
}

// DeleteWeightEntry removes a weight entry by date
func (h *Handler) DeleteWeightEntry(w http.ResponseWriter, r *http.Request) {
	date := chi.URLParam(r, "date")

	result, err := h.db.Exec(r.Context(), `DELETE FROM weight_entries WHERE date = $1`, date)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if result.RowsAffected() == 0 {
		core.WriteError(w, http.StatusNotFound, "Weight entry not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetWeightTrend returns weight history with statistics
func (h *Handler) GetWeightTrend(w http.ResponseWriter, r *http.Request) {
	days := 90 // default
	if d := r.URL.Query().Get("days"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 && n <= 365 {
			days = n
		}
	}

	trend := WeightTrend{
		History: []WeightEntry{},
		Trend:   "stable",
	}

	// Fetch weight entries
	rows, err := h.db.Query(r.Context(), `
		SELECT id, date, weight_kg, notes, created_at
		FROM weight_entries
		ORDER BY date DESC
		LIMIT $1
	`, days)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var entries []WeightEntry
	for rows.Next() {
		var we WeightEntry
		var dateTime time.Time
		if err := rows.Scan(&we.ID, &dateTime, &we.WeightKg, &we.Notes, &we.CreatedAt); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		we.Date = formatDate(dateTime)
		entries = append(entries, we)
	}

	if len(entries) == 0 {
		core.WriteJSON(w, http.StatusOK, trend)
		return
	}

	// Latest entry
	trend.Latest = &entries[0]

	// Reverse for chronological order
	for i, j := 0, len(entries)-1; i < j; i, j = i+1, j-1 {
		entries[i], entries[j] = entries[j], entries[i]
	}
	trend.History = entries

	// Calculate statistics
	var sum7d, sum30d float64
	var count7d, count30d int
	var minWeight, maxWeight float64 = entries[0].WeightKg, entries[0].WeightKg

	for i, e := range entries {
		if e.WeightKg < minWeight {
			minWeight = e.WeightKg
		}
		if e.WeightKg > maxWeight {
			maxWeight = e.WeightKg
		}

		// Last 30 entries for 30d avg
		if i >= len(entries)-30 {
			sum30d += e.WeightKg
			count30d++
		}
		// Last 7 entries for 7d avg
		if i >= len(entries)-7 {
			sum7d += e.WeightKg
			count7d++
		}
	}

	trend.MinWeight = &minWeight
	trend.MaxWeight = &maxWeight

	if count7d > 0 {
		avg7d := sum7d / float64(count7d)
		trend.Avg7d = &avg7d

		// Calculate trend vs 7d average
		delta := trend.Latest.WeightKg - avg7d
		trend.TrendDelta = delta
		if delta > 0.5 {
			trend.Trend = "up"
		} else if delta < -0.5 {
			trend.Trend = "down"
		}
	}

	if count30d > 0 {
		avg30d := sum30d / float64(count30d)
		trend.Avg30d = &avg30d
	}

	core.WriteJSON(w, http.StatusOK, trend)
}

// --- Body Metrics handler ---

// GetBodyMetrics returns HRV, RHR, and temperature trends from Oura data
func (h *Handler) GetBodyMetrics(w http.ResponseWriter, r *http.Request) {
	days := 30 // default
	if d := r.URL.Query().Get("days"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 && n <= 365 {
			days = n
		}
	}

	metrics := BodyMetrics{
		History:   []BodyMetricPoint{},
		HrvTrend:  "stable",
		RhrTrend:  "stable",
		TempTrend: "stable",
	}

	// Fetch body metrics from oura_daily
	rows, err := h.db.Query(r.Context(), `
		SELECT day, readiness_hrv_balance, readiness_resting_heart_rate, temperature_deviation
		FROM oura_daily
		ORDER BY day DESC
		LIMIT $1
	`, days)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var points []BodyMetricPoint
	for rows.Next() {
		var p BodyMetricPoint
		var dayTime time.Time
		if err := rows.Scan(&dayTime, &p.HrvBalance, &p.RestingHeartRate, &p.TemperatureDeviation); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		p.Day = formatDate(dayTime)
		points = append(points, p)
	}

	if len(points) == 0 {
		core.WriteJSON(w, http.StatusOK, metrics)
		return
	}

	// Latest values
	latest := points[0]
	metrics.LatestDay = latest.Day
	metrics.HrvBalance = latest.HrvBalance
	metrics.RestingHeartRate = latest.RestingHeartRate
	metrics.TemperatureDeviation = latest.TemperatureDeviation

	// Reverse for chronological order
	for i, j := 0, len(points)-1; i < j; i, j = i+1, j-1 {
		points[i], points[j] = points[j], points[i]
	}
	metrics.History = points

	// Calculate averages and trends
	var sumHrv7d, sumHrv30d, sumRhr7d, sumRhr30d, sumTemp7d, sumTemp30d float64
	var countHrv7d, countHrv30d, countRhr7d, countRhr30d, countTemp7d, countTemp30d int

	for i, p := range points {
		// 30d window
		if p.HrvBalance != nil {
			sumHrv30d += float64(*p.HrvBalance)
			countHrv30d++
		}
		if p.RestingHeartRate != nil {
			sumRhr30d += float64(*p.RestingHeartRate)
			countRhr30d++
		}
		if p.TemperatureDeviation != nil {
			sumTemp30d += *p.TemperatureDeviation
			countTemp30d++
		}

		// 7d window (last 7 entries)
		if i >= len(points)-7 {
			if p.HrvBalance != nil {
				sumHrv7d += float64(*p.HrvBalance)
				countHrv7d++
			}
			if p.RestingHeartRate != nil {
				sumRhr7d += float64(*p.RestingHeartRate)
				countRhr7d++
			}
			if p.TemperatureDeviation != nil {
				sumTemp7d += *p.TemperatureDeviation
				countTemp7d++
			}
		}
	}

	// Set averages
	if countHrv7d > 0 {
		metrics.AvgHrv7d = sumHrv7d / float64(countHrv7d)
	}
	if countHrv30d > 0 {
		metrics.AvgHrv30d = sumHrv30d / float64(countHrv30d)
	}
	if countRhr7d > 0 {
		metrics.AvgRhr7d = sumRhr7d / float64(countRhr7d)
	}
	if countRhr30d > 0 {
		metrics.AvgRhr30d = sumRhr30d / float64(countRhr30d)
	}
	if countTemp7d > 0 {
		metrics.AvgTemp7d = sumTemp7d / float64(countTemp7d)
	}
	if countTemp30d > 0 {
		metrics.AvgTemp30d = sumTemp30d / float64(countTemp30d)
	}

	// Calculate trends vs 7d average
	if metrics.HrvBalance != nil && countHrv7d > 0 {
		delta := float64(*metrics.HrvBalance) - metrics.AvgHrv7d
		metrics.HrvTrendDelta = int(delta)
		if delta > 3 {
			metrics.HrvTrend = "up"
		} else if delta < -3 {
			metrics.HrvTrend = "down"
		}
	}

	if metrics.RestingHeartRate != nil && countRhr7d > 0 {
		delta := float64(*metrics.RestingHeartRate) - metrics.AvgRhr7d
		metrics.RhrTrendDelta = int(delta)
		// For RHR, lower is better, so trend interpretation is inverted
		if delta > 3 {
			metrics.RhrTrend = "up"
		} else if delta < -3 {
			metrics.RhrTrend = "down"
		}
	}

	if metrics.TemperatureDeviation != nil && countTemp7d > 0 {
		delta := *metrics.TemperatureDeviation - metrics.AvgTemp7d
		metrics.TempTrendDelta = delta
		if delta > 0.3 {
			metrics.TempTrend = "up"
		} else if delta < -0.3 {
			metrics.TempTrend = "down"
		}
	}

	core.WriteJSON(w, http.StatusOK, metrics)
}

// --- Phase 5: Insights handler ---

// GetInsights returns correlations, patterns, records, and streaks
func (h *Handler) GetInsights(w http.ResponseWriter, r *http.Request) {
	days := 90 // default
	if d := r.URL.Query().Get("days"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 && n <= 365 {
			days = n
		}
	}

	insights := HealthInsights{
		Correlations:    []Correlation{},
		WeekdayPatterns: []WeekdayPattern{},
		WeekdayInsights: []WeekdayInsight{},
		Records:         []PersonalRecord{},
		Streaks:         []Streak{},
	}

	// Fetch all data needed for insights
	rows, err := h.db.Query(r.Context(), `
		SELECT day, sleep_score, readiness_score, activity_score, activity_steps
		FROM oura_daily
		WHERE sleep_score IS NOT NULL OR readiness_score IS NOT NULL
		ORDER BY day ASC
		LIMIT $1
	`, days)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var data []dailyData
	for rows.Next() {
		var d dailyData
		var dayTime time.Time
		if err := rows.Scan(&dayTime, &d.sleep, &d.readiness, &d.activity, &d.steps); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		d.day = formatDate(dayTime)
		d.dayTime = dayTime
		data = append(data, d)
	}

	if len(data) == 0 {
		core.WriteJSON(w, http.StatusOK, insights)
		return
	}

	insights.TotalDays = len(data)

	// --- Calculate correlations ---
	insights.Correlations = calculateCorrelations(data)

	// --- Calculate weekday patterns ---
	insights.WeekdayPatterns, insights.WeekdayInsights = calculateWeekdayPatterns(data)

	// --- Calculate overall averages ---
	var sumSleep, sumReadiness, sumActivity float64
	var countSleep, countReadiness, countActivity int
	for _, d := range data {
		if d.sleep != nil {
			sumSleep += float64(*d.sleep)
			countSleep++
		}
		if d.readiness != nil {
			sumReadiness += float64(*d.readiness)
			countReadiness++
		}
		if d.activity != nil {
			sumActivity += float64(*d.activity)
			countActivity++
		}
	}
	if countSleep > 0 {
		insights.AvgSleep = sumSleep / float64(countSleep)
	}
	if countReadiness > 0 {
		insights.AvgReadiness = sumReadiness / float64(countReadiness)
	}
	if countActivity > 0 {
		insights.AvgActivity = sumActivity / float64(countActivity)
	}

	// --- Calculate records and streaks ---
	insights.Records, insights.Streaks = calculateRecordsAndStreaks(data)

	// Fetch workout data for workout-readiness correlation
	workoutRows, err := h.db.Query(r.Context(), `
		SELECT date FROM workouts ORDER BY date ASC
	`)
	if err == nil {
		defer workoutRows.Close()
		workoutDates := make(map[string]bool)
		for workoutRows.Next() {
			var dateTime time.Time
			if err := workoutRows.Scan(&dateTime); err == nil {
				workoutDates[formatDate(dateTime)] = true
			}
		}

		// Calculate workout impact on next-day readiness
		if len(workoutDates) > 0 {
			workoutCorr := calculateWorkoutCorrelation(data, workoutDates)
			if workoutCorr != nil {
				insights.Correlations = append(insights.Correlations, *workoutCorr)
			}
		}
	}

	core.WriteJSON(w, http.StatusOK, insights)
}

// calculateCorrelations computes Pearson correlations between metrics
func calculateCorrelations(data []dailyData) []Correlation {
	correlations := []Correlation{}

	// 1. Sleep → Next-day Readiness
	var sleepVals, nextReadinessVals []float64
	for i := 0; i < len(data)-1; i++ {
		if data[i].sleep != nil && data[i+1].readiness != nil {
			sleepVals = append(sleepVals, float64(*data[i].sleep))
			nextReadinessVals = append(nextReadinessVals, float64(*data[i+1].readiness))
		}
	}
	if len(sleepVals) >= 7 {
		r := pearsonCorrelation(sleepVals, nextReadinessVals)
		correlations = append(correlations, Correlation{
			Metric1:     "Sleep Score",
			Metric2:     "Next-Day Readiness",
			Coefficient: r,
			Strength:    correlationStrength(r),
			Direction:   correlationDirection(r),
			Insight:     sleepReadinessInsight(r),
		})
	}

	// 2. Activity → Same-night Sleep
	var activityVals, sameSleepVals []float64
	for i := 0; i < len(data)-1; i++ {
		if data[i].activity != nil && data[i+1].sleep != nil {
			activityVals = append(activityVals, float64(*data[i].activity))
			sameSleepVals = append(sameSleepVals, float64(*data[i+1].sleep))
		}
	}
	if len(activityVals) >= 7 {
		r := pearsonCorrelation(activityVals, sameSleepVals)
		correlations = append(correlations, Correlation{
			Metric1:     "Activity Score",
			Metric2:     "That Night's Sleep",
			Coefficient: r,
			Strength:    correlationStrength(r),
			Direction:   correlationDirection(r),
			Insight:     activitySleepInsight(r),
		})
	}

	// 3. Steps → Activity Score (same day)
	var stepsVals, actScoreVals []float64
	for _, d := range data {
		if d.steps != nil && d.activity != nil {
			stepsVals = append(stepsVals, float64(*d.steps))
			actScoreVals = append(actScoreVals, float64(*d.activity))
		}
	}
	if len(stepsVals) >= 7 {
		r := pearsonCorrelation(stepsVals, actScoreVals)
		correlations = append(correlations, Correlation{
			Metric1:     "Steps",
			Metric2:     "Activity Score",
			Coefficient: r,
			Strength:    correlationStrength(r),
			Direction:   correlationDirection(r),
			Insight:     stepsActivityInsight(r),
		})
	}

	return correlations
}

// pearsonCorrelation calculates Pearson's r between two slices
func pearsonCorrelation(x, y []float64) float64 {
	if len(x) != len(y) || len(x) < 2 {
		return 0
	}

	n := float64(len(x))
	var sumX, sumY, sumXY, sumX2, sumY2 float64

	for i := 0; i < len(x); i++ {
		sumX += x[i]
		sumY += y[i]
		sumXY += x[i] * y[i]
		sumX2 += x[i] * x[i]
		sumY2 += y[i] * y[i]
	}

	numerator := n*sumXY - sumX*sumY
	denominator := (n*sumX2 - sumX*sumX) * (n*sumY2 - sumY*sumY)

	if denominator <= 0 {
		return 0
	}

	// Import math for Sqrt
	return numerator / sqrt(denominator)
}

// sqrt is a simple square root implementation
func sqrt(x float64) float64 {
	if x <= 0 {
		return 0
	}
	z := x / 2
	for i := 0; i < 20; i++ {
		z = (z + x/z) / 2
	}
	return z
}

func correlationStrength(r float64) string {
	absR := r
	if absR < 0 {
		absR = -absR
	}
	if absR >= 0.7 {
		return "strong"
	}
	if absR >= 0.4 {
		return "moderate"
	}
	if absR >= 0.2 {
		return "weak"
	}
	return "none"
}

func correlationDirection(r float64) string {
	if r >= 0.1 {
		return "positive"
	}
	if r <= -0.1 {
		return "negative"
	}
	return "neutral"
}

func sleepReadinessInsight(r float64) string {
	if r >= 0.5 {
		return "Good sleep strongly predicts better readiness the next day"
	}
	if r >= 0.3 {
		return "Sleep quality moderately affects next-day readiness"
	}
	if r >= 0.1 {
		return "Sleep has a small impact on next-day readiness"
	}
	return "No clear relationship between sleep and next-day readiness"
}

func activitySleepInsight(r float64) string {
	if r >= 0.3 {
		return "More activity leads to better sleep that night"
	}
	if r <= -0.3 {
		return "High activity may be disrupting your sleep"
	}
	if r >= 0.1 {
		return "Activity has a slight positive effect on sleep"
	}
	if r <= -0.1 {
		return "High activity slightly reduces sleep quality"
	}
	return "Activity level doesn't strongly affect sleep"
}

func stepsActivityInsight(r float64) string {
	if r >= 0.6 {
		return "Step count is a major driver of your activity score"
	}
	if r >= 0.4 {
		return "Steps contribute significantly to activity score"
	}
	return "Activity score depends on more than just steps"
}

// calculateWeekdayPatterns analyzes patterns by day of week
func calculateWeekdayPatterns(data []dailyData) ([]WeekdayPattern, []WeekdayInsight) {
	dayNames := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}

	// Aggregate by day of week
	type dayStats struct {
		sumSleep, sumReadiness, sumActivity, sumSteps float64
		countSleep, countReadiness, countActivity, countSteps int
	}
	stats := make([]dayStats, 7)

	for _, d := range data {
		dow := int(d.dayTime.Weekday())
		if d.sleep != nil {
			stats[dow].sumSleep += float64(*d.sleep)
			stats[dow].countSleep++
		}
		if d.readiness != nil {
			stats[dow].sumReadiness += float64(*d.readiness)
			stats[dow].countReadiness++
		}
		if d.activity != nil {
			stats[dow].sumActivity += float64(*d.activity)
			stats[dow].countActivity++
		}
		if d.steps != nil {
			stats[dow].sumSteps += float64(*d.steps)
			stats[dow].countSteps++
		}
	}

	// Build patterns
	patterns := make([]WeekdayPattern, 7)
	for i := 0; i < 7; i++ {
		patterns[i] = WeekdayPattern{
			DayName:   dayNames[i],
			DayNumber: i,
		}
		if stats[i].countSleep > 0 {
			patterns[i].AvgSleep = stats[i].sumSleep / float64(stats[i].countSleep)
			patterns[i].SampleSize = stats[i].countSleep
		}
		if stats[i].countReadiness > 0 {
			patterns[i].AvgReadiness = stats[i].sumReadiness / float64(stats[i].countReadiness)
		}
		if stats[i].countActivity > 0 {
			patterns[i].AvgActivity = stats[i].sumActivity / float64(stats[i].countActivity)
		}
		if stats[i].countSteps > 0 {
			patterns[i].AvgSteps = stats[i].sumSteps / float64(stats[i].countSteps)
		}
	}

	// Find insights (best and worst days)
	insights := []WeekdayInsight{}

	// Calculate overall averages
	var totalSleep, totalReadiness float64
	var countSleep, countReadiness int
	for _, s := range stats {
		totalSleep += s.sumSleep
		countSleep += s.countSleep
		totalReadiness += s.sumReadiness
		countReadiness += s.countReadiness
	}
	avgSleep := totalSleep / float64(countSleep)
	avgReadiness := totalReadiness / float64(countReadiness)

	// Find best and worst sleep day
	var bestSleepDay, worstSleepDay int
	var bestSleep, worstSleep float64 = -1, 101
	for i, p := range patterns {
		if p.SampleSize >= 2 {
			if p.AvgSleep > bestSleep {
				bestSleep = p.AvgSleep
				bestSleepDay = i
			}
			if p.AvgSleep < worstSleep {
				worstSleep = p.AvgSleep
				worstSleepDay = i
			}
		}
	}

	if bestSleep > 0 {
		insights = append(insights, WeekdayInsight{
			DayName: dayNames[bestSleepDay],
			Metric:  "sleep",
			Type:    "best",
			Value:   bestSleep,
			AvgAll:  avgSleep,
			Insight: formatf("Best sleep on %ss (avg %.0f vs %.0f overall)", dayNames[bestSleepDay], bestSleep, avgSleep),
		})
	}
	if worstSleep < 101 && worstSleep != bestSleep {
		insights = append(insights, WeekdayInsight{
			DayName: dayNames[worstSleepDay],
			Metric:  "sleep",
			Type:    "worst",
			Value:   worstSleep,
			AvgAll:  avgSleep,
			Insight: formatf("Sleep suffers on %ss (avg %.0f vs %.0f overall)", dayNames[worstSleepDay], worstSleep, avgSleep),
		})
	}

	// Find best and worst readiness day
	var bestReadinessDay, worstReadinessDay int
	var bestReadiness, worstReadiness float64 = -1, 101
	for i, p := range patterns {
		if p.SampleSize >= 2 {
			if p.AvgReadiness > bestReadiness {
				bestReadiness = p.AvgReadiness
				bestReadinessDay = i
			}
			if p.AvgReadiness < worstReadiness {
				worstReadiness = p.AvgReadiness
				worstReadinessDay = i
			}
		}
	}

	if bestReadiness > 0 {
		insights = append(insights, WeekdayInsight{
			DayName: dayNames[bestReadinessDay],
			Metric:  "readiness",
			Type:    "best",
			Value:   bestReadiness,
			AvgAll:  avgReadiness,
			Insight: formatf("Peak readiness on %ss (avg %.0f)", dayNames[bestReadinessDay], bestReadiness),
		})
	}
	if worstReadiness < 101 && worstReadiness != bestReadiness {
		insights = append(insights, WeekdayInsight{
			DayName: dayNames[worstReadinessDay],
			Metric:  "readiness",
			Type:    "worst",
			Value:   worstReadiness,
			AvgAll:  avgReadiness,
			Insight: formatf("Lowest readiness on %ss (avg %.0f)", dayNames[worstReadinessDay], worstReadiness),
		})
	}

	return patterns, insights
}

// formatf is a simple format helper
func formatf(format string, args ...interface{}) string {
	result := format
	for _, arg := range args {
		switch v := arg.(type) {
		case string:
			// Replace first %s with string
			for i := 0; i < len(result)-1; i++ {
				if result[i] == '%' && result[i+1] == 's' {
					result = result[:i] + v + result[i+2:]
					break
				}
			}
		case float64:
			// Replace first %.0f with formatted number
			for i := 0; i < len(result)-3; i++ {
				if result[i] == '%' && result[i+1] == '.' && result[i+2] == '0' && result[i+3] == 'f' {
					result = result[:i] + strconv.FormatFloat(v, 'f', 0, 64) + result[i+4:]
					break
				}
			}
		}
	}
	return result
}

// calculateRecordsAndStreaks finds personal bests and current streaks
func calculateRecordsAndStreaks(data []dailyData) ([]PersonalRecord, []Streak) {
	records := []PersonalRecord{}
	streaks := []Streak{}

	if len(data) == 0 {
		return records, streaks
	}

	// Find highest scores
	var highestSleep, highestReadiness, highestActivity int
	var highestSleepDay, highestReadinessDay, highestActivityDay string

	for _, d := range data {
		if d.sleep != nil && *d.sleep > highestSleep {
			highestSleep = *d.sleep
			highestSleepDay = d.day
		}
		if d.readiness != nil && *d.readiness > highestReadiness {
			highestReadiness = *d.readiness
			highestReadinessDay = d.day
		}
		if d.activity != nil && *d.activity > highestActivity {
			highestActivity = *d.activity
			highestActivityDay = d.day
		}
	}

	if highestSleep > 0 {
		records = append(records, PersonalRecord{
			Type:        "highest_sleep",
			Value:       highestSleep,
			Date:        highestSleepDay,
			Description: formatf("Best sleep score: %.0f", float64(highestSleep)),
		})
	}
	if highestReadiness > 0 {
		records = append(records, PersonalRecord{
			Type:        "highest_readiness",
			Value:       highestReadiness,
			Date:        highestReadinessDay,
			Description: formatf("Best readiness score: %.0f", float64(highestReadiness)),
		})
	}
	if highestActivity > 0 {
		records = append(records, PersonalRecord{
			Type:        "highest_activity",
			Value:       highestActivity,
			Date:        highestActivityDay,
			Description: formatf("Best activity score: %.0f", float64(highestActivity)),
		})
	}

	// Calculate streaks
	// Sleep 80+ streak
	sleepStreak := calculateStreak(data, func(d dailyData) bool {
		return d.sleep != nil && *d.sleep >= 80
	})
	sleepStreak.Type = "sleep_80"
	streaks = append(streaks, sleepStreak)

	// Readiness 80+ streak
	readinessStreak := calculateStreak(data, func(d dailyData) bool {
		return d.readiness != nil && *d.readiness >= 80
	})
	readinessStreak.Type = "readiness_80"
	streaks = append(streaks, readinessStreak)

	// 10k steps streak
	stepsStreak := calculateStreak(data, func(d dailyData) bool {
		return d.steps != nil && *d.steps >= 10000
	})
	stepsStreak.Type = "steps_10k"
	streaks = append(streaks, stepsStreak)

	// Add longest streaks as records
	if sleepStreak.BestStreak > 1 {
		records = append(records, PersonalRecord{
			Type:        "longest_sleep_streak",
			Value:       sleepStreak.BestStreak,
			Description: formatf("Longest sleep 80+ streak: %.0f days", float64(sleepStreak.BestStreak)),
		})
	}

	return records, streaks
}

// calculateStreak finds current and best streak for a condition
func calculateStreak(data []dailyData, condition func(dailyData) bool) Streak {
	streak := Streak{}

	var currentStreak, bestStreak int
	var lastAchieved string

	for i := len(data) - 1; i >= 0; i-- {
		if condition(data[i]) {
			currentStreak++
			if lastAchieved == "" {
				lastAchieved = data[i].day
			}
		} else {
			if currentStreak > bestStreak {
				bestStreak = currentStreak
			}
			currentStreak = 0
		}
	}

	// Check if final streak is the best
	if currentStreak > bestStreak {
		bestStreak = currentStreak
	}

	// Recalculate current streak from the end of data
	currentStreak = 0
	for i := len(data) - 1; i >= 0; i-- {
		if condition(data[i]) {
			currentStreak++
		} else {
			break
		}
	}

	streak.CurrentStreak = currentStreak
	streak.BestStreak = bestStreak
	streak.LastAchieved = lastAchieved
	streak.IsActive = currentStreak > 0

	return streak
}

// calculateWorkoutCorrelation calculates workout impact on next-day readiness
func calculateWorkoutCorrelation(data []dailyData, workoutDates map[string]bool) *Correlation {
	var readinessAfterWorkout, readinessNoWorkout []float64

	for i := 0; i < len(data)-1; i++ {
		if data[i+1].readiness == nil {
			continue
		}
		nextReadiness := float64(*data[i+1].readiness)

		if workoutDates[data[i].day] {
			readinessAfterWorkout = append(readinessAfterWorkout, nextReadiness)
		} else {
			readinessNoWorkout = append(readinessNoWorkout, nextReadiness)
		}
	}

	if len(readinessAfterWorkout) < 3 || len(readinessNoWorkout) < 3 {
		return nil
	}

	// Calculate average difference
	var sumWorkout, sumNoWorkout float64
	for _, v := range readinessAfterWorkout {
		sumWorkout += v
	}
	for _, v := range readinessNoWorkout {
		sumNoWorkout += v
	}
	avgWorkout := sumWorkout / float64(len(readinessAfterWorkout))
	avgNoWorkout := sumNoWorkout / float64(len(readinessNoWorkout))

	diff := avgWorkout - avgNoWorkout
	direction := "neutral"
	if diff > 2 {
		direction = "positive"
	} else if diff < -2 {
		direction = "negative"
	}

	insight := formatf("Readiness after workout: %.0f (vs %.0f without)", avgWorkout, avgNoWorkout)
	if diff > 3 {
		insight = "Workouts boost your next-day readiness"
	} else if diff < -3 {
		insight = "Workouts may be too intense — consider recovery"
	}

	return &Correlation{
		Metric1:     "Workout",
		Metric2:     "Next-Day Readiness",
		Coefficient: diff / 10, // Normalize to correlation-like scale
		Strength:    correlationStrength(diff / 10),
		Direction:   direction,
		Insight:     insight,
	}
}

// --- Phase 6: Goals handlers ---

// ListGoals returns all health goals
func (h *Handler) ListGoals(w http.ResponseWriter, r *http.Request) {
	includeInactive := r.URL.Query().Get("all") == "true"

	query := `SELECT id, goal_type, target, active, created_at, updated_at FROM health_goals`
	if !includeInactive {
		query += ` WHERE active = true`
	}
	query += ` ORDER BY goal_type`

	rows, err := h.db.Query(r.Context(), query)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var goals []HealthGoal
	for rows.Next() {
		var g HealthGoal
		if err := rows.Scan(&g.ID, &g.GoalType, &g.Target, &g.Active, &g.CreatedAt, &g.UpdatedAt); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		goals = append(goals, g)
	}

	core.WriteJSON(w, http.StatusOK, goals)
}

// UpsertGoal creates or updates a health goal
func (h *Handler) UpsertGoal(w http.ResponseWriter, r *http.Request) {
	var input HealthGoalInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Validate goal type
	validTypes := map[string]bool{
		"step_goal":         true,
		"sleep_score":       true,
		"readiness_score":   true,
		"workout_frequency": true,
	}
	if !validTypes[input.GoalType] {
		core.WriteError(w, http.StatusBadRequest, "Invalid goal_type. Must be: step_goal, sleep_score, readiness_score, or workout_frequency")
		return
	}

	if input.Target <= 0 {
		core.WriteError(w, http.StatusBadRequest, "target must be positive")
		return
	}

	active := true
	if input.Active != nil {
		active = *input.Active
	}

	var id int64
	err := h.db.QueryRow(r.Context(), `
		INSERT INTO health_goals (goal_type, target, active, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (goal_type) DO UPDATE SET
			target = EXCLUDED.target,
			active = EXCLUDED.active,
			updated_at = NOW()
		RETURNING id
	`, input.GoalType, input.Target, active).Scan(&id)

	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	core.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"id":        id,
		"goal_type": input.GoalType,
		"target":    input.Target,
		"active":    active,
	})
}

// DeleteGoal removes a health goal (or just deactivates it)
func (h *Handler) DeleteGoal(w http.ResponseWriter, r *http.Request) {
	goalType := chi.URLParam(r, "type")

	// Soft delete by deactivating
	result, err := h.db.Exec(r.Context(), `
		UPDATE health_goals SET active = false, updated_at = NOW()
		WHERE goal_type = $1
	`, goalType)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if result.RowsAffected() == 0 {
		core.WriteError(w, http.StatusNotFound, "Goal not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetGoalsOverview returns goal progress for the dashboard
func (h *Handler) GetGoalsOverview(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	today := formatDate(time.Now())

	// Get week boundaries (Monday to Sunday)
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday = 7
	}
	weekStart := now.AddDate(0, 0, -(weekday - 1))
	weekStartStr := formatDate(weekStart)

	overview := GoalsOverview{
		Goals: []GoalProgress{},
	}

	// Fetch active goals
	goalRows, err := h.db.Query(ctx, `
		SELECT id, goal_type, target, active, created_at, updated_at
		FROM health_goals
		WHERE active = true
		ORDER BY goal_type
	`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer goalRows.Close()

	var goals []HealthGoal
	for goalRows.Next() {
		var g HealthGoal
		if err := goalRows.Scan(&g.ID, &g.GoalType, &g.Target, &g.Active, &g.CreatedAt, &g.UpdatedAt); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		goals = append(goals, g)
	}

	if len(goals) == 0 {
		core.WriteJSON(w, http.StatusOK, overview)
		return
	}

	// Fetch today's Oura data
	var todayData OuraDaily
	h.db.QueryRow(ctx, `
		SELECT COALESCE(sleep_score, 0), COALESCE(readiness_score, 0), COALESCE(activity_steps, 0)
		FROM oura_daily
		WHERE day = $1
	`, today).Scan(&todayData.SleepScore, &todayData.ReadinessScore, &todayData.ActivitySteps)

	// Fetch this week's workout count
	var weeklyWorkouts int
	h.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM workouts WHERE date >= $1
	`, weekStartStr).Scan(&weeklyWorkouts)

	// Fetch historical data for streak calculation (last 90 days)
	histRows, err := h.db.Query(ctx, `
		SELECT day, COALESCE(sleep_score, 0), COALESCE(readiness_score, 0), COALESCE(activity_steps, 0)
		FROM oura_daily
		ORDER BY day ASC
		LIMIT 90
	`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer histRows.Close()

	var histData []goalDailyData
	for histRows.Next() {
		var d goalDailyData
		var dayTime time.Time
		if err := histRows.Scan(&dayTime, &d.sleep, &d.readiness, &d.steps); err != nil {
			continue
		}
		d.day = formatDate(dayTime)
		histData = append(histData, d)
	}

	// Fetch weekly workout counts per day
	workoutRows, err := h.db.Query(ctx, `SELECT date FROM workouts ORDER BY date ASC`)
	workoutDates := make(map[string]bool)
	if err == nil {
		defer workoutRows.Close()
		for workoutRows.Next() {
			var dateTime time.Time
			if err := workoutRows.Scan(&dateTime); err == nil {
				workoutDates[formatDate(dateTime)] = true
			}
		}
	}

	// Calculate progress for each goal
	for _, goal := range goals {
		progress := GoalProgress{
			Goal: goal,
		}

		switch goal.GoalType {
		case "step_goal":
			if todayData.ActivitySteps != nil {
				progress.CurrentValue = *todayData.ActivitySteps
			}
			progress.Progress = float64(progress.CurrentValue) / float64(goal.Target) * 100
			if progress.Progress > 100 {
				progress.Progress = 100
			}
			progress.Met = progress.CurrentValue >= goal.Target
			progress.CurrentStreak, progress.BestStreak, progress.LastAchieved = calculateGoalStreak(histData, func(d goalDailyData) bool {
				return d.steps >= goal.Target
			})

		case "sleep_score":
			if todayData.SleepScore != nil {
				progress.CurrentValue = *todayData.SleepScore
			}
			progress.Progress = float64(progress.CurrentValue) / float64(goal.Target) * 100
			if progress.Progress > 100 {
				progress.Progress = 100
			}
			progress.Met = progress.CurrentValue >= goal.Target
			progress.CurrentStreak, progress.BestStreak, progress.LastAchieved = calculateGoalStreak(histData, func(d goalDailyData) bool {
				return d.sleep >= goal.Target
			})

		case "readiness_score":
			if todayData.ReadinessScore != nil {
				progress.CurrentValue = *todayData.ReadinessScore
			}
			progress.Progress = float64(progress.CurrentValue) / float64(goal.Target) * 100
			if progress.Progress > 100 {
				progress.Progress = 100
			}
			progress.Met = progress.CurrentValue >= goal.Target
			progress.CurrentStreak, progress.BestStreak, progress.LastAchieved = calculateGoalStreak(histData, func(d goalDailyData) bool {
				return d.readiness >= goal.Target
			})

		case "workout_frequency":
			progress.WeeklyCount = weeklyWorkouts
			progress.CurrentValue = weeklyWorkouts
			progress.Progress = float64(weeklyWorkouts) / float64(goal.Target) * 100
			if progress.Progress > 100 {
				progress.Progress = 100
			}
			progress.Met = weeklyWorkouts >= goal.Target
			// For workout frequency, streak is weeks meeting the goal
			// Simplified: just show if current week is met
			if progress.Met {
				progress.CurrentStreak = 1
			}
		}

		overview.Goals = append(overview.Goals, progress)

		if progress.Met {
			overview.TodaysMet++
		}
		overview.TodaysTotal++
	}

	// Calculate weekly totals
	// This is simplified - count days where at least one goal was met this week
	for i := 0; i < 7 && i < len(histData); i++ {
		idx := len(histData) - 1 - i
		if idx < 0 {
			break
		}
		d := histData[idx]
		// Check if this day is in the current week
		if dayTime, err := time.Parse("2006-01-02", d.day); err == nil {
			if !dayTime.Before(weekStart) {
				met := false
				for _, goal := range goals {
					switch goal.GoalType {
					case "step_goal":
						if d.steps >= goal.Target {
							met = true
						}
					case "sleep_score":
						if d.sleep >= goal.Target {
							met = true
						}
					case "readiness_score":
						if d.readiness >= goal.Target {
							met = true
						}
					}
				}
				if met {
					overview.WeeklyMet++
				}
				overview.WeeklyTotal++
			}
		}
	}

	core.WriteJSON(w, http.StatusOK, overview)
}

// goalDailyData is used for goal streak calculations
type goalDailyData struct {
	day       string
	sleep     int
	readiness int
	steps     int
}

// calculateGoalStreak calculates current and best streak for a goal condition
func calculateGoalStreak(data []goalDailyData, condition func(goalDailyData) bool) (int, int, string) {
	if len(data) == 0 {
		return 0, 0, ""
	}

	var currentStreak, bestStreak int
	var lastAchieved string

	// Calculate best streak
	tempStreak := 0
	for _, d := range data {
		if condition(d) {
			tempStreak++
			if tempStreak > bestStreak {
				bestStreak = tempStreak
			}
			lastAchieved = d.day
		} else {
			tempStreak = 0
		}
	}

	// Calculate current streak (from end)
	for i := len(data) - 1; i >= 0; i-- {
		if condition(data[i]) {
			currentStreak++
		} else {
			break
		}
	}

	return currentStreak, bestStreak, lastAchieved
}

// GetWeeklySummary returns the weekly health review
func (h *Handler) GetWeeklySummary(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Determine which week to summarize
	// Default: last complete week (Monday to Sunday)
	// If week=current, use current week (may be incomplete)
	weekParam := r.URL.Query().Get("week")

	now := time.Now()
	var weekStart, weekEnd time.Time

	if weekParam == "current" {
		// Current week
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		weekStart = time.Date(now.Year(), now.Month(), now.Day()-(weekday-1), 0, 0, 0, 0, now.Location())
		weekEnd = now
	} else {
		// Last complete week
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		// Go back to last Sunday, then back to Monday of that week
		lastSunday := now.AddDate(0, 0, -weekday)
		weekEnd = lastSunday
		weekStart = lastSunday.AddDate(0, 0, -6)
	}

	weekStartStr := formatDate(weekStart)
	weekEndStr := formatDate(weekEnd)

	summary := WeeklySummary{
		WeekStart:   weekStartStr,
		WeekEnd:     weekEndStr,
		Highlights:  []string{},
		Lowlights:   []string{},
		ActiveStreaks: []Streak{},
	}

	// Fetch this week's data
	rows, err := h.db.Query(ctx, `
		SELECT day, sleep_score, readiness_score, activity_score, activity_steps
		FROM oura_daily
		WHERE day >= $1 AND day <= $2
		ORDER BY day ASC
	`, weekStartStr, weekEndStr)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var weekData []dailyData
	for rows.Next() {
		var d dailyData
		var dayTime time.Time
		if err := rows.Scan(&dayTime, &d.sleep, &d.readiness, &d.activity, &d.steps); err != nil {
			continue
		}
		d.day = formatDate(dayTime)
		d.dayTime = dayTime
		weekData = append(weekData, d)
	}

	if len(weekData) == 0 {
		core.WriteJSON(w, http.StatusOK, summary)
		return
	}

	// Calculate averages and find best/worst
	var sumSleep, sumReadiness, sumActivity, sumSteps float64
	var countSleep, countReadiness, countActivity, countSteps int
	var bestSleep, worstSleep, bestReadiness int
	var bestSleepDay, worstSleepDay, bestReadinessDay string
	worstSleep = 101

	for _, d := range weekData {
		if d.sleep != nil {
			val := *d.sleep
			sumSleep += float64(val)
			countSleep++
			if val > bestSleep {
				bestSleep = val
				bestSleepDay = d.day
			}
			if val < worstSleep {
				worstSleep = val
				worstSleepDay = d.day
			}
		}
		if d.readiness != nil {
			val := *d.readiness
			sumReadiness += float64(val)
			countReadiness++
			if val > bestReadiness {
				bestReadiness = val
				bestReadinessDay = d.day
			}
		}
		if d.activity != nil {
			sumActivity += float64(*d.activity)
			countActivity++
		}
		if d.steps != nil {
			sumSteps += float64(*d.steps)
			summary.TotalSteps += *d.steps
			countSteps++
		}
	}

	if countSleep > 0 {
		summary.AvgSleep = sumSleep / float64(countSleep)
		summary.BestSleepDay = bestSleepDay
		summary.BestSleepScore = bestSleep
		if worstSleep < 101 {
			summary.WorstSleepDay = worstSleepDay
			summary.WorstSleepScore = worstSleep
		}
	}
	if countReadiness > 0 {
		summary.AvgReadiness = sumReadiness / float64(countReadiness)
		summary.BestReadinessDay = bestReadinessDay
		summary.BestReadinessScore = bestReadiness
	}
	if countActivity > 0 {
		summary.AvgActivity = sumActivity / float64(countActivity)
	}
	if countSteps > 0 {
		summary.AvgSteps = sumSteps / float64(countSteps)
	}

	// Fetch previous week for comparison
	prevWeekStart := weekStart.AddDate(0, 0, -7)
	prevWeekEnd := weekStart.AddDate(0, 0, -1)
	var prevSumSleep, prevSumReadiness, prevSumActivity, prevSumSteps float64
	var prevCountSleep, prevCountReadiness, prevCountActivity, prevCountSteps int

	prevRows, err := h.db.Query(ctx, `
		SELECT sleep_score, readiness_score, activity_score, activity_steps
		FROM oura_daily
		WHERE day >= $1 AND day <= $2
	`, formatDate(prevWeekStart), formatDate(prevWeekEnd))
	if err == nil {
		defer prevRows.Close()
		for prevRows.Next() {
			var sleep, readiness, activity, steps *int
			if err := prevRows.Scan(&sleep, &readiness, &activity, &steps); err != nil {
				continue
			}
			if sleep != nil {
				prevSumSleep += float64(*sleep)
				prevCountSleep++
			}
			if readiness != nil {
				prevSumReadiness += float64(*readiness)
				prevCountReadiness++
			}
			if activity != nil {
				prevSumActivity += float64(*activity)
				prevCountActivity++
			}
			if steps != nil {
				prevSumSteps += float64(*steps)
				prevCountSteps++
			}
		}
	}

	// Calculate deltas
	if prevCountSleep > 0 && countSleep > 0 {
		summary.SleepDelta = summary.AvgSleep - (prevSumSleep / float64(prevCountSleep))
	}
	if prevCountReadiness > 0 && countReadiness > 0 {
		summary.ReadinessDelta = summary.AvgReadiness - (prevSumReadiness / float64(prevCountReadiness))
	}
	if prevCountActivity > 0 && countActivity > 0 {
		summary.ActivityDelta = summary.AvgActivity - (prevSumActivity / float64(prevCountActivity))
	}
	if prevCountSteps > 0 && countSteps > 0 {
		summary.StepsDelta = summary.AvgSteps - (prevSumSteps / float64(prevCountSteps))
	}

	// Count workouts this week
	h.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM workouts WHERE date >= $1 AND date <= $2
	`, weekStartStr, weekEndStr).Scan(&summary.WorkoutCount)

	// Count goals met
	goalRows, err := h.db.Query(ctx, `
		SELECT goal_type, target FROM health_goals WHERE active = true
	`)
	if err == nil {
		defer goalRows.Close()
		for goalRows.Next() {
			var goalType string
			var target int
			if err := goalRows.Scan(&goalType, &target); err != nil {
				continue
			}
			summary.GoalsTotal++

			// Check if goal was met (on average or total)
			switch goalType {
			case "step_goal":
				if summary.AvgSteps >= float64(target) {
					summary.GoalsMet++
				}
			case "sleep_score":
				if summary.AvgSleep >= float64(target) {
					summary.GoalsMet++
				}
			case "readiness_score":
				if summary.AvgReadiness >= float64(target) {
					summary.GoalsMet++
				}
			case "workout_frequency":
				if summary.WorkoutCount >= target {
					summary.GoalsMet++
				}
			}
		}
	}

	// Generate highlights and lowlights
	if summary.SleepDelta > 5 {
		summary.Highlights = append(summary.Highlights, formatf("Sleep improved by %.0f points", summary.SleepDelta))
	} else if summary.SleepDelta < -5 {
		summary.Lowlights = append(summary.Lowlights, formatf("Sleep declined by %.0f points", -summary.SleepDelta))
	}

	if summary.ReadinessDelta > 5 {
		summary.Highlights = append(summary.Highlights, formatf("Readiness up %.0f points", summary.ReadinessDelta))
	} else if summary.ReadinessDelta < -5 {
		summary.Lowlights = append(summary.Lowlights, formatf("Readiness down %.0f points", -summary.ReadinessDelta))
	}

	if summary.AvgSleep >= 80 {
		summary.Highlights = append(summary.Highlights, "Excellent sleep week (80+ avg)")
	}
	if summary.AvgReadiness >= 80 {
		summary.Highlights = append(summary.Highlights, "Strong readiness week (80+ avg)")
	}
	if summary.AvgSteps >= 10000 {
		summary.Highlights = append(summary.Highlights, "Hit 10k daily steps on average")
	}

	if summary.WorstSleepScore > 0 && summary.WorstSleepScore < 60 {
		summary.Lowlights = append(summary.Lowlights, formatf("Poor sleep on %s (score: %.0f)", summary.WorstSleepDay, float64(summary.WorstSleepScore)))
	}

	if summary.WorkoutCount >= 3 {
		summary.Highlights = append(summary.Highlights, formatf("Great workout week (%d sessions)", summary.WorkoutCount))
	} else if summary.WorkoutCount == 0 {
		summary.Lowlights = append(summary.Lowlights, "No workouts logged")
	}

	// Fetch active streaks
	histRows, err := h.db.Query(ctx, `
		SELECT day, COALESCE(sleep_score, 0), COALESCE(readiness_score, 0), COALESCE(activity_steps, 0)
		FROM oura_daily
		ORDER BY day ASC
		LIMIT 90
	`)
	if err == nil {
		defer histRows.Close()
		var histData []dailyData
		for histRows.Next() {
			var d dailyData
			var dayTime time.Time
			if err := histRows.Scan(&dayTime, &d.sleep, &d.readiness, &d.steps); err != nil {
				continue
			}
			d.day = formatDate(dayTime)
			d.dayTime = dayTime
			histData = append(histData, d)
		}

		// Calculate streaks
		sleepStreak := calculateStreak(histData, func(d dailyData) bool {
			return d.sleep != nil && *d.sleep >= 80
		})
		sleepStreak.Type = "sleep_80"
		if sleepStreak.IsActive {
			summary.ActiveStreaks = append(summary.ActiveStreaks, sleepStreak)
		}

		readinessStreak := calculateStreak(histData, func(d dailyData) bool {
			return d.readiness != nil && *d.readiness >= 80
		})
		readinessStreak.Type = "readiness_80"
		if readinessStreak.IsActive {
			summary.ActiveStreaks = append(summary.ActiveStreaks, readinessStreak)
		}

		stepsStreak := calculateStreak(histData, func(d dailyData) bool {
			return d.steps != nil && *d.steps >= 10000
		})
		stepsStreak.Type = "steps_10k"
		if stepsStreak.IsActive {
			summary.ActiveStreaks = append(summary.ActiveStreaks, stepsStreak)
		}
	}

	core.WriteJSON(w, http.StatusOK, summary)
}

// calculateSleepDebt computes the current sleep debt status
func calculateSleepDebt(points []SleepBreakdownPoint) SleepDebtData {
	debt := SleepDebtData{
		DebtTrend: "stable",
	}

	if len(points) == 0 {
		return debt
	}

	// Threshold for "good sleep" - below this, debt accumulates
	const goodSleepThreshold = 75
	// Points per day of deficit/surplus (simplified model)
	const debtPerDay = 10.0

	var currentDebt float64
	var daysInDebt int
	var lastGoodNight string
	var weeklySum float64
	var weeklyCount int

	// Process from oldest to newest to track debt accumulation
	for i, p := range points {
		if p.TotalSleep == nil {
			continue
		}
		score := *p.TotalSleep

		// Track weekly average (last 7 days)
		if i >= len(points)-7 {
			weeklySum += float64(score)
			weeklyCount++
		}

		// Debt accumulation logic
		if score < goodSleepThreshold {
			// Accumulate debt based on how far below threshold
			deficit := float64(goodSleepThreshold-score) / debtPerDay
			currentDebt += deficit
			daysInDebt++
		} else {
			// Recovery: pay down debt
			surplus := float64(score-goodSleepThreshold) / debtPerDay
			currentDebt -= surplus
			if currentDebt < 0 {
				currentDebt = 0 // Don't go into negative (surplus) territory
			}
			daysInDebt = 0
			lastGoodNight = p.Day
		}
	}

	debt.CurrentDebt = currentDebt
	debt.DaysInDebt = daysInDebt
	debt.LastGoodNight = lastGoodNight

	if weeklyCount > 0 {
		debt.WeeklyAvgScore = weeklySum / float64(weeklyCount)
	}

	// Determine trend by comparing first half to second half
	if len(points) >= 6 {
		half := len(points) / 2
		var firstHalfDebt, secondHalfDebt float64
		var firstCount, secondCount int

		for i, p := range points {
			if p.TotalSleep == nil {
				continue
			}
			score := *p.TotalSleep
			if score < goodSleepThreshold {
				if i < half {
					firstHalfDebt += float64(goodSleepThreshold - score)
					firstCount++
				} else {
					secondHalfDebt += float64(goodSleepThreshold - score)
					secondCount++
				}
			}
		}

		// Normalize by count
		if firstCount > 0 {
			firstHalfDebt /= float64(firstCount)
		}
		if secondCount > 0 {
			secondHalfDebt /= float64(secondCount)
		}

		if secondHalfDebt > firstHalfDebt+5 {
			debt.DebtTrend = "increasing"
		} else if secondHalfDebt < firstHalfDebt-5 {
			debt.DebtTrend = "decreasing"
		}
	}

	// Recommend rest days based on debt level
	if currentDebt > 30 {
		debt.RecommendedRest = 3
	} else if currentDebt > 20 {
		debt.RecommendedRest = 2
	} else if currentDebt > 10 {
		debt.RecommendedRest = 1
	}

	return debt
}
