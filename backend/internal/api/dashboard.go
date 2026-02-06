package api

import (
	"math"
	"net/http"
)

type NetWorthDashboard struct {
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

func (s *Server) getNetWorthDashboard(w http.ResponseWriter, r *http.Request) {
	// Get total assets
	var totalAssets, projectedReturn, projectedDividend float64
	err := s.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(current_value), 0), 
		       COALESCE(SUM(current_value * expected_return / 100), 0),
		       COALESCE(SUM(current_value * expected_dividend / 100), 0)
		FROM assets
	`).Scan(&totalAssets, &projectedReturn, &projectedDividend)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get total debt
	var totalDebt float64
	err = s.db.QueryRow(r.Context(), `SELECT COALESCE(SUM(principal), 0) FROM debts`).Scan(&totalDebt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	dashboard := NetWorthDashboard{
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

	writeJSON(w, http.StatusOK, dashboard)
}
