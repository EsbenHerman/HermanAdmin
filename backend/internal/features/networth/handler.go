package networth

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"

	"github.com/EsbenHerman/HermanAdmin/backend/internal/core"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler handles net worth related HTTP requests
type Handler struct {
	db *pgxpool.Pool
}

// NewHandler creates a new net worth handler
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// --- Assets ---

func (h *Handler) ListAssets(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT id, category, name, current_value, expected_return, expected_dividend, notes, created_at, updated_at
		FROM assets ORDER BY category, name
	`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var assets []Asset
	for rows.Next() {
		var a Asset
		err := rows.Scan(&a.ID, &a.Category, &a.Name, &a.CurrentValue, &a.ExpectedReturn, &a.ExpectedDividend, &a.Notes, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		assets = append(assets, a)
	}

	core.WriteJSON(w, http.StatusOK, assets)
}

func (h *Handler) CreateAsset(w http.ResponseWriter, r *http.Request) {
	var a Asset
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	err := h.db.QueryRow(r.Context(), `
		INSERT INTO assets (category, name, current_value, expected_return, expected_dividend, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`, a.Category, a.Name, a.CurrentValue, a.ExpectedReturn, a.ExpectedDividend, a.Notes).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	core.WriteJSON(w, http.StatusCreated, a)
}

func (h *Handler) GetAsset(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var a Asset
	err = h.db.QueryRow(r.Context(), `
		SELECT id, category, name, current_value, expected_return, expected_dividend, notes, created_at, updated_at
		FROM assets WHERE id = $1
	`, id).Scan(&a.ID, &a.Category, &a.Name, &a.CurrentValue, &a.ExpectedReturn, &a.ExpectedDividend, &a.Notes, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "asset not found")
		return
	}

	core.WriteJSON(w, http.StatusOK, a)
}

func (h *Handler) UpdateAsset(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var a Asset
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	_, err = h.db.Exec(r.Context(), `
		UPDATE assets SET category = $1, name = $2, current_value = $3, expected_return = $4, expected_dividend = $5, notes = $6, updated_at = NOW()
		WHERE id = $7
	`, a.Category, a.Name, a.CurrentValue, a.ExpectedReturn, a.ExpectedDividend, a.Notes, id)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	a.ID = id
	core.WriteJSON(w, http.StatusOK, a)
}

func (h *Handler) DeleteAsset(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid id")
		return
	}

	_, err = h.db.Exec(r.Context(), `DELETE FROM assets WHERE id = $1`, id)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Debts ---

func (h *Handler) ListDebts(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, principal, interest_rate, monthly_payment, remaining_term, notes, created_at, updated_at
		FROM debts ORDER BY principal DESC
	`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var debts []Debt
	for rows.Next() {
		var d Debt
		err := rows.Scan(&d.ID, &d.Name, &d.Principal, &d.InterestRate, &d.MonthlyPayment, &d.RemainingTerm, &d.Notes, &d.CreatedAt, &d.UpdatedAt)
		if err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		debts = append(debts, d)
	}

	core.WriteJSON(w, http.StatusOK, debts)
}

func (h *Handler) CreateDebt(w http.ResponseWriter, r *http.Request) {
	var d Debt
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	err := h.db.QueryRow(r.Context(), `
		INSERT INTO debts (name, principal, interest_rate, monthly_payment, remaining_term, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`, d.Name, d.Principal, d.InterestRate, d.MonthlyPayment, d.RemainingTerm, d.Notes).Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	core.WriteJSON(w, http.StatusCreated, d)
}

func (h *Handler) GetDebt(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var d Debt
	err = h.db.QueryRow(r.Context(), `
		SELECT id, name, principal, interest_rate, monthly_payment, remaining_term, notes, created_at, updated_at
		FROM debts WHERE id = $1
	`, id).Scan(&d.ID, &d.Name, &d.Principal, &d.InterestRate, &d.MonthlyPayment, &d.RemainingTerm, &d.Notes, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "debt not found")
		return
	}

	core.WriteJSON(w, http.StatusOK, d)
}

func (h *Handler) UpdateDebt(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var d Debt
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	_, err = h.db.Exec(r.Context(), `
		UPDATE debts SET name = $1, principal = $2, interest_rate = $3, monthly_payment = $4, remaining_term = $5, notes = $6, updated_at = NOW()
		WHERE id = $7
	`, d.Name, d.Principal, d.InterestRate, d.MonthlyPayment, d.RemainingTerm, d.Notes, id)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	d.ID = id
	core.WriteJSON(w, http.StatusOK, d)
}

func (h *Handler) DeleteDebt(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid id")
		return
	}

	_, err = h.db.Exec(r.Context(), `DELETE FROM debts WHERE id = $1`, id)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Dashboard ---

func (h *Handler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	// Get total assets
	var totalAssets, projectedReturn, projectedDividend float64
	err := h.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(current_value), 0), 
		       COALESCE(SUM(current_value * expected_return / 100), 0),
		       COALESCE(SUM(current_value * expected_dividend / 100), 0)
		FROM assets
	`).Scan(&totalAssets, &projectedReturn, &projectedDividend)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get total debt
	var totalDebt float64
	err = h.db.QueryRow(r.Context(), `SELECT COALESCE(SUM(principal), 0) FROM debts`).Scan(&totalDebt)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	dashboard := Dashboard{
		TotalAssets:        totalAssets,
		TotalDebt:          totalDebt,
		NetWorth:           totalAssets - totalDebt,
		ProjectedReturn:    projectedReturn,
		ProjectedDividend:  projectedDividend,
		TotalPassiveIncome: projectedReturn + projectedDividend,
		TargetIncome:       1000000, // 1M SEK
	}

	dashboard.GapToTarget = dashboard.TargetIncome - dashboard.TotalPassiveIncome

	// Calculate years to target for each scenario
	if dashboard.TotalPassiveIncome >= dashboard.TargetIncome {
		dashboard.Scenarios.BestCase = 0
		dashboard.Scenarios.NeutralCase = 0
		dashboard.Scenarios.WorstCase = 0
	} else if dashboard.TotalPassiveIncome > 0 {
		dashboard.Scenarios.BestCase = math.Log(dashboard.TargetIncome/dashboard.TotalPassiveIncome) / math.Log(1.08)
		dashboard.Scenarios.NeutralCase = math.Log(dashboard.TargetIncome/dashboard.TotalPassiveIncome) / math.Log(1.05)
		dashboard.Scenarios.WorstCase = math.Log(dashboard.TargetIncome/dashboard.TotalPassiveIncome) / math.Log(1.02)
	} else {
		dashboard.Scenarios.BestCase = -1    // infinite
		dashboard.Scenarios.NeutralCase = -1 // infinite
		dashboard.Scenarios.WorstCase = -1   // infinite
	}

	core.WriteJSON(w, http.StatusOK, dashboard)
}
