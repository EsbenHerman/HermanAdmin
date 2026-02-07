package api

import (
	"encoding/json"
	"net/http"

	"github.com/EsbenHerman/HermanAdmin/backend/internal/features/calendar"
	"github.com/EsbenHerman/HermanAdmin/backend/internal/features/financial"
	"github.com/EsbenHerman/HermanAdmin/backend/internal/features/health"
	"github.com/EsbenHerman/HermanAdmin/backend/internal/features/people"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(db *pgxpool.Pool) *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000", "https://admin.karl-herman.com"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Root route
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{
			"name":    "HermanAdmin API",
			"version": "1.0.0",
			"status":  "running",
		})
	})

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// API v1 routes - register features
	r.Route("/api/v1", func(r chi.Router) {
		financial.RegisterRoutes(r, db)
		health.RegisterRoutes(r, db)
		calendar.RegisterRoutes(r, db)
		people.RegisterRoutes(r, db)
	})

	return r
}
