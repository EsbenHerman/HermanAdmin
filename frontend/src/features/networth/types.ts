// Asset metadata
export interface Asset {
  id: number
  category: string
  asset_type: 'stock' | 'manual'
  name: string
  ticker?: string
  currency: string  // ISO 4217 code (SEK, USD, EUR, etc.)
  created_at: string
}

// Point-in-time asset value
export interface AssetEntry {
  id: number
  asset_id: number
  entry_date: string
  units: number
  unit_value: number
  notes?: string
  created_at: string
}

// Asset with its latest value
export interface AssetWithValue extends Asset {
  latest_entry?: AssetEntry
  total_value: number
}

// Debt metadata
export interface Debt {
  id: number
  name: string
  currency: string  // ISO 4217 code (SEK, USD, EUR, etc.)
  interest_rate: number
  created_at: string
}

// Point-in-time debt value
export interface DebtEntry {
  id: number
  debt_id: number
  entry_date: string
  principal: number
  monthly_payment: number
  notes?: string
  created_at: string
}

// Debt with its latest value
export interface DebtWithValue extends Debt {
  latest_entry?: DebtEntry
}

// Currency exchange rate (to SEK)
export interface CurrencyRate {
  currency: string
  sek_rate: number  // 1 unit of currency = X SEK
  updated_at: string
}

// Dashboard summary (all values in SEK)
export interface NetWorthDashboard {
  total_assets: number
  total_debt: number
  net_worth: number
  as_of_date: string
  by_category: Record<string, number>
  display_currency: string
}

// Historical data point
export interface NetWorthDataPoint {
  date: string
  total_assets: number
  total_debt: number
  net_worth: number
}

// Detailed historical data point with per-item breakdown
export interface DetailedHistoryDataPoint {
  date: string
  total_assets: number
  total_debt: number
  net_worth: number
  assets: Record<string, number>
  debts: Record<string, number>
}

// Response for detailed history endpoint
export interface DetailedHistoryResponse {
  history: DetailedHistoryDataPoint[]
  asset_names: string[]
  debt_names: string[]
}
