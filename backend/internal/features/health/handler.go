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

// GetDashboard returns summary health metrics
func (h *Handler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	var dash HealthDashboard
	var dayTime time.Time

	// Get latest day's data
	err := h.db.QueryRow(r.Context(), `
		SELECT day, sleep_score, readiness_score, activity_score
		FROM oura_daily
		ORDER BY day DESC
		LIMIT 1
	`).Scan(&dayTime, &dash.SleepScore, &dash.ReadinessScore, &dash.ActivityScore)
	if err != nil {
		// No data yet
		core.WriteJSON(w, http.StatusOK, dash)
		return
	}
	dash.LatestDay = formatDate(dayTime)

	// Get 7-day averages
	h.db.QueryRow(r.Context(), `
		SELECT 
			COALESCE(AVG(sleep_score), 0),
			COALESCE(AVG(readiness_score), 0),
			COALESCE(AVG(activity_score), 0)
		FROM oura_daily
		WHERE day >= (SELECT MAX(day) FROM oura_daily) - INTERVAL '7 days'
	`).Scan(&dash.AvgSleepScore7d, &dash.AvgReadiness7d, &dash.AvgActivity7d)

	core.WriteJSON(w, http.StatusOK, dash)
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
		SELECT day, sleep_score, readiness_score, activity_score
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
		if err := rows.Scan(&dayTime, &p.SleepScore, &p.ReadinessScore, &p.ActivityScore); err != nil {
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
