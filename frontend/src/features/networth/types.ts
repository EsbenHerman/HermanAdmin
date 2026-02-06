export interface Asset {
  id: number
  category: string
  name: string
  current_value: number
  expected_return: number
  expected_dividend: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Debt {
  id: number
  name: string
  principal: number
  interest_rate: number
  monthly_payment: number
  remaining_term: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Snapshot {
  id: number
  snapshot_date: string
  total_assets: number
  total_debt: number
  net_worth: number
  passive_income: number
  created_at: string
}

export interface NetWorthDashboard {
  total_assets: number
  total_debt: number
  net_worth: number
  projected_return: number
  projected_dividend: number
  total_passive_income: number
  target_income: number
  gap_to_target: number
  scenarios: {
    best_case: number
    neutral_case: number
    worst_case: number
  }
}
