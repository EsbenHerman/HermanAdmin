package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Debt struct {
	ID             int64   `json:"id"`
	Name           string  `json:"name"`
	Principal      float64 `json:"principal"`
	InterestRate   float64 `json:"interest_rate"`
	MonthlyPayment float64 `json:"monthly_payment"`
	RemainingTerm  int     `json:"remaining_term"` // months
	Notes          string  `json:"notes,omitempty"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
}

func (s *Server) listDebts(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `
		SELECT id, name, principal, interest_rate, monthly_payment, remaining_term, notes, created_at, updated_at
		FROM debts ORDER BY principal DESC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var debts []Debt
	for rows.Next() {
		var d Debt
		err := rows.Scan(&d.ID, &d.Name, &d.Principal, &d.InterestRate, &d.MonthlyPayment, &d.RemainingTerm, &d.Notes, &d.CreatedAt, &d.UpdatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		debts = append(debts, d)
	}

	writeJSON(w, http.StatusOK, debts)
}

func (s *Server) createDebt(w http.ResponseWriter, r *http.Request) {
	var d Debt
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	err := s.db.QueryRow(r.Context(), `
		INSERT INTO debts (name, principal, interest_rate, monthly_payment, remaining_term, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`, d.Name, d.Principal, d.InterestRate, d.MonthlyPayment, d.RemainingTerm, d.Notes).Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, d)
}

func (s *Server) getDebt(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var d Debt
	err = s.db.QueryRow(r.Context(), `
		SELECT id, name, principal, interest_rate, monthly_payment, remaining_term, notes, created_at, updated_at
		FROM debts WHERE id = $1
	`, id).Scan(&d.ID, &d.Name, &d.Principal, &d.InterestRate, &d.MonthlyPayment, &d.RemainingTerm, &d.Notes, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "debt not found")
		return
	}

	writeJSON(w, http.StatusOK, d)
}

func (s *Server) updateDebt(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var d Debt
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	_, err = s.db.Exec(r.Context(), `
		UPDATE debts SET name = $1, principal = $2, interest_rate = $3, monthly_payment = $4, remaining_term = $5, notes = $6, updated_at = NOW()
		WHERE id = $7
	`, d.Name, d.Principal, d.InterestRate, d.MonthlyPayment, d.RemainingTerm, d.Notes, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	d.ID = id
	writeJSON(w, http.StatusOK, d)
}

func (s *Server) deleteDebt(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	_, err = s.db.Exec(r.Context(), `DELETE FROM debts WHERE id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
