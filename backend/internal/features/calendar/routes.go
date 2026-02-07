package calendar

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegisterRoutes registers all calendar feature routes under the given router
func RegisterRoutes(r chi.Router, db *pgxpool.Pool) {
	h := NewHandler(db)

	r.Route("/calendar", func(r chi.Router) {
		// Events CRUD
		r.Get("/events", h.ListEvents)
		r.Post("/events", h.CreateEvent)
		r.Get("/events/{id}", h.GetEvent)
		r.Put("/events/{id}", h.UpdateEvent)
		r.Delete("/events/{id}", h.DeleteEvent)

		// Bulk upsert for sync
		r.Post("/events/sync", h.BulkUpsertEvents)

		// Upcoming events (for dashboard/briefing)
		r.Get("/upcoming", h.GetUpcoming)
	})
}
