import { API_BASE, handleResponse } from '../../shared/api/client'
import type { 
  AssetWithValue, 
  AssetEntry, 
  DebtWithValue, 
  DebtEntry, 
  NetWorthDashboard, 
  NetWorthDataPoint,
  DetailedHistoryResponse,
  CurrencyRate
} from './types'

// Assets
export const fetchAssets = (): Promise<AssetWithValue[]> =>
  fetch(`${API_BASE}/assets`).then(r => handleResponse<AssetWithValue[]>(r)).then(data => data || [])

export interface CreateAssetRequest {
  category: string
  asset_type: 'stock' | 'manual'
  name: string
  ticker?: string
  currency?: string  // ISO 4217 code, defaults to SEK
  entry_date: string
  units: number
  unit_value: number
  notes?: string
}

export const createAsset = (asset: CreateAssetRequest): Promise<AssetWithValue> =>
  fetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset),
  }).then(r => handleResponse(r))

export const deleteAsset = (id: number): Promise<void> =>
  fetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Asset Entries
export const fetchAssetEntries = (assetId: number): Promise<AssetEntry[]> =>
  fetch(`${API_BASE}/assets/${assetId}/entries`).then(r => handleResponse<AssetEntry[]>(r)).then(data => data || [])

export interface CreateAssetEntryRequest {
  entry_date: string
  units: number
  unit_value: number
  notes?: string
}

export const createAssetEntry = (assetId: number, entry: CreateAssetEntryRequest): Promise<AssetEntry> =>
  fetch(`${API_BASE}/assets/${assetId}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).then(r => handleResponse(r))

export const updateAssetEntry = (assetId: number, entryId: number, entry: CreateAssetEntryRequest): Promise<AssetEntry> =>
  fetch(`${API_BASE}/assets/${assetId}/entries/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).then(r => handleResponse(r))

export const deleteAssetEntry = (assetId: number, entryId: number): Promise<void> =>
  fetch(`${API_BASE}/assets/${assetId}/entries/${entryId}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Debts
export const fetchDebts = (): Promise<DebtWithValue[]> =>
  fetch(`${API_BASE}/debts`).then(r => handleResponse<DebtWithValue[]>(r)).then(data => data || [])

export interface CreateDebtRequest {
  name: string
  currency?: string  // ISO 4217 code, defaults to SEK
  interest_rate: number
  entry_date: string
  principal: number
  monthly_payment: number
  notes?: string
}

export const createDebt = (debt: CreateDebtRequest): Promise<DebtWithValue> =>
  fetch(`${API_BASE}/debts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debt),
  }).then(r => handleResponse(r))

export const deleteDebt = (id: number): Promise<void> =>
  fetch(`${API_BASE}/debts/${id}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Debt Entries
export const fetchDebtEntries = (debtId: number): Promise<DebtEntry[]> =>
  fetch(`${API_BASE}/debts/${debtId}/entries`).then(r => handleResponse<DebtEntry[]>(r)).then(data => data || [])

export interface CreateDebtEntryRequest {
  entry_date: string
  principal: number
  monthly_payment: number
  notes?: string
}

export const createDebtEntry = (debtId: number, entry: CreateDebtEntryRequest): Promise<DebtEntry> =>
  fetch(`${API_BASE}/debts/${debtId}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).then(r => handleResponse(r))

export const updateDebtEntry = (debtId: number, entryId: number, entry: CreateDebtEntryRequest): Promise<DebtEntry> =>
  fetch(`${API_BASE}/debts/${debtId}/entries/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).then(r => handleResponse(r))

export const deleteDebtEntry = (debtId: number, entryId: number): Promise<void> =>
  fetch(`${API_BASE}/debts/${debtId}/entries/${entryId}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })

// Dashboard
export const fetchNetWorthDashboard = (asOfDate?: string): Promise<NetWorthDashboard> => {
  const url = asOfDate 
    ? `${API_BASE}/dashboard/financial?as_of=${asOfDate}` 
    : `${API_BASE}/dashboard/financial`
  return fetch(url).then(r => handleResponse(r))
}

// History
export const fetchNetWorthHistory = (): Promise<NetWorthDataPoint[]> =>
  fetch(`${API_BASE}/dashboard/history`).then(r => handleResponse<NetWorthDataPoint[]>(r)).then(data => data || [])

// Detailed History
export const fetchDetailedHistory = (): Promise<DetailedHistoryResponse> =>
  fetch(`${API_BASE}/dashboard/history/detailed`).then(r => handleResponse<DetailedHistoryResponse>(r))

// Currency Rates
export const fetchCurrencyRates = (): Promise<CurrencyRate[]> =>
  fetch(`${API_BASE}/currencies`).then(r => handleResponse<CurrencyRate[]>(r)).then(data => data || [])

export interface UpsertCurrencyRateRequest {
  currency: string
  sek_rate: number
}

export const upsertCurrencyRate = (rate: UpsertCurrencyRateRequest): Promise<CurrencyRate> =>
  fetch(`${API_BASE}/currencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rate),
  }).then(r => handleResponse(r))

export const deleteCurrencyRate = (currency: string): Promise<void> =>
  fetch(`${API_BASE}/currencies/${currency}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error('Failed to delete')
  })
