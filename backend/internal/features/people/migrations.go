package people

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Migrate runs the people feature database migrations
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	migrations := []string{
		// People table
		`CREATE TABLE IF NOT EXISTS people (
			id BIGSERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			nickname VARCHAR(255) NOT NULL DEFAULT '',
			relationship VARCHAR(50) NOT NULL DEFAULT 'friend',
			email VARCHAR(255) NOT NULL DEFAULT '',
			phone VARCHAR(50) NOT NULL DEFAULT '',
			birthday DATE,
			birthday_lunar BOOLEAN NOT NULL DEFAULT FALSE,
			location VARCHAR(255) NOT NULL DEFAULT '',
			how_met TEXT NOT NULL DEFAULT '',
			notes TEXT NOT NULL DEFAULT '',
			contact_frequency VARCHAR(50) NOT NULL DEFAULT 'monthly',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_people_name ON people(name)`,
		`CREATE INDEX IF NOT EXISTS idx_people_birthday ON people(birthday)`,

		// Interactions table
		`CREATE TABLE IF NOT EXISTS interactions (
			id BIGSERIAL PRIMARY KEY,
			person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
			date DATE NOT NULL,
			type VARCHAR(50) NOT NULL,
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_interactions_person_id ON interactions(person_id)`,
		`CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(date DESC)`,

		// Add topics column to interactions (Phase 1)
		`ALTER TABLE interactions ADD COLUMN IF NOT EXISTS topics TEXT NOT NULL DEFAULT ''`,

		// Person facts table (Phase 1)
		`CREATE TABLE IF NOT EXISTS person_facts (
			id BIGSERIAL PRIMARY KEY,
			person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
			fact TEXT NOT NULL,
			category VARCHAR(50) NOT NULL DEFAULT 'other',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_person_facts_person_id ON person_facts(person_id)`,

		// Person life events table (Phase 1)
		`CREATE TABLE IF NOT EXISTS person_events (
			id BIGSERIAL PRIMARY KEY,
			person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
			event_type VARCHAR(50) NOT NULL,
			title VARCHAR(255) NOT NULL,
			date DATE NOT NULL,
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_person_events_person_id ON person_events(person_id)`,
		`CREATE INDEX IF NOT EXISTS idx_person_events_date ON person_events(date DESC)`,

		// Add streak columns to people (Phase 2)
		`ALTER TABLE people ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0`,
		`ALTER TABLE people ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0`,

		// Special dates table (Phase 3)
		`CREATE TABLE IF NOT EXISTS person_dates (
			id BIGSERIAL PRIMARY KEY,
			person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
			date_type VARCHAR(50) NOT NULL,
			label VARCHAR(255) NOT NULL,
			date VARCHAR(10) NOT NULL,
			recurring BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_person_dates_person_id ON person_dates(person_id)`,

		// Phase 4: Social Graph
		// Add introduced_by_id to people table
		`ALTER TABLE people ADD COLUMN IF NOT EXISTS introduced_by_id BIGINT REFERENCES people(id) ON DELETE SET NULL`,
		
		// Mutual connections table
		`CREATE TABLE IF NOT EXISTS person_connections (
			id BIGSERIAL PRIMARY KEY,
			person_a_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
			person_b_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
			relationship VARCHAR(50) NOT NULL DEFAULT 'friends',
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			CONSTRAINT unique_connection UNIQUE (person_a_id, person_b_id),
			CONSTRAINT no_self_connection CHECK (person_a_id != person_b_id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_person_connections_a ON person_connections(person_a_id)`,
		`CREATE INDEX IF NOT EXISTS idx_person_connections_b ON person_connections(person_b_id)`,

		// Phase 5: Groups/Circles
		`CREATE TABLE IF NOT EXISTS person_groups (
			id BIGSERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
			default_frequency VARCHAR(50) NOT NULL DEFAULT 'monthly',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS person_group_members (
			id BIGSERIAL PRIMARY KEY,
			group_id BIGINT NOT NULL REFERENCES person_groups(id) ON DELETE CASCADE,
			person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			CONSTRAINT unique_group_member UNIQUE (group_id, person_id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_person_group_members_group ON person_group_members(group_id)`,
		`CREATE INDEX IF NOT EXISTS idx_person_group_members_person ON person_group_members(person_id)`,

		// Phase 5: Social Handles
		`CREATE TABLE IF NOT EXISTS person_socials (
			id BIGSERIAL PRIMARY KEY,
			person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
			platform VARCHAR(50) NOT NULL,
			handle VARCHAR(255) NOT NULL,
			url TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_person_socials_person_id ON person_socials(person_id)`,

		// Phase 5: Photo Upload
		`ALTER TABLE people ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT ''`,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(ctx, migration); err != nil {
			return err
		}
	}

	return nil
}
