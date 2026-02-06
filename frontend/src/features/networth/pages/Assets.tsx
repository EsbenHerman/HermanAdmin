import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAssets, createAsset, createAssetEntry, deleteAsset, fetchAssetEntries, updateAssetEntry, deleteAssetEntry } from '../api'
import { formatSEK } from '../utils'
import type { AssetWithValue, AssetEntry } from '../types'

const CATEGORIES = ['Real Estate', 'Equity - Public', 'Equity - Private', 'Cash', 'Other']

const today = () => new Date().toISOString().split('T')[0]

const emptyAssetForm = {
  category: CATEGORIES[1],
  asset_type: 'manual' as 'stock' | 'manual',
  name: '',
  ticker: '',
  entry_date: today(),
  units: '',
  unit_value: '',
  notes: '',
}

const emptyEntryForm = {
  entry_date: today(),
  units: '',
  unit_value: '',
  notes: '',
}

export default function Assets() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [updateAssetId, setUpdateAssetId] = useState<number | null>(null)
  const [expandedAssetId, setExpandedAssetId] = useState<number | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
  const [assetForm, setAssetForm] = useState(emptyAssetForm)
  const [entryForm, setEntryForm] = useState(emptyEntryForm)
  const [editEntryForm, setEditEntryForm] = useState(emptyEntryForm)

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: fetchAssets,
  })

  const { data: expandedEntries } = useQuery({
    queryKey: ['asset-entries', expandedAssetId],
    queryFn: () => fetchAssetEntries(expandedAssetId!),
    enabled: expandedAssetId !== null,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['assets'] })
    queryClient.invalidateQueries({ queryKey: ['asset-entries'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['history'] })
    queryClient.invalidateQueries({ queryKey: ['detailed-history'] })
  }

  const createMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      invalidateAll()
      closeForm()
    },
  })

  const addEntryMutation = useMutation({
    mutationFn: ({ assetId, entry }: { assetId: number; entry: { entry_date: string; units: number; unit_value: number; notes: string } }) => 
      createAssetEntry(assetId, entry),
    onSuccess: () => {
      invalidateAll()
      setUpdateAssetId(null)
      setEntryForm(emptyEntryForm)
    },
  })

  const updateEntryMutation = useMutation({
    mutationFn: ({ assetId, entryId, entry }: { assetId: number; entryId: number; entry: { entry_date: string; units: number; unit_value: number; notes: string } }) => 
      updateAssetEntry(assetId, entryId, entry),
    onSuccess: () => {
      invalidateAll()
      setEditingEntryId(null)
      setEditEntryForm(emptyEntryForm)
    },
  })

  const deleteEntryMutation = useMutation({
    mutationFn: ({ assetId, entryId }: { assetId: number; entryId: number }) => 
      deleteAssetEntry(assetId, entryId),
    onSuccess: () => {
      invalidateAll()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      invalidateAll()
    },
  })

  const closeForm = () => {
    setShowForm(false)
    setAssetForm(emptyAssetForm)
  }

  const openUpdate = (asset: AssetWithValue) => {
    setEntryForm({
      entry_date: today(),
      units: String(asset.latest_entry?.units || 1),
      unit_value: String(asset.latest_entry?.unit_value || 0),
      notes: '',
    })
    setUpdateAssetId(asset.id)
  }

  const openEditEntry = (entry: AssetEntry) => {
    setEditEntryForm({
      entry_date: entry.entry_date,
      units: String(entry.units),
      unit_value: String(entry.unit_value),
      notes: entry.notes || '',
    })
    setEditingEntryId(entry.id)
  }

  const toggleExpand = (assetId: number) => {
    setExpandedAssetId(expandedAssetId === assetId ? null : assetId)
    setEditingEntryId(null)
  }

  const parseNum = (val: string) => parseFloat(val) || 0

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...assetForm,
      units: parseNum(assetForm.units),
      unit_value: parseNum(assetForm.unit_value),
      ticker: assetForm.asset_type === 'stock' && assetForm.ticker ? assetForm.ticker : undefined,
    })
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (updateAssetId) {
      addEntryMutation.mutate({ 
        assetId: updateAssetId, 
        entry: {
          entry_date: entryForm.entry_date,
          units: parseNum(entryForm.units),
          unit_value: parseNum(entryForm.unit_value),
          notes: entryForm.notes,
        }
      })
    }
  }

  const handleEditEntrySubmit = (e: React.FormEvent, assetId: number, entryId: number) => {
    e.preventDefault()
    updateEntryMutation.mutate({
      assetId,
      entryId,
      entry: {
        entry_date: editEntryForm.entry_date,
        units: parseNum(editEntryForm.units),
        unit_value: parseNum(editEntryForm.unit_value),
        notes: editEntryForm.notes,
      }
    })
  }

  const handleDeleteEntry = (assetId: number, entryId: number) => {
    if (confirm('Delete this entry?')) {
      deleteEntryMutation.mutate({ assetId, entryId })
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const totalValue = assets?.reduce((sum, a) => sum + a.total_value, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/networth" className="text-sm text-blue-600 hover:text-blue-800">← Net Worth</Link>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setUpdateAssetId(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Asset'}
        </button>
      </div>

      {/* Add Asset Form */}
      {showForm && (
        <form onSubmit={handleCreateSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">Add New Asset</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={assetForm.category}
                onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={assetForm.asset_type}
                onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value as 'stock' | 'manual' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="manual">Manual</option>
                <option value="stock">Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                placeholder="e.g., Apple Inc."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            {assetForm.asset_type === 'stock' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Ticker</label>
                <input
                  type="text"
                  value={assetForm.ticker}
                  onChange={(e) => setAssetForm({ ...assetForm, ticker: e.target.value.toUpperCase() })}
                  placeholder="e.g., AAPL"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={assetForm.entry_date}
                onChange={(e) => setAssetForm({ ...assetForm, entry_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {assetForm.asset_type === 'stock' ? 'Shares' : 'Units'}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={assetForm.units}
                onChange={(e) => setAssetForm({ ...assetForm, units: e.target.value })}
                placeholder="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {assetForm.asset_type === 'stock' ? 'Price per Share (SEK)' : 'Value (SEK)'}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={assetForm.unit_value}
                onChange={(e) => setAssetForm({ ...assetForm, unit_value: e.target.value })}
                placeholder="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input
                type="text"
                value={assetForm.notes}
                onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-500">
              Total: {formatSEK(parseNum(assetForm.units) * parseNum(assetForm.unit_value))}
            </p>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving...' : 'Create Asset'}
            </button>
          </div>
        </form>
      )}

      {/* Summary */}
      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-lg font-semibold">Total: {formatSEK(totalValue)}</p>
      </div>

      {/* Asset Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Value</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">As Of</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets?.map((asset: AssetWithValue) => (
              <>
                <tr key={asset.id} className={updateAssetId === asset.id ? 'bg-blue-50' : expandedAssetId === asset.id ? 'bg-gray-50' : ''}>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleExpand(asset.id)}
                      className="text-gray-400 hover:text-gray-600 transition-transform"
                      title="Show history"
                    >
                      <span className={`inline-block transition-transform ${expandedAssetId === asset.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {asset.name}
                    {asset.ticker && <span className="ml-2 text-gray-500">({asset.ticker})</span>}
                    {asset.asset_type === 'stock' && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Stock</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {asset.latest_entry?.units.toLocaleString() || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {asset.latest_entry ? formatSEK(asset.latest_entry.unit_value) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatSEK(asset.total_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {asset.latest_entry?.entry_date || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button
                      onClick={() => openUpdate(asset)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${asset.name}" and all its history? This cannot be undone.`)) {
                          deleteMutation.mutate(asset.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {/* Expanded History Row */}
                {expandedAssetId === asset.id && (
                  <tr key={`${asset.id}-history`} className="bg-gray-50">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="ml-8">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">History</h4>
                        {expandedEntries && expandedEntries.length > 0 ? (
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-500 uppercase">
                                <th className="py-1 text-left">Date</th>
                                <th className="py-1 text-right">Units</th>
                                <th className="py-1 text-right">Unit Value</th>
                                <th className="py-1 text-right">Total</th>
                                <th className="py-1 text-left pl-4">Notes</th>
                                <th className="py-1 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedEntries.map((entry: AssetEntry) => (
                                editingEntryId === entry.id ? (
                                  <tr key={entry.id} className="border-t border-gray-200 bg-blue-50">
                                    <td className="py-2">
                                      <input
                                        type="date"
                                        value={editEntryForm.entry_date}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, entry_date: e.target.value })}
                                        className="w-32 rounded border-gray-300 text-sm"
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editEntryForm.units}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, units: e.target.value })}
                                        className="w-24 rounded border-gray-300 text-sm text-right"
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editEntryForm.unit_value}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, unit_value: e.target.value })}
                                        className="w-28 rounded border-gray-300 text-sm text-right"
                                      />
                                    </td>
                                    <td className="py-2 text-right font-medium text-gray-900">
                                      {formatSEK(parseNum(editEntryForm.units) * parseNum(editEntryForm.unit_value))}
                                    </td>
                                    <td className="py-2 pl-4">
                                      <input
                                        type="text"
                                        value={editEntryForm.notes}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, notes: e.target.value })}
                                        className="w-32 rounded border-gray-300 text-sm"
                                      />
                                    </td>
                                    <td className="py-2 text-right space-x-2">
                                      <button
                                        onClick={(e) => handleEditEntrySubmit(e, asset.id, entry.id)}
                                        disabled={updateEntryMutation.isPending}
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingEntryId(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        Cancel
                                      </button>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={entry.id} className="border-t border-gray-200">
                                    <td className="py-2 text-gray-600">{entry.entry_date}</td>
                                    <td className="py-2 text-right text-gray-900">{entry.units.toLocaleString()}</td>
                                    <td className="py-2 text-right text-gray-600">{formatSEK(entry.unit_value)}</td>
                                    <td className="py-2 text-right font-medium text-gray-900">{formatSEK(entry.units * entry.unit_value)}</td>
                                    <td className="py-2 text-left pl-4 text-gray-500">{entry.notes || '-'}</td>
                                    <td className="py-2 text-right space-x-2">
                                      <button
                                        onClick={() => openEditEntry(entry)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEntry(asset.id, entry.id)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                )
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-gray-500 text-sm">No history entries.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {/* Update Form Row */}
                {updateAssetId === asset.id && (
                  <tr key={`${asset.id}-update`} className="bg-blue-50">
                    <td colSpan={8} className="px-6 py-4">
                      <form onSubmit={handleUpdateSubmit} className="flex items-end gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Date</label>
                          <input
                            type="date"
                            value={entryForm.entry_date}
                            onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })}
                            className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Units</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={entryForm.units}
                            onChange={(e) => setEntryForm({ ...entryForm, units: e.target.value })}
                            placeholder="0"
                            className="mt-1 block w-28 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Unit Value (SEK)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={entryForm.unit_value}
                            onChange={(e) => setEntryForm({ ...entryForm, unit_value: e.target.value })}
                            placeholder="0"
                            className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Notes</label>
                          <input
                            type="text"
                            value={entryForm.notes}
                            onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                            className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          = {formatSEK(parseNum(entryForm.units) * parseNum(entryForm.unit_value))}
                        </div>
                        <button
                          type="submit"
                          disabled={addEntryMutation.isPending}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          {addEntryMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpdateAssetId(null)}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Cancel
                        </button>
                      </form>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {(!assets || assets.length === 0) && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No assets yet. Add your first asset above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
