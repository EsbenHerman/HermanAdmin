package financial

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
		// Asset prices (for stocks - auto or manual)
		r.Get("/{id}/prices", h.ListAssetPrices)
		r.Post("/{id}/prices", h.CreateAssetPrice)
		r.Post("/{id}/prices/fetch", h.FetchAssetPrice)
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

	r.Get("/dashboard/financial", h.GetDashboard)
	r.Get("/dashboard/history", h.GetHistory)
	r.Get("/dashboard/history/detailed", h.GetDetailedHistory)

	// Price updates (for cron job)
	r.Post("/prices/update", h.UpdateAllPrices)

	r.Route("/currencies", func(r chi.Router) {
		r.Get("/", h.ListCurrencyRates)
		r.Post("/", h.UpsertCurrencyRate)
		r.Delete("/{currency}", h.DeleteCurrencyRate)
	})
}
