import { API_BASE, handleResponse } from '../../shared/api/client'
import type { Asset, Debt, NetWorthDashboard, Snapshot } from './types'

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

// Snapshots
export const fetchSnapshots = (): Promise<Snapshot[]> =>
  fetch(`${API_BASE}/snapshots`).then(r => handleResponse(r))

export const createSnapshot = (): Promise<Snapshot> =>
  fetch(`${API_BASE}/snapshots`, { method: 'POST' }).then(r => handleResponse(r))
