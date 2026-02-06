package networth

// Asset represents a financial asset
type Asset struct {
	ID               int64   `json:"id"`
	Category         string  `json:"category"`
	Name             string  `json:"name"`
	CurrentValue     float64 `json:"current_value"`
	ExpectedReturn   float64 `json:"expected_return"`
	ExpectedDividend float64 `json:"expected_dividend"`
	Notes            string  `json:"notes,omitempty"`
	CreatedAt        string  `json:"created_at"`
	UpdatedAt        string  `json:"updated_at"`
}

// Debt represents a financial liability
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

// Dashboard represents the net worth dashboard summary
type Dashboard struct {
	TotalAssets        float64 `json:"total_assets"`
	TotalDebt          float64 `json:"total_debt"`
	NetWorth           float64 `json:"net_worth"`
	ProjectedReturn    float64 `json:"projected_return"`
	ProjectedDividend  float64 `json:"projected_dividend"`
	TotalPassiveIncome float64 `json:"total_passive_income"`
	TargetIncome       float64 `json:"target_income"`
	GapToTarget        float64 `json:"gap_to_target"`
	Scenarios          struct {
		BestCase    float64 `json:"best_case"`    // years to target at 8%
		NeutralCase float64 `json:"neutral_case"` // years to target at 5%
		WorstCase   float64 `json:"worst_case"`   // years to target at 2%
	} `json:"scenarios"`
}
