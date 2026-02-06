# HermanAdmin

Life admin platform — track finances, health, projects, and automate daily life.

## Stack

- **Backend:** Go (Chi router, sqlc for DB)
- **Frontend:** React (Vite, TypeScript, TailwindCSS)
- **Database:** PostgreSQL
- **Dev Environment:** Docker Compose

## Quick Start

```bash
# Start database
docker-compose up -d

# Run backend
cd backend && go run ./cmd/server

# Run frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## Project Structure

```
HermanAdmin/
├── backend/           # Go API server
│   ├── cmd/server/    # Main entrypoint
│   ├── internal/      # Private application code
│   │   ├── api/       # HTTP handlers
│   │   ├── db/        # Database queries (sqlc)
│   │   └── models/    # Domain models
│   └── migrations/    # SQL migrations
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/
│   └── package.json
└── docker-compose.yml
```

## Development

Backend runs on `:8080`, frontend on `:5173` (Vite dev server).

## Modules (Planned)

- [ ] Net Worth Dashboard
- [ ] Health Tracking (Oura integration)
- [ ] Project Management
- [ ] Habit Tracker
- [ ] Calendar Integration
