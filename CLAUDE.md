# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HermanAdmin is a life admin platform for tracking finances, health, projects, and automating daily life. Full-stack app with Go backend, React frontend, and PostgreSQL database.

## Development Commands

### Database
```bash
docker-compose up -d   # Start PostgreSQL (localhost:5432, herman/herman, db: hermanadmin)
```

### Backend (Go)
```bash
cd backend && go run ./cmd/server   # Runs on :8080
```
Environment: `DATABASE_URL` (defaults to `postgres://herman:herman@localhost:5432/hermanadmin?sslmode=disable`), `PORT` (defaults to 8080).

### Frontend (React)
```bash
cd frontend && npm install   # First time only
cd frontend && npm run dev   # Vite dev server on :5173
cd frontend && npm run build # TypeScript check + production build
cd frontend && npm run lint  # ESLint
```

## Architecture

### Core Principle: Feature Isolation

Each feature is fully self-contained in its own directory on both backend and frontend. Working on a feature should only require reading that feature's directory. See `AGENTS.md` for the full rationale and guidelines.

### Backend (`backend/`)

- **Go 1.22** with Chi router, pgx (PostgreSQL driver with connection pooling)
- `cmd/server/main.go` — bootstrap, DB connection, migrations, graceful shutdown
- `internal/api/router.go` — Chi router, middleware (CORS, logging, recovery), route registration
- `internal/core/` — shared utilities: `db.go` (connection), `response.go` (JSON helpers: `WriteJSON`, `WriteError`)
- `internal/features/<feature>/` — self-contained feature modules with: `models.go`, `handler.go`, `routes.go`, `migrations.go`

**Patterns:**
- Handlers receive `*pgxpool.Pool` via Handler struct — SQL lives directly in handlers (no repository layer)
- Migrations are idempotent (`CREATE TABLE IF NOT EXISTS`), run on startup in `main.go`
- New features register routes in `api/router.go` and migrations in `main.go`

### Frontend (`frontend/src/`)

- **React 18 + TypeScript**, Vite, TailwindCSS, React Query (TanStack), React Router, Recharts
- `shared/api/client.ts` — base API URL constant and response handling
- `pages/Dashboard.tsx` — home page with feature cards
- `features/<feature>/` — self-contained modules with: `types.ts`, `api.ts`, `utils.ts`, `pages/`, `components/`, `index.ts`

**Patterns:**
- React Query for all server state — no Redux/Zustand. Invalidate related queries after mutations.
- Types live with the feature, not in a global types folder
- Currency formatted with Swedish locale: `Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' })`

### Data Model

Time-series pattern: entities have metadata tables (e.g., `assets`) and separate entry tables (e.g., `asset_entries`) storing point-in-time values by date. Latest entries retrieved via `LATERAL` joins.

### API

All endpoints under `/api/v1`. Pattern per resource: `GET /resources`, `POST /resources`, `GET /resources/{id}`, `DELETE /resources/{id}`, `GET /resources/{id}/entries`, `POST /resources/{id}/entries`. Dashboard endpoints at `/api/v1/dashboard/`.

## Adding a New Feature

1. **Backend:** Create `internal/features/<feature>/` with `models.go`, `handler.go`, `routes.go`, `migrations.go`. Register routes in `router.go`, run migrations in `main.go`.
2. **Frontend:** Create `src/features/<feature>/` with `types.ts`, `api.ts`, `pages/`, `index.ts`. Add routes in `App.tsx`.

## Coding Conventions

- Feature isolation is paramount — never scatter a feature's code across unrelated directories
- No premature abstraction — duplicate code until patterns emerge
- Comments explain *why*, not *what*
- Prefer explicit over clever
- Secrets in Bitwarden Secrets Manager, never in code
