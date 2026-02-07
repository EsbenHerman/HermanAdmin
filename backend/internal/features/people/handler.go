package people

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// frequencyToDays converts a contact frequency to days
func frequencyToDays(freq ContactFrequency) int {
	switch freq {
	case FrequencyWeekly:
		return 7
	case FrequencyMonthly:
		return 30
	case FrequencyQuarterly:
		return 90
	case FrequencyYearly:
		return 365
	default:
		return 0 // none
	}
}

// updateStreak recalculates the streak for a person based on their interaction history
func (h *Handler) updateStreak(ctx context.Context, personID int64) {
	// Get the person's contact frequency
	var freq ContactFrequency
	var currentStreak, longestStreak int
	h.db.QueryRow(ctx, `
		SELECT contact_frequency, current_streak, longest_streak 
		FROM people WHERE id = $1
	`, personID).Scan(&freq, &currentStreak, &longestStreak)

	if freq == FrequencyNone {
		return // No streak tracking for no-frequency contacts
	}

	freqDays := frequencyToDays(freq)
	if freqDays == 0 {
		return
	}

	// Get all interactions ordered by date DESC
	rows, err := h.db.Query(ctx, `
		SELECT date FROM interactions 
		WHERE person_id = $1 
		ORDER BY date DESC
	`, personID)
	if err != nil {
		return
	}
	defer rows.Close()

	var dates []time.Time
	for rows.Next() {
		var d time.Time
		if err := rows.Scan(&d); err == nil {
			dates = append(dates, d)
		}
	}

	if len(dates) == 0 {
		return
	}

	// Calculate streak: count consecutive periods where contact happened on time
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
	
	newStreak := 0
	lastDate := today

	for _, d := range dates {
		daysSince := int(lastDate.Sub(d).Hours() / 24)
		if daysSince <= freqDays {
			newStreak++
			lastDate = d
		} else {
			break // Streak broken
		}
	}

	// Update if changed
	if newStreak > longestStreak {
		longestStreak = newStreak
	}

	h.db.Exec(ctx, `
		UPDATE people SET current_streak = $1, longest_streak = $2 WHERE id = $3
	`, newStreak, longestStreak, personID)
}

// calculateHealthScore computes relationship health (0-100) based on:
// - Frequency compliance (on schedule = +40)
// - Recency (contacted recently = +30)
// - Variety (mix of interaction types = +20)
// - Consistency/Streak (regular pattern = +10)
func (h *Handler) calculateHealthScore(ctx context.Context, personID int64, freq ContactFrequency, lastContact *string, currentStreak int) int {
	if freq == FrequencyNone {
		return 100 // No expectations = healthy
	}

	freqDays := frequencyToDays(freq)
	if freqDays == 0 {
		return 100
	}

	score := 0
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)

	// Frequency compliance (+40)
	// On schedule or ahead = 40, slightly late = 20-40, very late = 0-20
	if lastContact != nil {
		lastDate, _ := time.Parse("2006-01-02", *lastContact)
		daysSince := int(today.Sub(lastDate).Hours() / 24)
		
		if daysSince <= freqDays {
			score += 40 // On schedule
		} else {
			overduePct := float64(daysSince-freqDays) / float64(freqDays)
			if overduePct < 0.5 {
				score += 30 // Slightly late
			} else if overduePct < 1.0 {
				score += 20 // Moderately late
			} else if overduePct < 2.0 {
				score += 10 // Very late
			}
			// More than 2x overdue = 0
		}
	}

	// Recency (+30)
	// Contacted in last 7 days = 30, 14 days = 20, 30 days = 10
	if lastContact != nil {
		lastDate, _ := time.Parse("2006-01-02", *lastContact)
		daysSince := int(today.Sub(lastDate).Hours() / 24)
		
		if daysSince <= 7 {
			score += 30
		} else if daysSince <= 14 {
			score += 20
		} else if daysSince <= 30 {
			score += 10
		}
	}

	// Variety (+20)
	// Check interaction types in last 90 days
	var typeCount int
	h.db.QueryRow(ctx, `
		SELECT COUNT(DISTINCT type) FROM interactions 
		WHERE person_id = $1 AND date >= $2
	`, personID, today.AddDate(0, 0, -90).Format("2006-01-02")).Scan(&typeCount)
	
	if typeCount >= 3 {
		score += 20
	} else if typeCount == 2 {
		score += 15
	} else if typeCount == 1 {
		score += 10
	}

	// Streak bonus (+10)
	if currentStreak >= 5 {
		score += 10
	} else if currentStreak >= 3 {
		score += 7
	} else if currentStreak >= 1 {
		score += 5
	}

	if score > 100 {
		score = 100
	}
	return score
}

