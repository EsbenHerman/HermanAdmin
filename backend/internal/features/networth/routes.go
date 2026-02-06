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
		r.Delete("/{id}", h.DeleteAsset)
		// Asset entries (time-series)
		r.Get("/{id}/entries", h.ListAssetEntries)
		r.Post("/{id}/entries", h.CreateAssetEntry)
		r.Put("/{id}/entries/{entryId}", h.UpdateAssetEntry)
		r.Delete("/{id}/entries/{entryId}", h.DeleteAssetEntry)
	})

	r.Route("/debts", func(r chi.Router) {
		r.Get("/", h.ListDebts)
		r.Post("/", h.CreateDebt)
		r.Get("/{id}", h.GetDebt)
		r.Delete("/{id}", h.DeleteDebt)
		// Debt entries (time-series)
		r.Get("/{id}/entries", h.ListDebtEntries)
		r.Post("/{id}/entries", h.CreateDebtEntry)
		r.Put("/{id}/entries/{entryId}", h.UpdateDebtEntry)
		r.Delete("/{id}/entries/{entryId}", h.DeleteDebtEntry)
	})

	r.Get("/dashboard/networth", h.GetDashboard)
	r.Get("/dashboard/history", h.GetHistory)
	r.Get("/dashboard/history/detailed", h.GetDetailedHistory)

	r.Route("/currencies", func(r chi.Router) {
		r.Get("/", h.ListCurrencyRates)
		r.Post("/", h.UpsertCurrencyRate)
		r.Delete("/{currency}", h.DeleteCurrencyRate)
	})
}
