package calendar

import "time"

// Event represents a calendar event
type Event struct {
	ID          int64     `json:"id"`
	GoogleID    string    `json:"google_id"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	AllDay      bool      `json:"all_day"`
	Location    *string   `json:"location,omitempty"`
	Status      string    `json:"status"` // confirmed, tentative, cancelled
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// EventInput is the request body for creating/updating an event
type EventInput struct {
	GoogleID    string  `json:"google_id"`
	Title       string  `json:"title"`
	Description *string `json:"description,omitempty"`
	StartTime   string  `json:"start_time"` // ISO 8601
	EndTime     string  `json:"end_time"`   // ISO 8601
	AllDay      bool    `json:"all_day"`
	Location    *string `json:"location,omitempty"`
	Status      string  `json:"status"`
}

// BulkUpsertInput is the request body for bulk upserting events
type BulkUpsertInput struct {
	Events []EventInput `json:"events"`
}

// UpcomingResponse wraps a list of upcoming events
type UpcomingResponse struct {
	Events []Event `json:"events"`
	Count  int     `json:"count"`
}
