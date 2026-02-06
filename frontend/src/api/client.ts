const API_BASE = '/api/v1'

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Request failed')
  }
  return response.json()
}

// Assets
export const fetchAssets = (): Promise<Asset[]> =>
  fetch(`${API_BASE}/assets`).then(r => handleResponse(r))

export const createAsset = (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> =>
  fetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset),
  }).then(r => handleResponse(r))

export const updateAsset = (id: number, asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> =>
  fetch(`${API_BASE}/assets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset),
  }).then(r => handleResponse(r))

export const deleteAsset = (id: number): Promise<void> =>
  fetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Debts
export const fetchDebts = (): Promise<Debt[]> =>
  fetch(`${API_BASE}/debts`).then(r => handleResponse(r))

export const createDebt = (debt: Omit<Debt, 'id' | 'created_at' | 'updated_at'>): Promise<Debt> =>
  fetch(`${API_BASE}/debts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debt),
  }).then(r => handleResponse(r))

export const updateDebt = (id: number, debt: Omit<Debt, 'id' | 'created_at' | 'updated_at'>): Promise<Debt> =>
  fetch(`${API_BASE}/debts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debt),
  }).then(r => handleResponse(r))

export const deleteDebt = (id: number): Promise<void> =>
  fetch(`${API_BASE}/debts/${id}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Dashboard
export const fetchNetWorthDashboard = (): Promise<NetWorthDashboard> =>
  fetch(`${API_BASE}/dashboard/networth`).then(r => handleResponse(r))
