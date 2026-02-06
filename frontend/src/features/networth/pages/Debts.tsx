import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDebts, createDebt, createDebtEntry, deleteDebt, fetchDebtEntries, updateDebtEntry, deleteDebtEntry } from '../api'
import { formatSEK } from '../utils'
import type { DebtWithValue, DebtEntry } from '../types'

const today = () => new Date().toISOString().split('T')[0]

const emptyDebtForm = {
  name: '',
  interest_rate: '',
  entry_date: today(),
  principal: '',
  monthly_payment: '',
  notes: '',
}

const emptyEntryForm = {
  entry_date: today(),
  principal: '',
  monthly_payment: '',
  notes: '',
}

export default function Debts() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [updateDebtId, setUpdateDebtId] = useState<number | null>(null)
  const [expandedDebtId, setExpandedDebtId] = useState<number | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
  const [debtForm, setDebtForm] = useState(emptyDebtForm)
  const [entryForm, setEntryForm] = useState(emptyEntryForm)
  const [editEntryForm, setEditEntryForm] = useState(emptyEntryForm)

  const { data: debts, isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: fetchDebts,
  })

  const { data: expandedEntries } = useQuery({
    queryKey: ['debt-entries', expandedDebtId],
    queryFn: () => fetchDebtEntries(expandedDebtId!),
    enabled: expandedDebtId !== null,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['debts'] })
    queryClient.invalidateQueries({ queryKey: ['debt-entries'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['history'] })
    queryClient.invalidateQueries({ queryKey: ['detailed-history'] })
  }

  const createMutation = useMutation({
    mutationFn: createDebt,
    onSuccess: () => {
      invalidateAll()
      closeForm()
    },
  })

  const addEntryMutation = useMutation({
    mutationFn: ({ debtId, entry }: { debtId: number; entry: { entry_date: string; principal: number; monthly_payment: number; notes: string } }) => 
      createDebtEntry(debtId, entry),
    onSuccess: () => {
      invalidateAll()
      setUpdateDebtId(null)
      setEntryForm(emptyEntryForm)
    },
  })

  const updateEntryMutation = useMutation({
    mutationFn: ({ debtId, entryId, entry }: { debtId: number; entryId: number; entry: { entry_date: string; principal: number; monthly_payment: number; notes: string } }) => 
      updateDebtEntry(debtId, entryId, entry),
    onSuccess: () => {
      invalidateAll()
      setEditingEntryId(null)
      setEditEntryForm(emptyEntryForm)
    },
  })

  const deleteEntryMutation = useMutation({
    mutationFn: ({ debtId, entryId }: { debtId: number; entryId: number }) => 
      deleteDebtEntry(debtId, entryId),
    onSuccess: () => {
      invalidateAll()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => {
      invalidateAll()
    },
  })

  const closeForm = () => {
    setShowForm(false)
    setDebtForm(emptyDebtForm)
  }

  const openUpdate = (debt: DebtWithValue) => {
    setEntryForm({
      entry_date: today(),
      principal: String(debt.latest_entry?.principal || 0),
      monthly_payment: String(debt.latest_entry?.monthly_payment || 0),
      notes: '',
    })
    setUpdateDebtId(debt.id)
  }

  const openEditEntry = (entry: DebtEntry) => {
    setEditEntryForm({
      entry_date: entry.entry_date,
      principal: String(entry.principal),
      monthly_payment: String(entry.monthly_payment),
      notes: entry.notes || '',
    })
    setEditingEntryId(entry.id)
  }

  const toggleExpand = (debtId: number) => {
    setExpandedDebtId(expandedDebtId === debtId ? null : debtId)
    setEditingEntryId(null)
  }

  const parseNum = (val: string) => parseFloat(val) || 0

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...debtForm,
      interest_rate: parseNum(debtForm.interest_rate),
      principal: parseNum(debtForm.principal),
      monthly_payment: parseNum(debtForm.monthly_payment),
    })
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (updateDebtId) {
      addEntryMutation.mutate({ 
        debtId: updateDebtId, 
        entry: {
          entry_date: entryForm.entry_date,
          principal: parseNum(entryForm.principal),
          monthly_payment: parseNum(entryForm.monthly_payment),
          notes: entryForm.notes,
        }
      })
    }
  }

  const handleEditEntrySubmit = (e: React.FormEvent, debtId: number, entryId: number) => {
    e.preventDefault()
    updateEntryMutation.mutate({
      debtId,
      entryId,
      entry: {
        entry_date: editEntryForm.entry_date,
        principal: parseNum(editEntryForm.principal),
        monthly_payment: parseNum(editEntryForm.monthly_payment),
        notes: editEntryForm.notes,
      }
    })
  }

  const handleDeleteEntry = (debtId: number, entryId: number) => {
    if (confirm('Delete this entry?')) {
      deleteEntryMutation.mutate({ debtId, entryId })
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const totalDebt = debts?.reduce((sum, d) => sum + (d.latest_entry?.principal || 0), 0) ?? 0
  const monthlyPayments = debts?.reduce((sum, d) => sum + (d.latest_entry?.monthly_payment || 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/networth" className="text-sm text-blue-600 hover:text-blue-800">← Net Worth</Link>
          <h1 className="text-2xl font-bold text-gray-900">Debts</h1>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setUpdateDebtId(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Debt'}
        </button>
      </div>

      {/* Add Debt Form */}
      {showForm && (
        <form onSubmit={handleCreateSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">Add New Debt</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={debtForm.name}
                onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
                placeholder="e.g., Mortgage"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
              <input
                type="text"
                inputMode="decimal"
                value={debtForm.interest_rate}
                onChange={(e) => setDebtForm({ ...debtForm, interest_rate: e.target.value })}
                placeholder="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={debtForm.entry_date}
                onChange={(e) => setDebtForm({ ...debtForm, entry_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Principal (SEK)</label>
              <input
                type="text"
                inputMode="decimal"
                value={debtForm.principal}
                onChange={(e) => setDebtForm({ ...debtForm, principal: e.target.value })}
                placeholder="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Payment (SEK)</label>
              <input
                type="text"
                inputMode="decimal"
                value={debtForm.monthly_payment}
                onChange={(e) => setDebtForm({ ...debtForm, monthly_payment: e.target.value })}
                placeholder="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input
                type="text"
                value={debtForm.notes}
                onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving...' : 'Create Debt'}
            </button>
          </div>
        </form>
      )}

      {/* Summary */}
      <div className="bg-white shadow rounded-lg p-4 flex gap-8">
        <p className="text-lg font-semibold">Total Debt: <span className="text-red-600">{formatSEK(totalDebt)}</span></p>
        <p className="text-lg">Monthly Payments: {formatSEK(monthlyPayments)}</p>
      </div>

      {/* Debt Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">As Of</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {debts?.map((debt: DebtWithValue) => (
              <>
                <tr key={debt.id} className={updateDebtId === debt.id ? 'bg-blue-50' : expandedDebtId === debt.id ? 'bg-gray-50' : ''}>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleExpand(debt.id)}
                      className="text-gray-400 hover:text-gray-600 transition-transform"
                      title="Show history"
                    >
                      <span className={`inline-block transition-transform ${expandedDebtId === debt.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{debt.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{debt.interest_rate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                    {debt.latest_entry ? formatSEK(debt.latest_entry.principal) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {debt.latest_entry ? formatSEK(debt.latest_entry.monthly_payment) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {debt.latest_entry?.entry_date || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button
                      onClick={() => openUpdate(debt)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${debt.name}" and all its history? This cannot be undone.`)) {
                          deleteMutation.mutate(debt.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {/* Expanded History Row */}
                {expandedDebtId === debt.id && (
                  <tr key={`${debt.id}-history`} className="bg-gray-50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="ml-8">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">History</h4>
                        {expandedEntries && expandedEntries.length > 0 ? (
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-500 uppercase">
                                <th className="py-1 text-left">Date</th>
                                <th className="py-1 text-right">Principal</th>
                                <th className="py-1 text-right">Monthly Payment</th>
                                <th className="py-1 text-left pl-4">Notes</th>
                                <th className="py-1 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedEntries.map((entry: DebtEntry) => (
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
                                        value={editEntryForm.principal}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, principal: e.target.value })}
                                        className="w-28 rounded border-gray-300 text-sm text-right"
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={editEntryForm.monthly_payment}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, monthly_payment: e.target.value })}
                                        className="w-28 rounded border-gray-300 text-sm text-right"
                                      />
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
                                        onClick={(e) => handleEditEntrySubmit(e, debt.id, entry.id)}
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
                                    <td className="py-2 text-right font-medium text-red-600">{formatSEK(entry.principal)}</td>
                                    <td className="py-2 text-right text-gray-600">{formatSEK(entry.monthly_payment)}</td>
                                    <td className="py-2 text-left pl-4 text-gray-500">{entry.notes || '-'}</td>
                                    <td className="py-2 text-right space-x-2">
                                      <button
                                        onClick={() => openEditEntry(entry)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEntry(debt.id, entry.id)}
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
                {updateDebtId === debt.id && (
                  <tr key={`${debt.id}-update`} className="bg-blue-50">
                    <td colSpan={7} className="px-6 py-4">
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
                          <label className="block text-xs font-medium text-gray-700">Principal (SEK)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={entryForm.principal}
                            onChange={(e) => setEntryForm({ ...entryForm, principal: e.target.value })}
                            placeholder="0"
                            className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Monthly (SEK)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={entryForm.monthly_payment}
                            onChange={(e) => setEntryForm({ ...entryForm, monthly_payment: e.target.value })}
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
                        <button
                          type="submit"
                          disabled={addEntryMutation.isPending}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          {addEntryMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpdateDebtId(null)}
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
            {(!debts || debts.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No debts yet. Add your first debt above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
