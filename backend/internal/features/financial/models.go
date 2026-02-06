package financial

import "time"

// Asset represents a financial asset (metadata only)
type Asset struct {
	ID        int64     `json:"id"`
	Category  string    `json:"category"`
	AssetType string    `json:"asset_type"` // 'stock' or 'manual'
	Name      string    `json:"name"`
	Ticker    *string   `json:"ticker,omitempty"` // for stocks
	Currency  string    `json:"currency"`         // ISO 4217 code (SEK, USD, EUR, etc.)
	CreatedAt time.Time `json:"created_at"`
}

// AssetEntry represents a point-in-time value for an asset
type AssetEntry struct {
	ID        int64     `json:"id"`
	AssetID   int64     `json:"asset_id"`
	EntryDate string    `json:"entry_date"` // YYYY-MM-DD
	Units     float64   `json:"units"`      // shares for stocks, 1 for manual
	UnitValue float64   `json:"unit_value"` // price per unit (for manual assets or fallback)
	Notes     string    `json:"notes,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// AssetPrice represents a historical price point for an asset (from API or manual)
type AssetPrice struct {
	ID        int64     `json:"id"`
	AssetID   int64     `json:"asset_id"`
	PriceDate string    `json:"price_date"` // YYYY-MM-DD
	UnitValue float64   `json:"unit_value"` // price per unit in asset's currency
	Source    string    `json:"source"`     // 'manual', 'yahoo', etc.
	CreatedAt time.Time `json:"created_at"`
}

// PriceUpdateResult represents the result of updating a single asset's price
type PriceUpdateResult struct {
	AssetID  int64   `json:"asset_id"`
	Ticker   string  `json:"ticker"`
	Price    float64 `json:"price,omitempty"`
	Currency string  `json:"currency,omitempty"`
	Success  bool    `json:"success"`
	Error    string  `json:"error,omitempty"`
}

// AssetWithValue combines asset metadata with its current/latest value
type AssetWithValue struct {
	Asset
	LatestEntry *AssetEntry `json:"latest_entry,omitempty"`
	TotalValue  float64     `json:"total_value"`
}

// Debt represents a financial liability (metadata only)
type Debt struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Currency     string    `json:"currency"` // ISO 4217 code (SEK, USD, EUR, etc.)
	InterestRate float64   `json:"interest_rate"`
	CreatedAt    time.Time `json:"created_at"`
}

// DebtEntry represents a point-in-time value for a debt
type DebtEntry struct {
	ID             int64     `json:"id"`
	DebtID         int64     `json:"debt_id"`
	EntryDate      string    `json:"entry_date"` // YYYY-MM-DD
	Principal      float64   `json:"principal"`  // remaining principal
	MonthlyPayment float64   `json:"monthly_payment"`
	Notes          string    `json:"notes,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// DebtWithValue combines debt metadata with its current/latest value
type DebtWithValue struct {
	Debt
	LatestEntry *DebtEntry `json:"latest_entry,omitempty"`
}

// CurrencyRate represents a currency's exchange rate to SEK
type CurrencyRate struct {
	Currency  string    `json:"currency"`
	SEKRate   float64   `json:"sek_rate"` // 1 unit of currency = X SEK
	UpdatedAt time.Time `json:"updated_at"`
}

// Dashboard represents the net worth dashboard summary
type Dashboard struct {
	TotalAssets    float64            `json:"total_assets"`     // in SEK
	TotalDebt      float64            `json:"total_debt"`       // in SEK
	NetWorth       float64            `json:"net_worth"`        // in SEK
	AsOfDate       string             `json:"as_of_date"`
	ByCategory     map[string]float64 `json:"by_category"`      // in SEK
	DisplayCurrency string            `json:"display_currency"` // always "SEK"
	History        []NetWorthDataPoint `json:"history,omitempty"`
}

// NetWorthDataPoint represents a single point in the net worth history
type NetWorthDataPoint struct {
	Date        string  `json:"date"`
	TotalAssets float64 `json:"total_assets"`
	TotalDebt   float64 `json:"total_debt"`
	NetWorth    float64 `json:"net_worth"`
}

// DetailedHistoryDataPoint represents a single point with per-item breakdown
type DetailedHistoryDataPoint struct {
	Date        string             `json:"date"`
	TotalAssets float64            `json:"total_assets"`
	TotalDebt   float64            `json:"total_debt"`
	NetWorth    float64            `json:"net_worth"`
	Assets      map[string]float64 `json:"assets"`      // asset name -> value
	Debts       map[string]float64 `json:"debts"`       // debt name -> value (positive number, displayed as negative)
}

// DetailedHistoryResponse contains history with item names for legend
type DetailedHistoryResponse struct {
	History    []DetailedHistoryDataPoint `json:"history"`
	AssetNames []string                   `json:"asset_names"`
	DebtNames  []string                   `json:"debt_names"`
}