// ListPeople returns all people
func (h *Handler) ListPeople(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Check for group filter
	groupID := r.URL.Query().Get("group_id")
	
	var rows pgx.Rows
	var err error
	
	if groupID != "" {
		rows, err = h.db.Query(ctx, `
			SELECT p.id, p.name, p.nickname, p.relationship, p.email, p.phone,
			       p.birthday::text, p.birthday_lunar, p.location, p.how_met, p.notes,
			       p.contact_frequency, p.current_streak, p.longest_streak,
			       p.introduced_by_id, p.photo_url, p.created_at,
			       (SELECT MAX(date)::text FROM interactions WHERE person_id = p.id) as last_contact
			FROM people p
			INNER JOIN person_group_members pgm ON pgm.person_id = p.id
			WHERE pgm.group_id = $1
			ORDER BY p.name ASC
		`, groupID)
	} else {
		rows, err = h.db.Query(ctx, `
			SELECT p.id, p.name, p.nickname, p.relationship, p.email, p.phone,
			       p.birthday::text, p.birthday_lunar, p.location, p.how_met, p.notes,
			       p.contact_frequency, p.current_streak, p.longest_streak,
			       p.introduced_by_id, p.photo_url, p.created_at,
			       (SELECT MAX(date)::text FROM interactions WHERE person_id = p.id) as last_contact
			FROM people p
			ORDER BY p.name ASC
		`)
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	people := []Person{}
	now := time.Now()
	today := now.Format("2006-01-02")

	for rows.Next() {
		var p Person
		var lastContact *string

		err := rows.Scan(
			&p.ID, &p.Name, &p.Nickname, &p.Relationship, &p.Email, &p.Phone,
			&p.Birthday, &p.BirthdayLunar, &p.Location, &p.HowMet, &p.Notes,
			&p.ContactFrequency, &p.CurrentStreak, &p.LongestStreak,
			&p.IntroducedByID, &p.PhotoURL, &p.CreatedAt, &lastContact,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		p.LastContact = lastContact
		
		// Convert lunar birthday to Gregorian for current year if applicable
		if p.BirthdayLunar && p.Birthday != nil {
			gregorian := h.lunarToGregorian(*p.Birthday)
			p.BirthdayGregorian = &gregorian
		}

		// Calculate days overdue
		if lastContact != nil && p.ContactFrequency != FrequencyNone {
			freqDays := frequencyToDays(p.ContactFrequency)
			if freqDays > 0 {
				lastDate, _ := time.Parse("2006-01-02", *lastContact)
				todayDate, _ := time.Parse("2006-01-02", today)
				daysSince := int(todayDate.Sub(lastDate).Hours() / 24)
				if daysSince > freqDays {
					overdue := daysSince - freqDays
					p.DaysOverdue = &overdue
				}
			}
		}

		// Calculate health score
		healthScore := h.calculateHealthScore(ctx, p.ID, p.ContactFrequency, p.LastContact, p.CurrentStreak)
		p.HealthScore = &healthScore

		people = append(people, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(people)
}

// GetPerson returns a single person with their interactions
func (h *Handler) GetPerson(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var p Person
	err = h.db.QueryRow(ctx, `
		SELECT p.id, p.name, p.nickname, p.relationship, p.email, p.phone,
		       p.birthday::text, p.birthday_lunar, p.location, p.how_met, p.notes,
		       p.contact_frequency, p.current_streak, p.longest_streak,
		       p.introduced_by_id, p.photo_url, p.created_at,
		       introducer.name
		FROM people p
		LEFT JOIN people introducer ON introducer.id = p.introduced_by_id
		WHERE p.id = $1
	`, id).Scan(
		&p.ID, &p.Name, &p.Nickname, &p.Relationship, &p.Email, &p.Phone,
		&p.Birthday, &p.BirthdayLunar, &p.Location, &p.HowMet, &p.Notes,
		&p.ContactFrequency, &p.CurrentStreak, &p.LongestStreak,
		&p.IntroducedByID, &p.PhotoURL, &p.CreatedAt, &p.IntroducedByName,
	)
	if err != nil {
		http.Error(w, "Person not found", http.StatusNotFound)
		return
	}
	
	// Convert lunar birthday to Gregorian for current year if applicable
	if p.BirthdayLunar && p.Birthday != nil {
		gregorian := h.lunarToGregorian(*p.Birthday)
		p.BirthdayGregorian = &gregorian
	}

	// Get interactions
	rows, err := h.db.Query(ctx, `
		SELECT id, person_id, date, type, notes, topics, created_at
		FROM interactions
		WHERE person_id = $1
		ORDER BY date DESC
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	interactions := []Interaction{}
	for rows.Next() {
		var i Interaction
		var interactionDate time.Time
		if err := rows.Scan(&i.ID, &i.PersonID, &interactionDate, &i.Type, &i.Notes, &i.Topics, &i.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		i.Date = interactionDate.Format("2006-01-02")
		interactions = append(interactions, i)
	}

	// Get facts
	factRows, err := h.db.Query(ctx, `
		SELECT id, person_id, fact, category, created_at
		FROM person_facts
		WHERE person_id = $1
		ORDER BY created_at DESC
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer factRows.Close()

	facts := []Fact{}
	for factRows.Next() {
		var f Fact
		if err := factRows.Scan(&f.ID, &f.PersonID, &f.Fact, &f.Category, &f.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		facts = append(facts, f)
	}

	// Get life events
	eventRows, err := h.db.Query(ctx, `
		SELECT id, person_id, event_type, title, date, notes, created_at
		FROM person_events
		WHERE person_id = $1
		ORDER BY date DESC
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer eventRows.Close()

	lifeEvents := []LifeEvent{}
	for eventRows.Next() {
		var e LifeEvent
		var eventDate time.Time
		if err := eventRows.Scan(&e.ID, &e.PersonID, &e.EventType, &e.Title, &eventDate, &e.Notes, &e.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		e.Date = eventDate.Format("2006-01-02")
		lifeEvents = append(lifeEvents, e)
	}

	// Get special dates
	dateRows, err := h.db.Query(ctx, `
		SELECT id, person_id, date_type, label, date, recurring, created_at
		FROM person_dates
		WHERE person_id = $1
		ORDER BY date
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer dateRows.Close()

	specialDates := []SpecialDate{}
	for dateRows.Next() {
		var d SpecialDate
		if err := dateRows.Scan(&d.ID, &d.PersonID, &d.DateType, &d.Label, &d.Date, &d.Recurring, &d.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		specialDates = append(specialDates, d)
	}

	// Get last contact for health score
	var lastContact *string
	h.db.QueryRow(ctx, `SELECT MAX(date)::text FROM interactions WHERE person_id = $1`, id).Scan(&lastContact)
	p.LastContact = lastContact

	// Calculate health score
	healthScore := h.calculateHealthScore(ctx, p.ID, p.ContactFrequency, p.LastContact, p.CurrentStreak)
	p.HealthScore = &healthScore

	// Get connections (Phase 4)
	connRows, err := h.db.Query(ctx, `
		SELECT c.id, c.person_a_id, c.person_b_id, c.relationship, c.notes, c.created_at,
		       CASE WHEN c.person_a_id = $1 THEN c.person_b_id ELSE c.person_a_id END as connected_id,
		       CASE WHEN c.person_a_id = $1 THEN pb.name ELSE pa.name END as connected_name
		FROM person_connections c
		JOIN people pa ON pa.id = c.person_a_id
		JOIN people pb ON pb.id = c.person_b_id
		WHERE c.person_a_id = $1 OR c.person_b_id = $1
		ORDER BY c.created_at DESC
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer connRows.Close()

	connections := []Connection{}
	for connRows.Next() {
		var c Connection
		if err := connRows.Scan(&c.ID, &c.PersonAID, &c.PersonBID, &c.Relationship, &c.Notes, &c.CreatedAt,
			&c.ConnectedPersonID, &c.ConnectedPersonName); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		connections = append(connections, c)
	}

	// Get social handles (Phase 5)
	socialRows, err := h.db.Query(ctx, `
		SELECT id, person_id, platform, handle, url, created_at
		FROM person_socials
		WHERE person_id = $1
		ORDER BY platform
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer socialRows.Close()

	socials := []Social{}
	for socialRows.Next() {
		var s Social
		if err := socialRows.Scan(&s.ID, &s.PersonID, &s.Platform, &s.Handle, &s.URL, &s.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		socials = append(socials, s)
	}

	result := PersonWithInteractions{
		Person:       p,
		Interactions: interactions,
		Facts:        facts,
		LifeEvents:   lifeEvents,
		SpecialDates: specialDates,
		Connections:  connections,
		Socials:      socials,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// CreatePerson creates a new person
func (h *Handler) CreatePerson(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var input PersonInput

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	if input.ContactFrequency == "" {
		input.ContactFrequency = FrequencyMonthly
	}

	if input.Relationship == "" {
		input.Relationship = RelationshipFriend
	}

	var p Person
	err := h.db.QueryRow(ctx, `
		INSERT INTO people (name, nickname, relationship, email, phone, birthday, birthday_lunar, location, how_met, notes, contact_frequency, introduced_by_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, name, nickname, relationship, email, phone, birthday::text, birthday_lunar, location, how_met, notes, contact_frequency, introduced_by_id, photo_url, created_at
	`,
		input.Name, input.Nickname, input.Relationship, input.Email, input.Phone,
		input.Birthday, input.BirthdayLunar, input.Location, input.HowMet, input.Notes,
		input.ContactFrequency, input.IntroducedByID,
	).Scan(
		&p.ID, &p.Name, &p.Nickname, &p.Relationship, &p.Email, &p.Phone,
		&p.Birthday, &p.BirthdayLunar, &p.Location, &p.HowMet, &p.Notes,
		&p.ContactFrequency, &p.IntroducedByID, &p.PhotoURL, &p.CreatedAt,
	)
	if err != nil {
		// Check for duplicate name error
		if strings.Contains(err.Error(), "idx_people_name_unique") {
			http.Error(w, "A person with this name already exists", http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

// UpdatePerson updates an existing person
func (h *Handler) UpdatePerson(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var input PersonInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	var p Person
	err = h.db.QueryRow(ctx, `
		UPDATE people SET
			name = $2, nickname = $3, relationship = $4, email = $5, phone = $6,
			birthday = $7, birthday_lunar = $8, location = $9, how_met = $10, notes = $11,
			contact_frequency = $12, introduced_by_id = $13
		WHERE id = $1
		RETURNING id, name, nickname, relationship, email, phone, birthday::text, birthday_lunar, location, how_met, notes, contact_frequency, introduced_by_id, photo_url, created_at
	`,
		id, input.Name, input.Nickname, input.Relationship, input.Email, input.Phone,
		input.Birthday, input.BirthdayLunar, input.Location, input.HowMet, input.Notes,
		input.ContactFrequency, input.IntroducedByID,
	).Scan(
		&p.ID, &p.Name, &p.Nickname, &p.Relationship, &p.Email, &p.Phone,
		&p.Birthday, &p.BirthdayLunar, &p.Location, &p.HowMet, &p.Notes,
		&p.ContactFrequency, &p.IntroducedByID, &p.PhotoURL, &p.CreatedAt,
	)
	if err != nil {
		// Check for duplicate name error
		if strings.Contains(err.Error(), "idx_people_name_unique") {
			http.Error(w, "A person with this name already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Person not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

// DeletePerson deletes a person
func (h *Handler) DeletePerson(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(ctx, "DELETE FROM people WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Person not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// CreateInteraction logs an interaction with a person
func (h *Handler) CreateInteraction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	var input InteractionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Default to today
	if input.Date == "" {
		input.Date = time.Now().Format("2006-01-02")
	}

	if input.Type == "" {
		http.Error(w, "Type is required", http.StatusBadRequest)
		return
	}

	var i Interaction
	var interactionDate time.Time
	err = h.db.QueryRow(ctx, `
		INSERT INTO interactions (person_id, date, type, notes, topics)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, person_id, date, type, notes, topics, created_at
	`, personID, input.Date, input.Type, input.Notes, input.Topics).Scan(
		&i.ID, &i.PersonID, &interactionDate, &i.Type, &i.Notes, &i.Topics, &i.CreatedAt,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	i.Date = interactionDate.Format("2006-01-02")

	// Update streak
	h.updateStreak(ctx, personID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(i)
}

// DeleteInteraction deletes an interaction
func (h *Handler) DeleteInteraction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	interactionID, err := strconv.ParseInt(chi.URLParam(r, "interactionId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid interaction ID", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(ctx, "DELETE FROM interactions WHERE id = $1", interactionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Interaction not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetOverdue returns people who are overdue for contact
func (h *Handler) GetOverdue(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	overdue := h.calculateOverdue(ctx)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(overdue)
}

func (h *Handler) calculateOverdue(ctx context.Context) []OverduePerson {
	rows, err := h.db.Query(ctx, `
		SELECT p.id, p.name, p.nickname, p.contact_frequency,
		       (SELECT MAX(date)::text FROM interactions WHERE person_id = p.id) as last_contact
		FROM people p
		WHERE p.contact_frequency != 'none'
		ORDER BY last_contact ASC NULLS FIRST
	`)
	if err != nil {
		return []OverduePerson{}
	}
	defer rows.Close()

	overdue := []OverduePerson{}
	now := time.Now()
	today := now.Format("2006-01-02")
	todayDate, _ := time.Parse("2006-01-02", today)

	for rows.Next() {
		var id int64
		var name, nickname string
		var freq ContactFrequency
		var lastContact *string

		if err := rows.Scan(&id, &name, &nickname, &freq, &lastContact); err != nil {
			continue
		}

		freqDays := frequencyToDays(freq)
		if freqDays == 0 {
			continue
		}

		var daysOverdue int
		var lastContactStr string

		if lastContact == nil {
			// Never contacted - count from creation (assume overdue)
			daysOverdue = freqDays + 1
			lastContactStr = "never"
		} else {
			lastDate, _ := time.Parse("2006-01-02", *lastContact)
			daysSince := int(todayDate.Sub(lastDate).Hours() / 24)
			if daysSince <= freqDays {
				continue // Not overdue
			}
			daysOverdue = daysSince - freqDays
			lastContactStr = *lastContact
		}

		overdue = append(overdue, OverduePerson{
			ID:          id,
			Name:        name,
			Nickname:    nickname,
			LastContact: lastContactStr,
			DaysOverdue: daysOverdue,
			Frequency:   string(freq),
		})
	}

	return overdue
}

// GetBirthdays returns upcoming birthdays in the next 30 days
func (h *Handler) GetBirthdays(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	birthdays := h.calculateBirthdays(ctx)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(birthdays)
}

func (h *Handler) calculateBirthdays(ctx context.Context) []UpcomingBirthday {
	rows, err := h.db.Query(ctx, `
		SELECT id, name, nickname, birthday
		FROM people
		WHERE birthday IS NOT NULL AND birthday_lunar = FALSE
		ORDER BY 
			EXTRACT(MONTH FROM birthday),
			EXTRACT(DAY FROM birthday)
	`)
	if err != nil {
		return []UpcomingBirthday{}
	}
	defer rows.Close()

	birthdays := []UpcomingBirthday{}
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)

	for rows.Next() {
		var id int64
		var name, nickname string
		var birthday time.Time

		if err := rows.Scan(&id, &name, &nickname, &birthday); err != nil {
			continue
		}

		// Calculate this year's birthday
		thisYearBday := time.Date(now.Year(), birthday.Month(), birthday.Day(), 0, 0, 0, 0, time.Local)
		
		// If already passed, check next year
		if thisYearBday.Before(today) {
			thisYearBday = time.Date(now.Year()+1, birthday.Month(), birthday.Day(), 0, 0, 0, 0, time.Local)
		}

		daysUntil := int(thisYearBday.Sub(today).Hours() / 24)
		
		if daysUntil > 30 {
			continue // More than 30 days away
		}

		// Calculate turning age if we have birth year
		var turningAge *int
		if birthday.Year() > 1900 {
			age := thisYearBday.Year() - birthday.Year()
			turningAge = &age
		}

		birthdays = append(birthdays, UpcomingBirthday{
			ID:         id,
			Name:       name,
			Nickname:   nickname,
			Birthday:   birthday.Format("2006-01-02"),
			DaysUntil:  daysUntil,
			TurningAge: turningAge,
		})
	}

	return birthdays
}

// GetDashboard returns the people dashboard summary
func (h *Handler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var totalPeople int
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM people").Scan(&totalPeople)

	overdue := h.calculateOverdue(ctx)
	birthdays := h.calculateBirthdays(ctx)

	dashboard := PeopleDashboard{
		TotalPeople:       totalPeople,
		OverdueCount:      len(overdue),
		OverdueContacts:   overdue,
		UpcomingBirthdays: birthdays,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dashboard)
}

// --- Facts ---

// ListFacts returns all facts for a person
func (h *Handler) ListFacts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT id, person_id, fact, category, created_at
		FROM person_facts
		WHERE person_id = $1
		ORDER BY created_at DESC
	`, personID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	facts := []Fact{}
	for rows.Next() {
		var f Fact
		if err := rows.Scan(&f.ID, &f.PersonID, &f.Fact, &f.Category, &f.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		facts = append(facts, f)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(facts)
}

// CreateFact creates a new fact for a person
func (h *Handler) CreateFact(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	var input FactInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Fact == "" {
		http.Error(w, "Fact is required", http.StatusBadRequest)
		return
	}

	if input.Category == "" {
		input.Category = FactCategoryOther
	}

	var f Fact
	err = h.db.QueryRow(ctx, `
		INSERT INTO person_facts (person_id, fact, category)
		VALUES ($1, $2, $3)
		RETURNING id, person_id, fact, category, created_at
	`, personID, input.Fact, input.Category).Scan(
		&f.ID, &f.PersonID, &f.Fact, &f.Category, &f.CreatedAt,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(f)
}

// DeleteFact deletes a fact
func (h *Handler) DeleteFact(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	factID, err := strconv.ParseInt(chi.URLParam(r, "factId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid fact ID", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(ctx, "DELETE FROM person_facts WHERE id = $1", factID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Fact not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Life Events ---

// ListLifeEvents returns all life events for a person
func (h *Handler) ListLifeEvents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT id, person_id, event_type, title, date, notes, created_at
		FROM person_events
		WHERE person_id = $1
		ORDER BY date DESC
	`, personID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	events := []LifeEvent{}
	for rows.Next() {
		var e LifeEvent
		var eventDate time.Time
		if err := rows.Scan(&e.ID, &e.PersonID, &e.EventType, &e.Title, &eventDate, &e.Notes, &e.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		e.Date = eventDate.Format("2006-01-02")
		events = append(events, e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

// CreateLifeEvent creates a new life event for a person
func (h *Handler) CreateLifeEvent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	var input LifeEventInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	if input.Date == "" {
		input.Date = time.Now().Format("2006-01-02")
	}

	if input.EventType == "" {
		input.EventType = EventTypeOther
	}

	var e LifeEvent
	var eventDate time.Time
	err = h.db.QueryRow(ctx, `
		INSERT INTO person_events (person_id, event_type, title, date, notes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, person_id, event_type, title, date, notes, created_at
	`, personID, input.EventType, input.Title, input.Date, input.Notes).Scan(
		&e.ID, &e.PersonID, &e.EventType, &e.Title, &eventDate, &e.Notes, &e.CreatedAt,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	e.Date = eventDate.Format("2006-01-02")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(e)
}

// DeleteLifeEvent deletes a life event
func (h *Handler) DeleteLifeEvent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	eventID, err := strconv.ParseInt(chi.URLParam(r, "eventId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(ctx, "DELETE FROM person_events WHERE id = $1", eventID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Special Dates ---

// ListSpecialDates returns all special dates for a person
func (h *Handler) ListSpecialDates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT id, person_id, date_type, label, date, recurring, created_at
		FROM person_dates
		WHERE person_id = $1
		ORDER BY date
	`, personID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	dates := []SpecialDate{}
	for rows.Next() {
		var d SpecialDate
		if err := rows.Scan(&d.ID, &d.PersonID, &d.DateType, &d.Label, &d.Date, &d.Recurring, &d.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		dates = append(dates, d)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dates)
}

// CreateSpecialDate creates a new special date for a person
func (h *Handler) CreateSpecialDate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	var input SpecialDateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Label == "" {
		http.Error(w, "Label is required", http.StatusBadRequest)
		return
	}

	if input.Date == "" {
		http.Error(w, "Date is required", http.StatusBadRequest)
		return
	}

	if input.DateType == "" {
		input.DateType = DateTypeCustom
	}

	var d SpecialDate
	err = h.db.QueryRow(ctx, `
		INSERT INTO person_dates (person_id, date_type, label, date, recurring)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, person_id, date_type, label, date, recurring, created_at
	`, personID, input.DateType, input.Label, input.Date, input.Recurring).Scan(
		&d.ID, &d.PersonID, &d.DateType, &d.Label, &d.Date, &d.Recurring, &d.CreatedAt,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(d)
}

// DeleteSpecialDate deletes a special date
func (h *Handler) DeleteSpecialDate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	dateID, err := strconv.ParseInt(chi.URLParam(r, "dateId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid date ID", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(ctx, "DELETE FROM person_dates WHERE id = $1", dateID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Date not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetUpcomingDates returns all upcoming special dates in the next 30 days
func (h *Handler) GetUpcomingDates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)

	rows, err := h.db.Query(ctx, `
		SELECT pd.id, pd.person_id, p.name, p.nickname, pd.date_type, pd.label, pd.date
		FROM person_dates pd
		JOIN people p ON p.id = pd.person_id
		WHERE pd.recurring = TRUE
		ORDER BY pd.date
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type UpcomingDate struct {
		PersonID   int64           `json:"person_id"`
		PersonName string          `json:"person_name"`
		Nickname   string          `json:"nickname,omitempty"`
		DateType   SpecialDateType `json:"date_type"`
		Label      string          `json:"label"`
		Date       string          `json:"date"`
		DaysUntil  int             `json:"days_until"`
	}

	upcoming := []UpcomingDate{}
	for rows.Next() {
		var d UpcomingDate
		var id int64
		if err := rows.Scan(&id, &d.PersonID, &d.PersonName, &d.Nickname, &d.DateType, &d.Label, &d.Date); err != nil {
			continue
		}

		// Parse MM-DD and calculate days until
		parts := []int{}
		for _, p := range splitDate(d.Date) {
			parts = append(parts, p)
		}
		if len(parts) != 2 {
			continue
		}

		thisYear := time.Date(now.Year(), time.Month(parts[0]), parts[1], 0, 0, 0, 0, time.Local)
		if thisYear.Before(today) {
			thisYear = time.Date(now.Year()+1, time.Month(parts[0]), parts[1], 0, 0, 0, 0, time.Local)
		}

		daysUntil := int(thisYear.Sub(today).Hours() / 24)
		if daysUntil <= 30 {
			d.DaysUntil = daysUntil
			upcoming = append(upcoming, d)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(upcoming)
}

// splitDate splits MM-DD into month and day
func splitDate(date string) []int {
	parts := []int{}
	var current int
	for _, c := range date {
		if c == '-' {
			parts = append(parts, current)
			current = 0
		} else if c >= '0' && c <= '9' {
			current = current*10 + int(c-'0')
		}
	}
	parts = append(parts, current)
	return parts
}

// --- Suggestions ---

// GetSuggestions returns a prioritized list of people to contact
func (h *Handler) GetSuggestions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)

	rows, err := h.db.Query(ctx, `
		SELECT p.id, p.name, p.nickname, p.contact_frequency, p.current_streak, p.birthday,
		       (SELECT MAX(date)::text FROM interactions WHERE person_id = p.id) as last_contact
		FROM people p
		WHERE p.contact_frequency != 'none'
		ORDER BY p.name
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	suggestions := []Suggestion{}
	for rows.Next() {
		var id int64
		var name, nickname string
		var freq ContactFrequency
		var streak int
		var birthday *time.Time
		var lastContact *string

		if err := rows.Scan(&id, &name, &nickname, &freq, &streak, &birthday, &lastContact); err != nil {
			continue
		}

		freqDays := frequencyToDays(freq)
		if freqDays == 0 {
			continue
		}

		priority := 0
		reason := ""

		// Days overdue (weight: 3x)
		if lastContact != nil {
			lastDate, _ := time.Parse("2006-01-02", *lastContact)
			daysSince := int(today.Sub(lastDate).Hours() / 24)
			if daysSince > freqDays {
				overdue := daysSince - freqDays
				priority += overdue * 3
				reason = "Overdue by " + strconv.Itoa(overdue) + " days"
			}
		} else {
			priority += freqDays * 3 // Never contacted = very overdue
			reason = "Never contacted"
		}

		// Streak at risk (weight: 2x)
		if streak > 0 && lastContact != nil {
			lastDate, _ := time.Parse("2006-01-02", *lastContact)
			daysSince := int(today.Sub(lastDate).Hours() / 24)
			if daysSince >= freqDays-2 && daysSince <= freqDays {
				priority += 20 // Streak about to break
				if reason != "" {
					reason += "; "
				}
				reason += "🔥 Streak at risk"
			}
		}

		// Upcoming birthday (weight: 2x)
		if birthday != nil {
			thisYearBday := time.Date(now.Year(), birthday.Month(), birthday.Day(), 0, 0, 0, 0, time.Local)
			if thisYearBday.Before(today) {
				thisYearBday = time.Date(now.Year()+1, birthday.Month(), birthday.Day(), 0, 0, 0, 0, time.Local)
			}
			daysUntil := int(thisYearBday.Sub(today).Hours() / 24)
			if daysUntil <= 7 {
				priority += (7 - daysUntil) * 4
				if reason != "" {
					reason += "; "
				}
				if daysUntil == 0 {
					reason += "🎂 Birthday today!"
				} else {
					reason += "🎂 Birthday in " + strconv.Itoa(daysUntil) + " days"
				}
			}
		}

		if priority > 0 {
			suggestions = append(suggestions, Suggestion{
				ID:       id,
				Name:     name,
				Nickname: nickname,
				Reason:   reason,
				Priority: priority,
			})
		}
	}

	// Sort by priority descending
	for i := 0; i < len(suggestions)-1; i++ {
		for j := i + 1; j < len(suggestions); j++ {
			if suggestions[j].Priority > suggestions[i].Priority {
				suggestions[i], suggestions[j] = suggestions[j], suggestions[i]
			}
		}
	}

	// Limit to top 10
	if len(suggestions) > 10 {
		suggestions = suggestions[:10]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(suggestions)
}

// --- Reconnection ---

// GetReconnect returns people who haven't been contacted in 6+ months
func (h *Handler) GetReconnect(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
	sixMonthsAgo := today.AddDate(0, -6, 0)

	rows, err := h.db.Query(ctx, `
		SELECT p.id, p.name, p.nickname,
		       (SELECT MAX(date)::text FROM interactions WHERE person_id = p.id) as last_contact
		FROM people p
		WHERE p.contact_frequency = 'none' OR p.relationship = 'acquaintance'
		ORDER BY last_contact ASC NULLS FIRST
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	candidates := []ReconnectCandidate{}
	for rows.Next() {
		var id int64
		var name, nickname string
		var lastContact *string

		if err := rows.Scan(&id, &name, &nickname, &lastContact); err != nil {
			continue
		}

		if lastContact == nil {
			candidates = append(candidates, ReconnectCandidate{
				ID:          id,
				Name:        name,
				Nickname:    nickname,
				LastContact: "Never",
				MonthsAgo:   -1,
			})
		} else {
			lastDate, _ := time.Parse("2006-01-02", *lastContact)
			if lastDate.Before(sixMonthsAgo) {
				monthsAgo := int(today.Sub(lastDate).Hours() / 24 / 30)
				candidates = append(candidates, ReconnectCandidate{
					ID:          id,
					Name:        name,
					Nickname:    nickname,
					LastContact: *lastContact,
					MonthsAgo:   monthsAgo,
				})
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(candidates)
}

// --- Location ---

// GetNearby returns people near a given location
func (h *Handler) GetNearby(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	location := r.URL.Query().Get("location")
	if location == "" {
		http.Error(w, "location query parameter required", http.StatusBadRequest)
		return
	}

	// Case-insensitive partial match
	rows, err := h.db.Query(ctx, `
		SELECT id, name, nickname, location
		FROM people
		WHERE LOWER(location) LIKE LOWER($1)
		ORDER BY name
	`, "%"+location+"%")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type NearbyPerson struct {
		ID       int64  `json:"id"`
		Name     string `json:"name"`
		Nickname string `json:"nickname,omitempty"`
		Location string `json:"location"`
	}

	people := []NearbyPerson{}
	for rows.Next() {
		var p NearbyPerson
		if err := rows.Scan(&p.ID, &p.Name, &p.Nickname, &p.Location); err != nil {
			continue
		}
		people = append(people, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(people)
}

// --- Phase 4: Connections ---

// ListConnections returns all connections for a person
func (h *Handler) ListConnections(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT c.id, c.person_a_id, c.person_b_id, c.relationship, c.notes, c.created_at,
		       CASE WHEN c.person_a_id = $1 THEN c.person_b_id ELSE c.person_a_id END as connected_id,
		       CASE WHEN c.person_a_id = $1 THEN pb.name ELSE pa.name END as connected_name
		FROM person_connections c
		JOIN people pa ON pa.id = c.person_a_id
		JOIN people pb ON pb.id = c.person_b_id
		WHERE c.person_a_id = $1 OR c.person_b_id = $1
		ORDER BY c.created_at DESC
	`, personID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	connections := []Connection{}
	for rows.Next() {
		var c Connection
		if err := rows.Scan(&c.ID, &c.PersonAID, &c.PersonBID, &c.Relationship, &c.Notes, &c.CreatedAt,
			&c.ConnectedPersonID, &c.ConnectedPersonName); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		connections = append(connections, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(connections)
}

// CreateConnection creates a mutual connection between two people
func (h *Handler) CreateConnection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personAID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	var input ConnectionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.PersonBID == 0 {
		http.Error(w, "person_b_id is required", http.StatusBadRequest)
		return
	}

	if input.PersonBID == personAID {
		http.Error(w, "Cannot connect a person to themselves", http.StatusBadRequest)
		return
	}

	if input.Relationship == "" {
		input.Relationship = ConnectionFriends
	}

	// Ensure consistent ordering (lower ID first) to avoid duplicates
	aID, bID := personAID, input.PersonBID
	if bID < aID {
		aID, bID = bID, aID
	}

	var c Connection
	err = h.db.QueryRow(ctx, `
		INSERT INTO person_connections (person_a_id, person_b_id, relationship, notes)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (person_a_id, person_b_id) DO UPDATE SET relationship = $3, notes = $4
		RETURNING id, person_a_id, person_b_id, relationship, notes, created_at
	`, aID, bID, input.Relationship, input.Notes).Scan(
		&c.ID, &c.PersonAID, &c.PersonBID, &c.Relationship, &c.Notes, &c.CreatedAt,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get the connected person's name
	if c.PersonAID == personAID {
		c.ConnectedPersonID = c.PersonBID
		h.db.QueryRow(ctx, "SELECT name FROM people WHERE id = $1", c.PersonBID).Scan(&c.ConnectedPersonName)
	} else {
		c.ConnectedPersonID = c.PersonAID
		h.db.QueryRow(ctx, "SELECT name FROM people WHERE id = $1", c.PersonAID).Scan(&c.ConnectedPersonName)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

// DeleteConnection deletes a connection
func (h *Handler) DeleteConnection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	connectionID, err := strconv.ParseInt(chi.URLParam(r, "connectionId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid connection ID", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(ctx, "DELETE FROM person_connections WHERE id = $1", connectionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Connection not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Phase 5: Groups ---

// ListGroups returns all groups
func (h *Handler) ListGroups(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rows, err := h.db.Query(ctx, `
		SELECT g.id, g.name, g.color, g.default_frequency, g.created_at,
		       (SELECT COUNT(*) FROM person_group_members WHERE group_id = g.id) as member_count
		FROM person_groups g
		ORDER BY g.name
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	groups := []Group{}
	for rows.Next() {
		var g Group
		if err := rows.Scan(&g.ID, &g.Name, &g.Color, &g.DefaultFrequency, &g.CreatedAt, &g.MemberCount); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		groups = append(groups, g)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

// GetGroup returns a single group with its members
func (h *Handler) GetGroup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := strconv.ParseInt(chi.URLParam(r, "groupId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var g Group
	err = h.db.QueryRow(ctx, `
		SELECT id, name, color, default_frequency, created_at
		FROM person_groups WHERE id = $1
	`, id).Scan(&g.ID, &g.Name, &g.Color, &g.DefaultFrequency, &g.CreatedAt)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Get members
	rows, err := h.db.Query(ctx, `
		SELECT pgm.id, pgm.group_id, pgm.person_id, p.name, p.nickname, pgm.created_at
		FROM person_group_members pgm
		JOIN people p ON p.id = pgm.person_id
		WHERE pgm.group_id = $1
		ORDER BY p.name
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	members := []GroupMember{}
	for rows.Next() {
		var m GroupMember
		if err := rows.Scan(&m.ID, &m.GroupID, &m.PersonID, &m.Name, &m.Nickname, &m.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		members = append(members, m)
	}

	result := GroupWithMembers{
		Group:   g,
		Members: members,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// CreateGroup creates a new group
func (h *Handler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var input GroupInput

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	if input.Color == "" {
		input.Color = "#6366f1"
	}

	if input.DefaultFrequency == "" {
		input.DefaultFrequency = FrequencyMonthly
	}

	var g Group
	err := h.db.QueryRow(ctx, `
		INSERT INTO person_groups (name, color, default_frequency)
		VALUES ($1, $2, $3)
		RETURNING id, name, color, default_frequency, created_at
	`, input.Name, input.Color, input.DefaultFrequency).Scan(
		&g.ID, &g.Name, &g.Color, &g.DefaultFrequency, &g.CreatedAt,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(g)
}

// UpdateGroup updates a group
func (h *Handler) UpdateGroup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := strconv.ParseInt(chi.URLParam(r, "groupId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var input GroupInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	var g Group
	err = h.db.QueryRow(ctx, `
		UPDATE person_groups SET name = $2, color = $3, default_frequency = $4
		WHERE id = $1
		RETURNING id, name, color, default_frequency, created_at
	`, id, input.Name, input.Color, input.DefaultFrequency).Scan(
		&g.ID, &g.Name, &g.Color, &g.DefaultFrequency, &g.CreatedAt,
	)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(g)
}

// DeleteGroup deletes a group
func (h *Handler) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := strconv.ParseInt(chi.URLParam(r, "groupId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(ctx, "DELETE FROM person_groups WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AddGroupMember adds a person to a group
func (h *Handler) AddGroupMember(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	groupID, err := strconv.ParseInt(chi.URLParam(r, "groupId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	var input struct {
		PersonID int64 `json:"person_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.PersonID == 0 {
		http.Error(w, "person_id is required", http.StatusBadRequest)
		return
	}

	var m GroupMember
	err = h.db.QueryRow(ctx, `
		INSERT INTO person_group_members (group_id, person_id)
		VALUES ($1, $2)
		ON CONFLICT (group_id, person_id) DO NOTHING
		RETURNING id, group_id, person_id, created_at
	`, groupID, input.PersonID).Scan(&m.ID, &m.GroupID, &m.PersonID, &m.CreatedAt)
	if err != nil {
		// Check if it's a conflict (already exists)
		h.db.QueryRow(ctx, `
			SELECT id, group_id, person_id, created_at
			FROM person_group_members
			WHERE group_id = $1 AND person_id = $2
		`, groupID, input.PersonID).Scan(&m.ID, &m.GroupID, &m.PersonID, &m.CreatedAt)
	}

	// Get person name
	h.db.QueryRow(ctx, "SELECT name, nickname FROM people WHERE id = $1", input.PersonID).Scan(&m.Name, &m.Nickname)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(m)
}

// RemoveGroupMember removes a person from a group
func (h *Handler) RemoveGroupMember(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	groupID, err := strconv.ParseInt(chi.URLParam(r, "groupId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	personID, err := strconv.ParseInt(chi.URLParam(r, "personId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(ctx, "DELETE FROM person_group_members WHERE group_id = $1 AND person_id = $2", groupID, personID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Member not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Phase 5: Social Handles ---

// ListSocials returns all social handles for a person
func (h *Handler) ListSocials(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT id, person_id, platform, handle, url, created_at
		FROM person_socials
		WHERE person_id = $1
		ORDER BY platform
	`, personID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	socials := []Social{}
	for rows.Next() {
		var s Social
		if err := rows.Scan(&s.ID, &s.PersonID, &s.Platform, &s.Handle, &s.URL, &s.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		socials = append(socials, s)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(socials)
}

// CreateSocial creates a new social handle for a person
func (h *Handler) CreateSocial(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	var input SocialInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Handle == "" {
		http.Error(w, "Handle is required", http.StatusBadRequest)
		return
	}

	if input.Platform == "" {
		input.Platform = PlatformOther
	}

	// Generate URL if not provided
	if input.URL == "" {
		input.URL = generateSocialURL(input.Platform, input.Handle)
	}

	var s Social
	err = h.db.QueryRow(ctx, `
		INSERT INTO person_socials (person_id, platform, handle, url)
		VALUES ($1, $2, $3, $4)
		RETURNING id, person_id, platform, handle, url, created_at
	`, personID, input.Platform, input.Handle, input.URL).Scan(
		&s.ID, &s.PersonID, &s.Platform, &s.Handle, &s.URL, &s.CreatedAt,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}

// DeleteSocial deletes a social handle
func (h *Handler) DeleteSocial(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	socialID, err := strconv.ParseInt(chi.URLParam(r, "socialId"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid social ID", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(ctx, "DELETE FROM person_socials WHERE id = $1", socialID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Social handle not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// generateSocialURL generates a profile URL for common platforms
func generateSocialURL(platform SocialPlatform, handle string) string {
	handle = strings.TrimPrefix(handle, "@")
	switch platform {
	case PlatformInstagram:
		return "https://instagram.com/" + handle
	case PlatformLinkedIn:
		return "https://linkedin.com/in/" + handle
	case PlatformTwitter:
		return "https://twitter.com/" + handle
	case PlatformFacebook:
		return "https://facebook.com/" + handle
	default:
		return ""
	}
}

// --- Phase 5: Photo Upload ---

// UploadPhoto handles photo upload for a person
func (h *Handler) UploadPhoto(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	personID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid person ID", http.StatusBadRequest)
		return
	}

	// Parse multipart form (max 5MB)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		http.Error(w, "File too large (max 5MB)", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("photo")
	if err != nil {
		http.Error(w, "No photo file provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		http.Error(w, "File must be an image", http.StatusBadRequest)
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "uploads/people"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
		return
	}

	// Generate filename
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	filename := strconv.FormatInt(personID, 10) + "_" + strconv.FormatInt(time.Now().Unix(), 10) + ext
	filePath := filepath.Join(uploadDir, filename)

	// Create file
	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy file
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Update database
	photoURL := "/uploads/people/" + filename
	_, err = h.db.Exec(ctx, "UPDATE people SET photo_url = $1 WHERE id = $2", photoURL, personID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"photo_url": photoURL})
}

// --- Phase 5: Import ---

// ImportPeople imports people from CSV
func (h *Handler) ImportPeople(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Parse multipart form (max 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "No file provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	
	// Read header
	header, err := reader.Read()
	if err != nil {
		http.Error(w, "Failed to read CSV header", http.StatusBadRequest)
		return
	}

	// Map header columns
	colMap := make(map[string]int)
	for i, col := range header {
		colMap[strings.ToLower(strings.TrimSpace(col))] = i
	}

	result := ImportResult{}
	
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			result.Errors = append(result.Errors, "Error reading row: "+err.Error())
			result.Skipped++
			continue
		}

		// Extract fields
		name := getCSVField(record, colMap, "name")
		if name == "" {
			result.Errors = append(result.Errors, "Skipping row: missing name")
			result.Skipped++
			continue
		}

		nickname := getCSVField(record, colMap, "nickname")
		email := getCSVField(record, colMap, "email")
		phone := getCSVField(record, colMap, "phone")
		location := getCSVField(record, colMap, "location")
		notes := getCSVField(record, colMap, "notes")
		
		relationship := RelationshipType(getCSVField(record, colMap, "relationship"))
		if relationship == "" {
			relationship = RelationshipFriend
		}
		
		frequency := ContactFrequency(getCSVField(record, colMap, "contact_frequency"))
		if frequency == "" {
			frequency = FrequencyMonthly
		}

		birthday := getCSVField(record, colMap, "birthday")
		var birthdayPtr *string
		if birthday != "" {
			birthdayPtr = &birthday
		}

		// Insert
		_, err = h.db.Exec(ctx, `
			INSERT INTO people (name, nickname, relationship, email, phone, birthday, location, notes, contact_frequency)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, name, nickname, relationship, email, phone, birthdayPtr, location, notes, frequency)
		
		if err != nil {
			result.Errors = append(result.Errors, "Failed to import "+name+": "+err.Error())
			result.Skipped++
		} else {
			result.Imported++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// getCSVField safely gets a field from a CSV record
func getCSVField(record []string, colMap map[string]int, field string) string {
	if idx, ok := colMap[field]; ok && idx < len(record) {
		return strings.TrimSpace(record[idx])
	}
	return ""
}

// --- Phase 5: Lunar Birthday Conversion ---

// lunarToGregorian converts a lunar date to Gregorian for the current year
// This is a simplified approximation. For accurate conversion, use a proper lunar calendar library.
func (h *Handler) lunarToGregorian(lunarDate string) string {
	// Parse the lunar date (YYYY-MM-DD format)
	t, err := time.Parse("2006-01-02", lunarDate)
	if err != nil {
		return ""
	}

	// Get month and day from lunar date
	lunarMonth := int(t.Month())
	lunarDay := t.Day()
	
	// Simple approximation: Lunar calendar is roughly 10-11 days behind Gregorian
	// For a more accurate conversion, you would need a proper lunar calendar library
	// This approximation adds roughly 30 days to account for the lunar offset
	currentYear := time.Now().Year()
	
	// Approximate Gregorian date (lunar dates are typically 21-51 days ahead of solar)
	// The offset varies by year and month, but we use a fixed offset for simplicity
	approxDate := time.Date(currentYear, time.Month(lunarMonth), lunarDay, 0, 0, 0, 0, time.Local)
	
	// Add approximately 30 days to convert lunar to Gregorian (rough approximation)
	// In reality, this should use proper lunar calendar algorithms like the Chinese Calendar
	gregorianDate := approxDate.Add(30 * 24 * time.Hour)
	
	return gregorianDate.Format("2006-01-02")
}
