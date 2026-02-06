import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDebts, createDebt, createDebtEntry, deleteDebt } from '../api'
import { formatSEK } from '../utils'
import type { DebtWithValue } from '../types'

const today = () => new Date().toISOString().split('T')[0]

const emptyDebtForm = {
  name: '',
  interest_rate: 0,
  entry_date: today(),
  principal: 0,
  monthly_payment: 0,
  notes: '',
}

const emptyEntryForm = {
  entry_date: today(),
  principal: 0,
  monthly_payment: 0,
  notes: '',
}

export default function Debts() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [updateDebtId, setUpdateDebtId] = useState<number | null>(null)
  const [debtForm, setDebtForm] = useState(emptyDebtForm)
  const [entryForm, setEntryForm] = useState(emptyEntryForm)

  const { data: debts, isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: fetchDebts,
  })

  const createMutation = useMutation({
    mutationFn: createDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      closeForm()
    },
  })

  const addEntryMutation = useMutation({
    mutationFn: ({ debtId, entry }: { debtId: number; entry: typeof entryForm }) => 
      createDebtEntry(debtId, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      setUpdateDebtId(null)
      setEntryForm(emptyEntryForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })

  const closeForm = () => {
    setShowForm(false)
    setDebtForm(emptyDebtForm)
  }

  const openUpdate = (debt: DebtWithValue) => {
    setEntryForm({
      entry_date: today(),
      principal: debt.latest_entry?.principal || 0,
      monthly_payment: debt.latest_entry?.monthly_payment || 0,
      notes: '',
    })
    setUpdateDebtId(debt.id)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(debtForm)
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (updateDebtId) {
      addEntryMutation.mutate({ debtId: updateDebtId, entry: entryForm })
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
                type="number"
                step="0.01"
                value={debtForm.interest_rate}
                onChange={(e) => setDebtForm({ ...debtForm, interest_rate: parseFloat(e.target.value) || 0 })}
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
                type="number"
                step="0.01"
                value={debtForm.principal}
                onChange={(e) => setDebtForm({ ...debtForm, principal: parseFloat(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Payment (SEK)</label>
              <input
                type="number"
                step="0.01"
                value={debtForm.monthly_payment}
                onChange={(e) => setDebtForm({ ...debtForm, monthly_payment: parseFloat(e.target.value) || 0 })}
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
                <tr key={debt.id} className={updateDebtId === debt.id ? 'bg-blue-50' : ''}>
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
                      onClick={() => deleteMutation.mutate(debt.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {updateDebtId === debt.id && (
                  <tr key={`${debt.id}-update`} className="bg-blue-50">
                    <td colSpan={6} className="px-6 py-4">
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
                            type="number"
                            step="0.01"
                            value={entryForm.principal}
                            onChange={(e) => setEntryForm({ ...entryForm, principal: parseFloat(e.target.value) || 0 })}
                            className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Monthly (SEK)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={entryForm.monthly_payment}
                            onChange={(e) => setEntryForm({ ...entryForm, monthly_payment: parseFloat(e.target.value) || 0 })}
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
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
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
