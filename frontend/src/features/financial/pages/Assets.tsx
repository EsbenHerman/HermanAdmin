import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAssets, createAsset, createAssetEntry, deleteAsset, fetchAssetEntries, updateAssetEntry, deleteAssetEntry } from '../api'
import { formatSEK, formatCurrency, CURRENCIES } from '../utils'
import type { AssetWithValue, AssetEntry } from '../types'
import { 
  Button, Input, Select, Card, PageHeader, Badge, 
  TableContainer, FormField, EmptyState 
} from '../../../shared/components/ui'

const CATEGORIES = ['Real Estate', 'Equity - Public', 'Equity - Private', 'Cash', 'Other']

const today = () => new Date().toISOString().split('T')[0]

const emptyAssetForm = {
  category: CATEGORIES[1],
  asset_type: 'manual' as 'stock' | 'manual',
  name: '',
  ticker: '',
  currency: 'SEK',
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
    onSuccess: () => invalidateAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => invalidateAll(),
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
      currency: assetForm.currency,
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
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const totalValue = assets?.reduce((sum, a) => sum + a.total_value, 0) ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        backLink="/financial"
        backLabel="← Financial Dashboard"
        actions={
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => { setShowForm(!showForm); setUpdateAssetId(null); }}
          >
            {showForm ? 'Cancel' : '+ Add Asset'}
          </Button>
        }
      />

      {/* Add Asset Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <h2 className="section-title">Add New Asset</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Category">
                <Select
                  value={assetForm.category}
                  onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Type">
                <Select
                  value={assetForm.asset_type}
                  onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value as 'stock' | 'manual' })}
                >
                  <option value="manual">Manual</option>
                  <option value="stock">Stock</option>
                </Select>
              </FormField>

              <FormField label="Name">
                <Input
                  type="text"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  placeholder="e.g., Apple Inc."
                  required
                />
              </FormField>

              {assetForm.asset_type === 'stock' && (
                <FormField label="Ticker">
                  <Input
                    type="text"
                    value={assetForm.ticker}
                    onChange={(e) => setAssetForm({ ...assetForm, ticker: e.target.value.toUpperCase() })}
                    placeholder="e.g., AAPL"
                  />
                </FormField>
              )}

              <FormField label="Currency">
                <Select
                  value={assetForm.currency}
                  onChange={(e) => setAssetForm({ ...assetForm, currency: e.target.value })}
                >
                  {CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>{cur}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Date">
                <Input
                  type="date"
                  value={assetForm.entry_date}
                  onChange={(e) => setAssetForm({ ...assetForm, entry_date: e.target.value })}
                />
              </FormField>

              <FormField label={assetForm.asset_type === 'stock' ? 'Shares' : 'Units'}>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={assetForm.units}
                  onChange={(e) => setAssetForm({ ...assetForm, units: e.target.value })}
                  placeholder="0"
                />
              </FormField>

              <FormField label={assetForm.asset_type === 'stock' ? `Price per Share (${assetForm.currency})` : `Value (${assetForm.currency})`}>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={assetForm.unit_value}
                  onChange={(e) => setAssetForm({ ...assetForm, unit_value: e.target.value })}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Notes">
                <Input
                  type="text"
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                />
              </FormField>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Total: <span className="font-semibold font-mono text-gray-900">{formatSEK(parseNum(assetForm.units) * parseNum(assetForm.unit_value))}</span>
              </p>
              <Button type="submit" loading={createMutation.isPending}>
                Create Asset
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Summary */}
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Total Assets</p>
          <p className="text-2xl font-semibold font-mono text-gray-900">{formatSEK(totalValue)}</p>
        </div>
        <span className="text-3xl">📈</span>
      </Card>

      {/* Asset Table */}
      <TableContainer>
        <table className="table">
          <thead>
            <tr>
              <th className="w-10"></th>
              <th>Name</th>
              <th>Category</th>
              <th className="text-right">Units</th>
              <th className="text-right">Unit Value</th>
              <th className="text-right">Total</th>
              <th className="text-right">As Of</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets?.map((asset: AssetWithValue) => (
              <>
                <tr 
                  key={asset.id} 
                  className={`${updateAssetId === asset.id ? 'bg-primary-50' : ''} ${expandedAssetId === asset.id ? 'bg-gray-50' : ''}`}
                >
                  <td>
                    <button
                      onClick={() => toggleExpand(asset.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-transform"
                      title="Show history"
                    >
                      <span className={`inline-block transition-transform ${expandedAssetId === asset.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </button>
                  </td>
                  <td className="font-medium">
                    {asset.name}
                    {asset.ticker && <span className="ml-2 text-gray-500">({asset.ticker})</span>}
                    {asset.asset_type === 'stock' && (
                      <Badge variant="primary" className="ml-2">Stock</Badge>
                    )}
                  </td>
                  <td className="text-gray-500">{asset.category}</td>
                  <td className="text-right font-mono tabular-nums">
                    {asset.latest_entry?.units.toLocaleString() || '-'}
                  </td>
                  <td className="text-right text-gray-500 font-mono tabular-nums">
                    {asset.latest_entry ? formatCurrency(asset.latest_entry.unit_value, asset.currency) : '-'}
                  </td>
                  <td className="text-right font-semibold font-mono tabular-nums">
                    {formatCurrency(asset.total_value, asset.currency)}
                  </td>
                  <td className="text-right text-gray-500">
                    {asset.latest_entry?.entry_date || '-'}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="xs" onClick={() => openUpdate(asset)}>
                        Update
                      </Button>
                      <Button 
                        variant="danger" 
                        size="xs"
                        onClick={() => {
                          if (confirm(`Delete "${asset.name}" and all its history? This cannot be undone.`)) {
                            deleteMutation.mutate(asset.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>

                {/* Expanded History Row */}
                {expandedAssetId === asset.id && (
                  <tr key={`${asset.id}-history`} className="bg-gray-50">
                    <td colSpan={8} className="p-4">
                      <div className="ml-6 pl-4 border-l-2 border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">History</h4>
                        {expandedEntries && expandedEntries.length > 0 ? (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                                <th className="py-2 text-left font-semibold">Date</th>
                                <th className="py-2 text-right font-semibold">Units</th>
                                <th className="py-2 text-right font-semibold">Unit Value</th>
                                <th className="py-2 text-right font-semibold">Total</th>
                                <th className="py-2 text-left pl-4 font-semibold">Notes</th>
                                <th className="py-2 text-right font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedEntries.map((entry: AssetEntry) => (
                                editingEntryId === entry.id ? (
                                  <tr key={entry.id} className="border-t border-gray-200 bg-primary-50">
                                    <td className="py-2">
                                      <Input
                                        type="date"
                                        value={editEntryForm.entry_date}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, entry_date: e.target.value })}
                                        className="w-32 text-sm"
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={editEntryForm.units}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, units: e.target.value })}
                                        className="w-24 text-sm text-right"
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={editEntryForm.unit_value}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, unit_value: e.target.value })}
                                        className="w-28 text-sm text-right"
                                      />
                                    </td>
                                    <td className="py-2 text-right font-semibold font-mono">
                                      {formatCurrency(parseNum(editEntryForm.units) * parseNum(editEntryForm.unit_value), asset.currency)}
                                    </td>
                                    <td className="py-2 pl-4">
                                      <Input
                                        type="text"
                                        value={editEntryForm.notes}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, notes: e.target.value })}
                                        className="w-32 text-sm"
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          variant="primary"
                                          size="xs"
                                          onClick={(e) => handleEditEntrySubmit(e, asset.id, entry.id)}
                                          loading={updateEntryMutation.isPending}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="xs"
                                          onClick={() => setEditingEntryId(null)}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={entry.id} className="border-t border-gray-200 hover:bg-gray-100">
                                    <td className="py-2 text-gray-600">{entry.entry_date}</td>
                                    <td className="py-2 text-right font-mono tabular-nums">{entry.units.toLocaleString()}</td>
                                    <td className="py-2 text-right text-gray-600 font-mono tabular-nums">{formatCurrency(entry.unit_value, asset.currency)}</td>
                                    <td className="py-2 text-right font-semibold font-mono tabular-nums">{formatCurrency(entry.units * entry.unit_value, asset.currency)}</td>
                                    <td className="py-2 text-left pl-4 text-gray-500">{entry.notes || '-'}</td>
                                    <td className="py-2 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="xs" onClick={() => openEditEntry(entry)}>
                                          Edit
                                        </Button>
                                        <Button variant="danger" size="xs" onClick={() => handleDeleteEntry(asset.id, entry.id)}>
                                          Delete
                                        </Button>
                                      </div>
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
                  <tr key={`${asset.id}-update`} className="bg-primary-50">
                    <td colSpan={8} className="p-4">
                      <form onSubmit={handleUpdateSubmit} className="flex flex-wrap items-end gap-4">
                        <FormField label="Date" className="w-auto">
                          <Input
                            type="date"
                            value={entryForm.entry_date}
                            onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })}
                            className="w-36"
                          />
                        </FormField>
                        <FormField label="Units" className="w-auto">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={entryForm.units}
                            onChange={(e) => setEntryForm({ ...entryForm, units: e.target.value })}
                            placeholder="0"
                            className="w-28"
                          />
                        </FormField>
                        <FormField label={`Unit Value (${asset.currency})`} className="w-auto">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={entryForm.unit_value}
                            onChange={(e) => setEntryForm({ ...entryForm, unit_value: e.target.value })}
                            placeholder="0"
                            className="w-32"
                          />
                        </FormField>
                        <FormField label="Notes" className="w-auto">
                          <Input
                            type="text"
                            value={entryForm.notes}
                            onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                            className="w-40"
                          />
                        </FormField>
                        <div className="flex items-center gap-3 pb-0.5">
                          <span className="text-sm text-gray-600">
                            = <span className="font-semibold font-mono">{formatCurrency(parseNum(entryForm.units) * parseNum(entryForm.unit_value), asset.currency)}</span>
                          </span>
                          <Button type="submit" size="sm" loading={addEntryMutation.isPending}>
                            Save
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setUpdateAssetId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </>
            ))}

            {(!assets || assets.length === 0) && (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon="📈"
                    title="No assets yet"
                    description="Add your first asset to start tracking your portfolio."
                    action={
                      <Button onClick={() => setShowForm(true)}>
                        + Add Asset
                      </Button>
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  )
}
