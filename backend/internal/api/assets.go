package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Asset struct {
	ID                   int64   `json:"id"`
	Category             string  `json:"category"`
	Name                 string  `json:"name"`
	CurrentValue         float64 `json:"current_value"`
	ExpectedReturn       float64 `json:"expected_return"`
	ExpectedDividend     float64 `json:"expected_dividend"`
	Notes                string  `json:"notes,omitempty"`
	CreatedAt            string  `json:"created_at"`
	UpdatedAt            string  `json:"updated_at"`
}

func (s *Server) listAssets(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `
		SELECT id, category, name, current_value, expected_return, expected_dividend, notes, created_at, updated_at
		FROM assets ORDER BY category, name
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var assets []Asset
	for rows.Next() {
		var a Asset
		err := rows.Scan(&a.ID, &a.Category, &a.Name, &a.CurrentValue, &a.ExpectedReturn, &a.ExpectedDividend, &a.Notes, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		assets = append(assets, a)
	}

	writeJSON(w, http.StatusOK, assets)
}

func (s *Server) createAsset(w http.ResponseWriter, r *http.Request) {
	var a Asset
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	err := s.db.QueryRow(r.Context(), `
		INSERT INTO assets (category, name, current_value, expected_return, expected_dividend, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`, a.Category, a.Name, a.CurrentValue, a.ExpectedReturn, a.ExpectedDividend, a.Notes).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, a)
}

func (s *Server) getAsset(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var a Asset
	err = s.db.QueryRow(r.Context(), `
		SELECT id, category, name, current_value, expected_return, expected_dividend, notes, created_at, updated_at
		FROM assets WHERE id = $1
	`, id).Scan(&a.ID, &a.Category, &a.Name, &a.CurrentValue, &a.ExpectedReturn, &a.ExpectedDividend, &a.Notes, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "asset not found")
		return
	}

	writeJSON(w, http.StatusOK, a)
}

func (s *Server) updateAsset(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var a Asset
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	_, err = s.db.Exec(r.Context(), `
		UPDATE assets SET category = $1, name = $2, current_value = $3, expected_return = $4, expected_dividend = $5, notes = $6, updated_at = NOW()
		WHERE id = $7
	`, a.Category, a.Name, a.CurrentValue, a.ExpectedReturn, a.ExpectedDividend, a.Notes, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	a.ID = id
	writeJSON(w, http.StatusOK, a)
}

func (s *Server) deleteAsset(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	_, err = s.db.Exec(r.Context(), `DELETE FROM assets WHERE id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
