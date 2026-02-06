package networth

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Migrate runs the net worth feature database migrations
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	migrations := []string{
		// Drop old tables if they exist (clean slate for new schema)
		`DROP TABLE IF EXISTS networth_snapshots CASCADE`,
		`DROP TABLE IF EXISTS salary_entries CASCADE`,
		`DROP TABLE IF EXISTS asset_entries CASCADE`,
		`DROP TABLE IF EXISTS debt_entries CASCADE`,
		`DROP TABLE IF EXISTS assets CASCADE`,
		`DROP TABLE IF EXISTS debts CASCADE`,

		// Assets: metadata only
		`CREATE TABLE IF NOT EXISTS assets (
			id BIGSERIAL PRIMARY KEY,
			category VARCHAR(100) NOT NULL,
			asset_type VARCHAR(50) NOT NULL DEFAULT 'manual',
			name VARCHAR(255) NOT NULL,
			ticker VARCHAR(20),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,

		// Asset entries: time-series values
		`CREATE TABLE IF NOT EXISTS asset_entries (
			id BIGSERIAL PRIMARY KEY,
			asset_id BIGINT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
			entry_date DATE NOT NULL,
			units DECIMAL(15, 6) NOT NULL DEFAULT 1,
			unit_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
			notes TEXT DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_asset_entries_asset_date ON asset_entries(asset_id, entry_date DESC)`,

		// Debts: metadata only
		`CREATE TABLE IF NOT EXISTS debts (
			id BIGSERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,

		// Debt entries: time-series values
		`CREATE TABLE IF NOT EXISTS debt_entries (
			id BIGSERIAL PRIMARY KEY,
			debt_id BIGINT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
			entry_date DATE NOT NULL,
			principal DECIMAL(15, 2) NOT NULL DEFAULT 0,
			monthly_payment DECIMAL(12, 2) NOT NULL DEFAULT 0,
			notes TEXT DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_debt_entries_debt_date ON debt_entries(debt_id, entry_date DESC)`,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(ctx, migration); err != nil {
			return err
		}
	}

	return nil
}
