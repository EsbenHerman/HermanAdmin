package health

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Migrate runs the health feature database migrations
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	migrations := []string{
		// Oura daily data - all metrics in one table for simplicity
		`CREATE TABLE IF NOT EXISTS oura_daily (
			id BIGSERIAL PRIMARY KEY,
			day DATE NOT NULL UNIQUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

			-- Sleep metrics
			sleep_score INT,
			sleep_deep_sleep INT,
			sleep_efficiency INT,
			sleep_latency INT,
			sleep_rem_sleep INT,
			sleep_restfulness INT,
			sleep_timing INT,
			sleep_total_sleep INT,

			-- Readiness metrics
			readiness_score INT,
			readiness_activity_balance INT,
			readiness_body_temperature INT,
			readiness_hrv_balance INT,
			readiness_previous_day_activity INT,
			readiness_previous_night INT,
			readiness_recovery_index INT,
			readiness_resting_heart_rate INT,
			readiness_sleep_balance INT,
			readiness_sleep_regularity INT,
			temperature_deviation DECIMAL(5, 3),

			-- Activity metrics
			activity_score INT,
			activity_active_calories INT,
			activity_steps INT,
			activity_total_calories INT,
			activity_meet_daily_targets INT,
			activity_move_every_hour INT,
			activity_recovery_time INT,
			activity_stay_active INT,
			activity_training_frequency INT,
			activity_training_volume INT
		)`,
		`CREATE INDEX IF NOT EXISTS idx_oura_daily_day ON oura_daily(day DESC)`,

		// Workouts table
		`CREATE TABLE IF NOT EXISTS workouts (
			id BIGSERIAL PRIMARY KEY,
			date DATE NOT NULL,
			type VARCHAR(50) NOT NULL,
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC)`,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(ctx, migration); err != nil {
			return err
		}
	}

	return nil
}
