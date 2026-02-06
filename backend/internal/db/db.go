package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}

	return pool, nil
}

func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS assets (
			id BIGSERIAL PRIMARY KEY,
			category VARCHAR(100) NOT NULL,
			name VARCHAR(255) NOT NULL,
			current_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
			expected_return DECIMAL(5, 2) NOT NULL DEFAULT 0,
			expected_dividend DECIMAL(5, 2) NOT NULL DEFAULT 0,
			notes TEXT DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS debts (
			id BIGSERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			principal DECIMAL(15, 2) NOT NULL DEFAULT 0,
			interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
			monthly_payment DECIMAL(12, 2) NOT NULL DEFAULT 0,
			remaining_term INTEGER NOT NULL DEFAULT 0,
			notes TEXT DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS salary_entries (
			id BIGSERIAL PRIMARY KEY,
			year INTEGER NOT NULL,
			base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
			bonus DECIMAL(12, 2) NOT NULL DEFAULT 0,
			equity_grants DECIMAL(12, 2) NOT NULL DEFAULT 0,
			savings_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
			notes TEXT DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(year)
		)`,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(ctx, migration); err != nil {
			return err
		}
	}

	return nil
}
