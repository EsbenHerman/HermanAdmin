package people

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegisterRoutes registers all people feature routes under the given router
func RegisterRoutes(r chi.Router, db *pgxpool.Pool) {
	h := NewHandler(db)

	r.Route("/people", func(r chi.Router) {
		r.Get("/", h.ListPeople)
		r.Post("/", h.CreatePerson)
		r.Get("/overdue", h.GetOverdue)
		r.Get("/birthdays", h.GetBirthdays)
		r.Get("/suggestions", h.GetSuggestions)     // Phase 3
		r.Get("/reconnect", h.GetReconnect)         // Phase 3
		r.Get("/dates/upcoming", h.GetUpcomingDates) // Phase 3
		r.Get("/nearby", h.GetNearby)               // Phase 3
		r.Post("/import", h.ImportPeople)           // Phase 5
		
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetPerson)
			r.Put("/", h.UpdatePerson)
			r.Delete("/", h.DeletePerson)
			
			// Interactions
			r.Post("/interactions", h.CreateInteraction)
			r.Delete("/interactions/{interactionId}", h.DeleteInteraction)

			// Facts (Phase 1)
			r.Get("/facts", h.ListFacts)
			r.Post("/facts", h.CreateFact)
			r.Delete("/facts/{factId}", h.DeleteFact)

			// Life Events (Phase 1)
			r.Get("/events", h.ListLifeEvents)
			r.Post("/events", h.CreateLifeEvent)
			r.Delete("/events/{eventId}", h.DeleteLifeEvent)

			// Special Dates (Phase 3)
			r.Get("/dates", h.ListSpecialDates)
			r.Post("/dates", h.CreateSpecialDate)
			r.Delete("/dates/{dateId}", h.DeleteSpecialDate)

			// Connections (Phase 4)
			r.Get("/connections", h.ListConnections)
			r.Post("/connections", h.CreateConnection)
			r.Delete("/connections/{connectionId}", h.DeleteConnection)

			// Social Handles (Phase 5)
			r.Get("/socials", h.ListSocials)
			r.Post("/socials", h.CreateSocial)
			r.Delete("/socials/{socialId}", h.DeleteSocial)

			// Photo Upload (Phase 5)
			r.Post("/photo", h.UploadPhoto)
		})
	})

	// Groups (Phase 5)
	r.Route("/groups", func(r chi.Router) {
		r.Get("/", h.ListGroups)
		r.Post("/", h.CreateGroup)
		r.Route("/{groupId}", func(r chi.Router) {
			r.Get("/", h.GetGroup)
			r.Put("/", h.UpdateGroup)
			r.Delete("/", h.DeleteGroup)
			r.Post("/members", h.AddGroupMember)
			r.Delete("/members/{personId}", h.RemoveGroupMember)
		})
	})

	// Dashboard endpoint
	r.Get("/dashboard/people", h.GetDashboard)

	// Serve uploaded files
	fileServer := http.FileServer(http.Dir("uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fileServer))
}
