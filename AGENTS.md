# AGENTS.md - Guidelines for AI Agents

This document defines the standards and principles for working on HermanAdmin. Follow these strictly.

## Core Principle: Feature Isolation

**Context is expensive.** Structure code so that working on a feature requires reading as little as possible.

- Each feature lives in its own directory
- Features are self-contained: models, handlers, routes, migrations, UI — all in one place
- Shared code goes in `core/` (backend) or `shared/` (frontend) — keep it minimal
- Never scatter a feature's code across multiple unrelated directories

### Why This Matters

When you need to work on net worth tracking, you should only read `features/networth/`. Not hunt through `models/`, `handlers/`, `routes/`, `pages/` looking for pieces.

## Project Structure

```
backend/
  cmd/server/main.go          # Bootstrap only — no business logic
  internal/
    api/router.go             # Route registration, middleware
    core/                     # Shared utilities (keep minimal)
      db.go                   # Database connection
      response.go             # HTTP response helpers
    features/
      networth/               # ← Feature: Net Worth Tracking
        models.go             # Data structures
        handler.go            # HTTP handlers
        routes.go             # Route registration
        migrations.go         # Database migrations

frontend/
  src/
    App.tsx                   # Route definitions, layout
    main.tsx                  # Entry point
    shared/                   # Shared utilities (keep minimal)
      api/client.ts           # Base fetch helpers
    features/
      networth/               # ← Feature: Net Worth Tracking
        types.ts              # TypeScript interfaces
        api.ts                # API calls
        utils.ts              # Feature-specific helpers
        pages/                # React components
          Dashboard.tsx
          Assets.tsx
          Debts.tsx
        index.ts              # Re-exports
```

## Adding a New Feature

### Backend

1. Create `backend/internal/features/<feature>/`
2. Add these files:
   - `models.go` — data structures
   - `handler.go` — HTTP handlers
   - `routes.go` — route registration function
   - `migrations.go` — database tables (if needed)
3. Register routes in `api/router.go`:
   ```go
   r.Route("/api/v1", func(r chi.Router) {
       networth.RegisterRoutes(r, db)
       newfeature.RegisterRoutes(r, db)  // ← Add here
   })
   ```
4. Run migrations in `main.go`:
   ```go
   newfeature.Migrate(ctx, pool)
   ```

### Frontend

1. Create `frontend/src/features/<feature>/`
2. Add these files:
   - `types.ts` — TypeScript interfaces
   - `api.ts` — API calls
   - `utils.ts` — helpers (if needed)
   - `pages/` — React components
   - `index.ts` — re-exports
3. Import and add routes in `App.tsx`

## Coding Standards

### Backend (Go)

- Use `internal/` to prevent external imports
- Handlers receive `*pgxpool.Pool` via the Handler struct
- Use `core.WriteJSON()` and `core.WriteError()` for responses
- Keep SQL in the handler file — no separate repository layer unless complexity demands it
- Migrations are idempotent (`CREATE TABLE IF NOT EXISTS`)

### Frontend (React + TypeScript)

- Use React Query for server state
- Types live with the feature, not in a global `types/` folder
- Format currency with `Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' })`
- Invalidate related queries after mutations (e.g., dashboard after asset changes)

### General

- No premature abstraction — duplicate code is fine until patterns emerge
- Prefer explicit over clever
- Comments explain *why*, not *what*

## Security Principles

- Request minimum access needed to complete tasks
- Keep credentials scoped narrowly
- Store secrets in Bitwarden Secrets Manager, not in code
- Never commit `.env` files or credentials

## Before You Commit

1. Does the feature live entirely within its own directory?
2. Would another agent need to read unrelated files to understand this feature?
3. Are imports from `core/` or `shared/` truly necessary, or feature-specific?

If you're pulling in code from multiple places to understand one feature, the structure is wrong. Fix it.

---

*These guidelines exist to minimize cognitive load. Follow them.*
