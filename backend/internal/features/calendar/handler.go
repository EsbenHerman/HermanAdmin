package calendar

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/EsbenHerman/HermanAdmin/backend/internal/core"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// ListEvents returns events with optional date range filtering
func (h *Handler) ListEvents(w http.ResponseWriter, r *http.Request) {
	// Default: next 30 days
	from := time.Now()
	to := from.AddDate(0, 1, 0)

	if f := r.URL.Query().Get("from"); f != "" {
		if t, err := time.Parse("2006-01-02", f); err == nil {
			from = t
		}
	}
	if t := r.URL.Query().Get("to"); t != "" {
		if parsed, err := time.Parse("2006-01-02", t); err == nil {
			to = parsed.AddDate(0, 0, 1) // Include the end date
		}
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT id, google_id, title, description, start_time, end_time,
			all_day, location, status, created_at, updated_at
		FROM calendar_events
		WHERE start_time < $2 AND end_time >= $1
			AND status != 'cancelled'
		ORDER BY start_time ASC
	`, from, to)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		if err := rows.Scan(&e.ID, &e.GoogleID, &e.Title, &e.Description,
			&e.StartTime, &e.EndTime, &e.AllDay, &e.Location, &e.Status,
			&e.CreatedAt, &e.UpdatedAt); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		events = append(events, e)
	}

	if events == nil {
		events = []Event{}
	}

	core.WriteJSON(w, http.StatusOK, events)
}

// GetEvent returns a single event by ID
func (h *Handler) GetEvent(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var e Event
	err = h.db.QueryRow(r.Context(), `
		SELECT id, google_id, title, description, start_time, end_time,
			all_day, location, status, created_at, updated_at
		FROM calendar_events
		WHERE id = $1
	`, id).Scan(&e.ID, &e.GoogleID, &e.Title, &e.Description,
		&e.StartTime, &e.EndTime, &e.AllDay, &e.Location, &e.Status,
		&e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "Event not found")
		return
	}

	core.WriteJSON(w, http.StatusOK, e)
}

// CreateEvent creates a new event
func (h *Handler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	var input EventInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if input.GoogleID == "" || input.Title == "" {
		core.WriteError(w, http.StatusBadRequest, "google_id and title are required")
		return
	}

	startTime, err := time.Parse(time.RFC3339, input.StartTime)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid start_time format (use RFC3339)")
		return
	}

	endTime, err := time.Parse(time.RFC3339, input.EndTime)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid end_time format (use RFC3339)")
		return
	}

	status := input.Status
	if status == "" {
		status = "confirmed"
	}

	var id int64
	err = h.db.QueryRow(r.Context(), `
		INSERT INTO calendar_events (google_id, title, description, start_time, end_time,
			all_day, location, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, input.GoogleID, input.Title, input.Description, startTime, endTime,
		input.AllDay, input.Location, status).Scan(&id)

	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	core.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"id":        id,
		"google_id": input.GoogleID,
	})
}

// UpdateEvent updates an existing event by ID
func (h *Handler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var input EventInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	startTime, err := time.Parse(time.RFC3339, input.StartTime)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid start_time format")
		return
	}

	endTime, err := time.Parse(time.RFC3339, input.EndTime)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid end_time format")
		return
	}

	result, err := h.db.Exec(r.Context(), `
		UPDATE calendar_events
		SET title = $2, description = $3, start_time = $4, end_time = $5,
			all_day = $6, location = $7, status = $8, updated_at = NOW()
		WHERE id = $1
	`, id, input.Title, input.Description, startTime, endTime,
		input.AllDay, input.Location, input.Status)

	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if result.RowsAffected() == 0 {
		core.WriteError(w, http.StatusNotFound, "Event not found")
		return
	}

	core.WriteJSON(w, http.StatusOK, map[string]interface{}{"id": id, "updated": true})
}

// DeleteEvent removes an event by ID
func (h *Handler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	result, err := h.db.Exec(r.Context(), `DELETE FROM calendar_events WHERE id = $1`, id)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if result.RowsAffected() == 0 {
		core.WriteError(w, http.StatusNotFound, "Event not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// BulkUpsertEvents syncs events from Google Calendar (upserts by google_id)
func (h *Handler) BulkUpsertEvents(w http.ResponseWriter, r *http.Request) {
	var input BulkUpsertInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		core.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	upserted := 0
	for _, ev := range input.Events {
		if ev.GoogleID == "" || ev.Title == "" {
			continue
		}

		startTime, err := time.Parse(time.RFC3339, ev.StartTime)
		if err != nil {
			continue
		}
		endTime, err := time.Parse(time.RFC3339, ev.EndTime)
		if err != nil {
			continue
		}

		status := ev.Status
		if status == "" {
			status = "confirmed"
		}

		_, err = h.db.Exec(r.Context(), `
			INSERT INTO calendar_events (google_id, title, description, start_time, end_time,
				all_day, location, status, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
			ON CONFLICT (google_id) DO UPDATE SET
				title = EXCLUDED.title,
				description = EXCLUDED.description,
				start_time = EXCLUDED.start_time,
				end_time = EXCLUDED.end_time,
				all_day = EXCLUDED.all_day,
				location = EXCLUDED.location,
				status = EXCLUDED.status,
				updated_at = NOW()
		`, ev.GoogleID, ev.Title, ev.Description, startTime, endTime,
			ev.AllDay, ev.Location, status)

		if err == nil {
			upserted++
		}
	}

	core.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"upserted": upserted,
		"total":    len(input.Events),
	})
}

// GetUpcoming returns upcoming events for dashboard/briefing
func (h *Handler) GetUpcoming(w http.ResponseWriter, r *http.Request) {
	days := 30 // default for dashboard
	if d := r.URL.Query().Get("days"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 && n <= 90 {
			days = n
		}
	}

	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}

	now := time.Now()
	until := now.AddDate(0, 0, days)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, google_id, title, description, start_time, end_time,
			all_day, location, status, created_at, updated_at
		FROM calendar_events
		WHERE start_time >= $1 AND start_time < $2
			AND status != 'cancelled'
		ORDER BY start_time ASC
		LIMIT $3
	`, now, until, limit)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		if err := rows.Scan(&e.ID, &e.GoogleID, &e.Title, &e.Description,
			&e.StartTime, &e.EndTime, &e.AllDay, &e.Location, &e.Status,
			&e.CreatedAt, &e.UpdatedAt); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		events = append(events, e)
	}

	if events == nil {
		events = []Event{}
	}

	core.WriteJSON(w, http.StatusOK, UpcomingResponse{
		Events: events,
		Count:  len(events),
	})
}
