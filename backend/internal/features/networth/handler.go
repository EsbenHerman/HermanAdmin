package networth

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

// --- Assets ---

func (h *Handler) ListAssets(w http.ResponseWriter, r *http.Request) {
	// Get all assets with their latest entry
	rows, err := h.db.Query(r.Context(), `
		SELECT 
			a.id, a.category, a.asset_type, a.name, a.ticker, a.created_at,
			e.id, e.entry_date, e.units, e.unit_value, e.notes, e.created_at
		FROM assets a
		LEFT JOIN LATERAL (
			SELECT * FROM asset_entries 
			WHERE asset_id = a.id 
			ORDER BY entry_date DESC, created_at DESC 
			LIMIT 1
		) e ON true
		ORDER BY a.category, a.name
	`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var assets []AssetWithValue
	for rows.Next() {
		var a AssetWithValue
		var entryID *int64
		var entryUnits, entryUnitValue *float64
		var entryDate *time.Time
		var entryNotes *string
		var entryCreatedAt *time.Time

		err := rows.Scan(
			&a.ID, &a.Category, &a.AssetType, &a.Name, &a.Ticker, &a.CreatedAt,
			&entryID, &entryDate, &entryUnits, &entryUnitValue, &entryNotes, &entryCreatedAt,
		)
		if err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if entryID != nil {
			a.LatestEntry = &AssetEntry{
				ID:        *entryID,
				AssetID:   a.ID,
				EntryDate: entryDate.Format("2006-01-02"),
				Units:     *entryUnits,
				UnitValue: *entryUnitValue,
				Notes:     *entryNotes,
				CreatedAt: *entryCreatedAt,
			}
			a.TotalValue = a.LatestEntry.Units * a.LatestEntry.UnitValue
		}

		assets = append(assets, a)
	}

	core.WriteJSON(w, http.StatusOK, assets)
}

type CreateAssetRequest struct {
	Category  string  `json:"category"`
	AssetType string  `json:"asset_type"`
	Name      string  `json:"name"`
	Ticker    *string `json:"ticker,omitempty"`
	// Initial entry
	EntryDate string  `json:"entry_date"`
	Units     float64 `json:"units"`
	UnitValue float64 `json:"unit_value"`
	Notes     string  `json:"notes,omitempty"`
}

func (h *Handler) CreateAsset(w http.ResponseWriter, r *http.Request) {
	var req CreateAssetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.AssetType == "" {
		req.AssetType = "manual"
	}
	if req.EntryDate == "" {
		req.EntryDate = time.Now().Format("2006-01-02")
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback(r.Context())

	// Insert asset
	var asset Asset
	err = tx.QueryRow(r.Context(), `
		INSERT INTO assets (category, asset_type, name, ticker)
		VALUES ($1, $2, $3, $4)
		RETURNING id, category, asset_type, name, ticker, created_at
	`, req.Category, req.AssetType, req.Name, req.Ticker).Scan(
		&asset.ID, &asset.Category, &asset.AssetType, &asset.Name, &asset.Ticker, &asset.CreatedAt,
	)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Insert initial entry
	var entry AssetEntry
	var entryDate time.Time
	err = tx.QueryRow(r.Context(), `
		INSERT INTO asset_entries (asset_id, entry_date, units, unit_value, notes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, asset_id, entry_date, units, unit_value, notes, created_at
	`, asset.ID, req.EntryDate, req.Units, req.UnitValue, req.Notes).Scan(
		&entry.ID, &entry.AssetID, &entryDate, &entry.Units, &entry.UnitValue, &entry.Notes, &entry.CreatedAt,
	)
	entry.EntryDate = entryDate.Format("2006-01-02")
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	result := AssetWithValue{
		Asset:       asset,
		LatestEntry: &entry,
		TotalValue:  entry.Units * entry.UnitValue,
	}

	core.WriteJSON(w, http.StatusCreated, result)
}

func (h *Handler) GetAsset(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var a Asset
	err = h.db.QueryRow(r.Context(), `
		SELECT id, category, asset_type, name, ticker, created_at
		FROM assets WHERE id = $1
	`, id).Scan(&a.ID, &a.Category, &a.AssetType, &a.Name, &a.Ticker, &a.CreatedAt)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "asset not found")
		return
	}

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

// --- Asset Entries ---

func (h *Handler) ListAssetEntries(w http.ResponseWriter, r *http.Request) {
	assetID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid asset id")
		return
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT id, asset_id, entry_date, units, unit_value, notes, created_at
		FROM asset_entries
		WHERE asset_id = $1
		ORDER BY entry_date DESC, created_at DESC
	`, assetID)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var entries []AssetEntry
	for rows.Next() {
		var e AssetEntry
		var entryDate time.Time
		if err := rows.Scan(&e.ID, &e.AssetID, &entryDate, &e.Units, &e.UnitValue, &e.Notes, &e.CreatedAt); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		e.EntryDate = entryDate.Format("2006-01-02")
		entries = append(entries, e)
	}

	core.WriteJSON(w, http.StatusOK, entries)
}

type CreateAssetEntryRequest struct {
	EntryDate string  `json:"entry_date"`
	Units     float64 `json:"units"`
	UnitValue float64 `json:"unit_value"`
	Notes     string  `json:"notes,omitempty"`
}

func (h *Handler) CreateAssetEntry(w http.ResponseWriter, r *http.Request) {
	assetID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid asset id")
		return
	}

	var req CreateAssetEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.EntryDate == "" {
		req.EntryDate = time.Now().Format("2006-01-02")
	}

	var entry AssetEntry
	var entryDate time.Time
	err = h.db.QueryRow(r.Context(), `
		INSERT INTO asset_entries (asset_id, entry_date, units, unit_value, notes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, asset_id, entry_date, units, unit_value, notes, created_at
	`, assetID, req.EntryDate, req.Units, req.UnitValue, req.Notes).Scan(
		&entry.ID, &entry.AssetID, &entryDate, &entry.Units, &entry.UnitValue, &entry.Notes, &entry.CreatedAt,
	)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	entry.EntryDate = entryDate.Format("2006-01-02")

	core.WriteJSON(w, http.StatusCreated, entry)
}

func (h *Handler) UpdateAssetEntry(w http.ResponseWriter, r *http.Request) {
	assetID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid asset id")
		return
	}
	entryID, err := strconv.ParseInt(chi.URLParam(r, "entryId"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid entry id")
		return
	}

	var req CreateAssetEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	var entry AssetEntry
	var entryDate time.Time
	err = h.db.QueryRow(r.Context(), `
		UPDATE asset_entries 
		SET entry_date = $1, units = $2, unit_value = $3, notes = $4
		WHERE id = $5 AND asset_id = $6
		RETURNING id, asset_id, entry_date, units, unit_value, notes, created_at
	`, req.EntryDate, req.Units, req.UnitValue, req.Notes, entryID, assetID).Scan(
		&entry.ID, &entry.AssetID, &entryDate, &entry.Units, &entry.UnitValue, &entry.Notes, &entry.CreatedAt,
	)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "entry not found")
		return
	}
	entry.EntryDate = entryDate.Format("2006-01-02")

	core.WriteJSON(w, http.StatusOK, entry)
}

func (h *Handler) DeleteAssetEntry(w http.ResponseWriter, r *http.Request) {
	assetID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid asset id")
		return
	}
	entryID, err := strconv.ParseInt(chi.URLParam(r, "entryId"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid entry id")
		return
	}

	result, err := h.db.Exec(r.Context(), `DELETE FROM asset_entries WHERE id = $1 AND asset_id = $2`, entryID, assetID)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if result.RowsAffected() == 0 {
		core.WriteError(w, http.StatusNotFound, "entry not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Debts ---

func (h *Handler) ListDebts(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT 
			d.id, d.name, d.interest_rate, d.created_at,
			e.id, e.entry_date, e.principal, e.monthly_payment, e.notes, e.created_at
		FROM debts d
		LEFT JOIN LATERAL (
			SELECT * FROM debt_entries 
			WHERE debt_id = d.id 
			ORDER BY entry_date DESC, created_at DESC 
			LIMIT 1
		) e ON true
		ORDER BY d.name
	`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var debts []DebtWithValue
	for rows.Next() {
		var d DebtWithValue
		var entryID *int64
		var entryDate *time.Time
		var entryNotes *string
		var entryPrincipal, entryMonthlyPayment *float64
		var entryCreatedAt *time.Time

		err := rows.Scan(
			&d.ID, &d.Name, &d.InterestRate, &d.CreatedAt,
			&entryID, &entryDate, &entryPrincipal, &entryMonthlyPayment, &entryNotes, &entryCreatedAt,
		)
		if err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if entryID != nil {
			d.LatestEntry = &DebtEntry{
				ID:             *entryID,
				DebtID:         d.ID,
				EntryDate:      entryDate.Format("2006-01-02"),
				Principal:      *entryPrincipal,
				MonthlyPayment: *entryMonthlyPayment,
				Notes:          *entryNotes,
				CreatedAt:      *entryCreatedAt,
			}
		}

		debts = append(debts, d)
	}

	core.WriteJSON(w, http.StatusOK, debts)
}

type CreateDebtRequest struct {
	Name         string  `json:"name"`
	InterestRate float64 `json:"interest_rate"`
	// Initial entry
	EntryDate      string  `json:"entry_date"`
	Principal      float64 `json:"principal"`
	MonthlyPayment float64 `json:"monthly_payment"`
	Notes          string  `json:"notes,omitempty"`
}

func (h *Handler) CreateDebt(w http.ResponseWriter, r *http.Request) {
	var req CreateDebtRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.EntryDate == "" {
		req.EntryDate = time.Now().Format("2006-01-02")
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback(r.Context())

	var debt Debt
	err = tx.QueryRow(r.Context(), `
		INSERT INTO debts (name, interest_rate)
		VALUES ($1, $2)
		RETURNING id, name, interest_rate, created_at
	`, req.Name, req.InterestRate).Scan(&debt.ID, &debt.Name, &debt.InterestRate, &debt.CreatedAt)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var entry DebtEntry
	var entryDate time.Time
	err = tx.QueryRow(r.Context(), `
		INSERT INTO debt_entries (debt_id, entry_date, principal, monthly_payment, notes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, debt_id, entry_date, principal, monthly_payment, notes, created_at
	`, debt.ID, req.EntryDate, req.Principal, req.MonthlyPayment, req.Notes).Scan(
		&entry.ID, &entry.DebtID, &entryDate, &entry.Principal, &entry.MonthlyPayment, &entry.Notes, &entry.CreatedAt,
	)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	entry.EntryDate = entryDate.Format("2006-01-02")

	if err := tx.Commit(r.Context()); err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	result := DebtWithValue{
		Debt:        debt,
		LatestEntry: &entry,
	}

	core.WriteJSON(w, http.StatusCreated, result)
}

func (h *Handler) GetDebt(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var d Debt
	err = h.db.QueryRow(r.Context(), `
		SELECT id, name, interest_rate, created_at
		FROM debts WHERE id = $1
	`, id).Scan(&d.ID, &d.Name, &d.InterestRate, &d.CreatedAt)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "debt not found")
		return
	}

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

// --- Debt Entries ---

func (h *Handler) ListDebtEntries(w http.ResponseWriter, r *http.Request) {
	debtID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid debt id")
		return
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT id, debt_id, entry_date, principal, monthly_payment, notes, created_at
		FROM debt_entries
		WHERE debt_id = $1
		ORDER BY entry_date DESC, created_at DESC
	`, debtID)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var entries []DebtEntry
	for rows.Next() {
		var e DebtEntry
		var entryDate time.Time
		if err := rows.Scan(&e.ID, &e.DebtID, &entryDate, &e.Principal, &e.MonthlyPayment, &e.Notes, &e.CreatedAt); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		e.EntryDate = entryDate.Format("2006-01-02")
		entries = append(entries, e)
	}

	core.WriteJSON(w, http.StatusOK, entries)
}

type CreateDebtEntryRequest struct {
	EntryDate      string  `json:"entry_date"`
	Principal      float64 `json:"principal"`
	MonthlyPayment float64 `json:"monthly_payment"`
	Notes          string  `json:"notes,omitempty"`
}

func (h *Handler) CreateDebtEntry(w http.ResponseWriter, r *http.Request) {
	debtID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid debt id")
		return
	}

	var req CreateDebtEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.EntryDate == "" {
		req.EntryDate = time.Now().Format("2006-01-02")
	}

	var entry DebtEntry
	var entryDate time.Time
	err = h.db.QueryRow(r.Context(), `
		INSERT INTO debt_entries (debt_id, entry_date, principal, monthly_payment, notes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, debt_id, entry_date, principal, monthly_payment, notes, created_at
	`, debtID, req.EntryDate, req.Principal, req.MonthlyPayment, req.Notes).Scan(
		&entry.ID, &entry.DebtID, &entryDate, &entry.Principal, &entry.MonthlyPayment, &entry.Notes, &entry.CreatedAt,
	)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	entry.EntryDate = entryDate.Format("2006-01-02")

	core.WriteJSON(w, http.StatusCreated, entry)
}

func (h *Handler) UpdateDebtEntry(w http.ResponseWriter, r *http.Request) {
	debtID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid debt id")
		return
	}
	entryID, err := strconv.ParseInt(chi.URLParam(r, "entryId"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid entry id")
		return
	}

	var req CreateDebtEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		core.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	var entry DebtEntry
	var entryDate time.Time
	err = h.db.QueryRow(r.Context(), `
		UPDATE debt_entries 
		SET entry_date = $1, principal = $2, monthly_payment = $3, notes = $4
		WHERE id = $5 AND debt_id = $6
		RETURNING id, debt_id, entry_date, principal, monthly_payment, notes, created_at
	`, req.EntryDate, req.Principal, req.MonthlyPayment, req.Notes, entryID, debtID).Scan(
		&entry.ID, &entry.DebtID, &entryDate, &entry.Principal, &entry.MonthlyPayment, &entry.Notes, &entry.CreatedAt,
	)
	if err != nil {
		core.WriteError(w, http.StatusNotFound, "entry not found")
		return
	}
	entry.EntryDate = entryDate.Format("2006-01-02")

	core.WriteJSON(w, http.StatusOK, entry)
}

func (h *Handler) DeleteDebtEntry(w http.ResponseWriter, r *http.Request) {
	debtID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid debt id")
		return
	}
	entryID, err := strconv.ParseInt(chi.URLParam(r, "entryId"), 10, 64)
	if err != nil {
		core.WriteError(w, http.StatusBadRequest, "invalid entry id")
		return
	}

	result, err := h.db.Exec(r.Context(), `DELETE FROM debt_entries WHERE id = $1 AND debt_id = $2`, entryID, debtID)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if result.RowsAffected() == 0 {
		core.WriteError(w, http.StatusNotFound, "entry not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Dashboard ---

func (h *Handler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	asOfDate := r.URL.Query().Get("as_of")
	if asOfDate == "" {
		asOfDate = time.Now().Format("2006-01-02")
	}

	// Get total assets as of date
	var totalAssets float64
	err := h.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(e.units * e.unit_value), 0)
		FROM assets a
		JOIN LATERAL (
			SELECT units, unit_value FROM asset_entries 
			WHERE asset_id = a.id AND entry_date <= $1
			ORDER BY entry_date DESC, created_at DESC 
			LIMIT 1
		) e ON true
	`, asOfDate).Scan(&totalAssets)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get total debt as of date
	var totalDebt float64
	err = h.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(e.principal), 0)
		FROM debts d
		JOIN LATERAL (
			SELECT principal FROM debt_entries 
			WHERE debt_id = d.id AND entry_date <= $1
			ORDER BY entry_date DESC, created_at DESC 
			LIMIT 1
		) e ON true
	`, asOfDate).Scan(&totalDebt)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get breakdown by category
	rows, err := h.db.Query(r.Context(), `
		SELECT a.category, COALESCE(SUM(e.units * e.unit_value), 0) as total
		FROM assets a
		JOIN LATERAL (
			SELECT units, unit_value FROM asset_entries 
			WHERE asset_id = a.id AND entry_date <= $1
			ORDER BY entry_date DESC, created_at DESC 
			LIMIT 1
		) e ON true
		GROUP BY a.category
	`, asOfDate)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	byCategory := make(map[string]float64)
	for rows.Next() {
		var cat string
		var total float64
		if err := rows.Scan(&cat, &total); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		byCategory[cat] = total
	}

	dashboard := Dashboard{
		TotalAssets: totalAssets,
		TotalDebt:   totalDebt,
		NetWorth:    totalAssets - totalDebt,
		AsOfDate:    asOfDate,
		ByCategory:  byCategory,
	}

	core.WriteJSON(w, http.StatusOK, dashboard)
}

// GetHistory returns net worth history over time
func (h *Handler) GetHistory(w http.ResponseWriter, r *http.Request) {
	// Get all unique dates from entries
	rows, err := h.db.Query(r.Context(), `
		SELECT DISTINCT entry_date FROM (
			SELECT entry_date FROM asset_entries
			UNION
			SELECT entry_date FROM debt_entries
		) dates
		ORDER BY entry_date ASC
	`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var dates []string
	for rows.Next() {
		var d time.Time
		if err := rows.Scan(&d); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		dates = append(dates, d.Format("2006-01-02"))
	}

	var history []NetWorthDataPoint
	for _, date := range dates {
		// Calculate totals as of each date
		var totalAssets float64
		h.db.QueryRow(r.Context(), `
			SELECT COALESCE(SUM(e.units * e.unit_value), 0)
			FROM assets a
			JOIN LATERAL (
				SELECT units, unit_value FROM asset_entries 
				WHERE asset_id = a.id AND entry_date <= $1
				ORDER BY entry_date DESC, created_at DESC 
				LIMIT 1
			) e ON true
		`, date).Scan(&totalAssets)

		var totalDebt float64
		h.db.QueryRow(r.Context(), `
			SELECT COALESCE(SUM(e.principal), 0)
			FROM debts d
			JOIN LATERAL (
				SELECT principal FROM debt_entries 
				WHERE debt_id = d.id AND entry_date <= $1
				ORDER BY entry_date DESC, created_at DESC 
				LIMIT 1
			) e ON true
		`, date).Scan(&totalDebt)

		history = append(history, NetWorthDataPoint{
			Date:        date,
			TotalAssets: totalAssets,
			TotalDebt:   totalDebt,
			NetWorth:    totalAssets - totalDebt,
		})
	}

	core.WriteJSON(w, http.StatusOK, history)
}

// GetDetailedHistory returns net worth history with per-item breakdown
func (h *Handler) GetDetailedHistory(w http.ResponseWriter, r *http.Request) {
	// Get all unique dates from entries
	rows, err := h.db.Query(r.Context(), `
		SELECT DISTINCT entry_date FROM (
			SELECT entry_date FROM asset_entries
			UNION
			SELECT entry_date FROM debt_entries
		) dates
		ORDER BY entry_date ASC
	`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var dates []string
	for rows.Next() {
		var d time.Time
		if err := rows.Scan(&d); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		dates = append(dates, d.Format("2006-01-02"))
	}

	// Get all asset names
	assetRows, err := h.db.Query(r.Context(), `SELECT id, name FROM assets ORDER BY name`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer assetRows.Close()

	type assetInfo struct {
		ID   int64
		Name string
	}
	var assets []assetInfo
	var assetNames []string
	for assetRows.Next() {
		var a assetInfo
		if err := assetRows.Scan(&a.ID, &a.Name); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		assets = append(assets, a)
		assetNames = append(assetNames, a.Name)
	}

	// Get all debt names
	debtRows, err := h.db.Query(r.Context(), `SELECT id, name FROM debts ORDER BY name`)
	if err != nil {
		core.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer debtRows.Close()

	type debtInfo struct {
		ID   int64
		Name string
	}
	var debts []debtInfo
	var debtNames []string
	for debtRows.Next() {
		var d debtInfo
		if err := debtRows.Scan(&d.ID, &d.Name); err != nil {
			core.WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		debts = append(debts, d)
		debtNames = append(debtNames, d.Name)
	}

	var history []DetailedHistoryDataPoint
	for _, date := range dates {
		point := DetailedHistoryDataPoint{
			Date:   date,
			Assets: make(map[string]float64),
			Debts:  make(map[string]float64),
		}

		// Get each asset's value as of date
		for _, asset := range assets {
			var value float64
			err := h.db.QueryRow(r.Context(), `
				SELECT COALESCE(units * unit_value, 0)
				FROM asset_entries 
				WHERE asset_id = $1 AND entry_date <= $2
				ORDER BY entry_date DESC, created_at DESC 
				LIMIT 1
			`, asset.ID, date).Scan(&value)
			if err == nil && value > 0 {
				point.Assets[asset.Name] = value
				point.TotalAssets += value
			}
		}

		// Get each debt's value as of date
		for _, debt := range debts {
			var value float64
			err := h.db.QueryRow(r.Context(), `
				SELECT COALESCE(principal, 0)
				FROM debt_entries 
				WHERE debt_id = $1 AND entry_date <= $2
				ORDER BY entry_date DESC, created_at DESC 
				LIMIT 1
			`, debt.ID, date).Scan(&value)
			if err == nil && value > 0 {
				point.Debts[debt.Name] = value
				point.TotalDebt += value
			}
		}

		point.NetWorth = point.TotalAssets - point.TotalDebt
		history = append(history, point)
	}

	response := DetailedHistoryResponse{
		History:    history,
		AssetNames: assetNames,
		DebtNames:  debtNames,
	}

	core.WriteJSON(w, http.StatusOK, response)
}
