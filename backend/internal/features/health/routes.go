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

		// Workouts
		r.Get("/workouts", h.ListWorkouts)
		r.Post("/workouts", h.CreateWorkout)
		r.Get("/workouts/{id}", h.GetWorkout)
		r.Delete("/workouts/{id}", h.DeleteWorkout)

		// Weight entries
		r.Get("/weight", h.ListWeightEntries)
		r.Post("/weight", h.CreateWeightEntry)
		r.Get("/weight/{date}", h.GetWeightEntry)
		r.Delete("/weight/{date}", h.DeleteWeightEntry)
	})

	// Dashboard endpoints
	r.Get("/dashboard/health", h.GetDashboard)
	r.Get("/dashboard/health/history", h.GetHistory)
	r.Get("/dashboard/health/sleep", h.GetSleepAnalysis)
	r.Get("/dashboard/health/weight", h.GetWeightTrend)
	r.Get("/dashboard/health/body", h.GetBodyMetrics)
	r.Get("/dashboard/health/insights", h.GetInsights)
	r.Get("/dashboard/health/goals", h.GetGoalsOverview)
	r.Get("/dashboard/health/weekly", h.GetWeeklySummary)

	// Goals CRUD
	r.Route("/health/goals", func(r chi.Router) {
		r.Get("/", h.ListGoals)
		r.Post("/", h.UpsertGoal)
		r.Delete("/{type}", h.DeleteGoal)
	})
}
