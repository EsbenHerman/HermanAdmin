package calendar

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Migrate runs the calendar feature database migrations
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS calendar_events (
			id BIGSERIAL PRIMARY KEY,
			google_id VARCHAR(255) NOT NULL UNIQUE,
			title VARCHAR(500) NOT NULL,
			description TEXT,
			start_time TIMESTAMPTZ NOT NULL,
			end_time TIMESTAMPTZ NOT NULL,
			all_day BOOLEAN NOT NULL DEFAULT FALSE,
			location TEXT,
			status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time)`,
		`CREATE INDEX IF NOT EXISTS idx_calendar_events_end ON calendar_events(end_time)`,
		`CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON calendar_events(google_id)`,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(ctx, migration); err != nil {
			return err
		}
	}

	return nil
}
