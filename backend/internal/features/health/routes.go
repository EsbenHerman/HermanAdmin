package health

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegisterRoutes registers all health feature routes under the given router
func RegisterRoutes(r chi.Router, db *pgxpool.Pool) {
	h := NewHandler(db)

	r.Route("/health", func(r chi.Router) {
		// Oura daily data
		r.Get("/oura", h.ListOuraDaily)
		r.Post("/oura", h.UpsertOuraDaily)
		r.Get("/oura/{day}", h.GetOuraDaily)
		r.Delete("/oura/{day}", h.DeleteOuraDaily)

		// Bulk upsert for historical import
		r.Post("/oura/bulk", h.BulkUpsertOuraDaily)
	})

	// Dashboard endpoints
	r.Get("/dashboard/health", h.GetDashboard)
	r.Get("/dashboard/health/history", h.GetHistory)
}
