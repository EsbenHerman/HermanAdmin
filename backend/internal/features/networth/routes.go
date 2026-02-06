package networth

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegisterRoutes registers all net worth feature routes under the given router
func RegisterRoutes(r chi.Router, db *pgxpool.Pool) {
	h := NewHandler(db)

	r.Route("/assets", func(r chi.Router) {
		r.Get("/", h.ListAssets)
		r.Post("/", h.CreateAsset)
		r.Get("/{id}", h.GetAsset)
		r.Put("/{id}", h.UpdateAsset)
		r.Delete("/{id}", h.DeleteAsset)
	})

	r.Route("/debts", func(r chi.Router) {
		r.Get("/", h.ListDebts)
		r.Post("/", h.CreateDebt)
		r.Get("/{id}", h.GetDebt)
		r.Put("/{id}", h.UpdateDebt)
		r.Delete("/{id}", h.DeleteDebt)
	})

	r.Get("/dashboard/networth", h.GetDashboard)
}
