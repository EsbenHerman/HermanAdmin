package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	db *pgxpool.Pool
}

func NewRouter(db *pgxpool.Pool) *chi.Mux {
	s := &Server{db: db}

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	r.Get("/health", s.healthCheck)

	r.Route("/api/v1", func(r chi.Router) {
		// Net Worth routes
		r.Route("/assets", func(r chi.Router) {
			r.Get("/", s.listAssets)
			r.Post("/", s.createAsset)
			r.Get("/{id}", s.getAsset)
			r.Put("/{id}", s.updateAsset)
			r.Delete("/{id}", s.deleteAsset)
		})

		r.Route("/debts", func(r chi.Router) {
			r.Get("/", s.listDebts)
			r.Post("/", s.createDebt)
			r.Get("/{id}", s.getDebt)
			r.Put("/{id}", s.updateDebt)
			r.Delete("/{id}", s.deleteDebt)
		})

		r.Get("/dashboard/networth", s.getNetWorthDashboard)
	})

	return r
}

func (s *Server) healthCheck(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// JSON helper
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
