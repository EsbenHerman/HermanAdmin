import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDebts, createDebt, createDebtEntry, deleteDebt, fetchDebtEntries, updateDebtEntry, deleteDebtEntry } from '../api'
import { formatSEK, formatCurrency, CURRENCIES } from '../utils'
import type { DebtWithValue, DebtEntry } from '../types'
import { 
  Button, Input, Select, Card, PageHeader, 
  TableContainer, FormField, EmptyState 
} from '../../../shared/components/ui'

const today = () => new Date().toISOString().split('T')[0]

const emptyDebtForm = {
  name: '',
  currency: 'SEK',
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
    onSuccess: () => invalidateAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => invalidateAll(),
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
      currency: debtForm.currency,
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
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const totalDebt = debts?.reduce((sum, d) => sum + (d.latest_entry?.principal || 0), 0) ?? 0
  const monthlyPayments = debts?.reduce((sum, d) => sum + (d.latest_entry?.monthly_payment || 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Debts"
        backLink="/financial"
        backLabel="← Financial Dashboard"
        actions={
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => { setShowForm(!showForm); setUpdateDebtId(null); }}
          >
            {showForm ? 'Cancel' : '+ Add Debt'}
          </Button>
        }
      />

      {/* Add Debt Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <h2 className="section-title">Add New Debt</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Name">
                <Input
                  type="text"
                  value={debtForm.name}
                  onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
                  placeholder="e.g., Mortgage"
                  required
                />
              </FormField>

              <FormField label="Currency">
                <Select
                  value={debtForm.currency}
                  onChange={(e) => setDebtForm({ ...debtForm, currency: e.target.value })}
                >
                  {CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>{cur}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Interest Rate (%)">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={debtForm.interest_rate}
                  onChange={(e) => setDebtForm({ ...debtForm, interest_rate: e.target.value })}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Date">
                <Input
                  type="date"
                  value={debtForm.entry_date}
                  onChange={(e) => setDebtForm({ ...debtForm, entry_date: e.target.value })}
                />
              </FormField>

              <FormField label={`Principal (${debtForm.currency})`}>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={debtForm.principal}
                  onChange={(e) => setDebtForm({ ...debtForm, principal: e.target.value })}
                  placeholder="0"
                />
              </FormField>

              <FormField label={`Monthly Payment (${debtForm.currency})`}>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={debtForm.monthly_payment}
                  onChange={(e) => setDebtForm({ ...debtForm, monthly_payment: e.target.value })}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Notes">
                <Input
                  type="text"
                  value={debtForm.notes}
                  onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })}
                />
              </FormField>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button type="submit" loading={createMutation.isPending}>
                Create Debt
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Debt</p>
            <p className="text-2xl font-semibold font-mono text-danger-600">{formatSEK(totalDebt)}</p>
          </div>
          <span className="text-3xl">📉</span>
        </Card>
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Monthly Payments</p>
            <p className="text-2xl font-semibold font-mono text-gray-900">{formatSEK(monthlyPayments)}</p>
          </div>
          <span className="text-3xl">💳</span>
        </Card>
      </div>

      {/* Debt Table */}
      <TableContainer>
        <table className="table">
          <thead>
            <tr>
              <th className="w-10"></th>
              <th>Name</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Principal</th>
              <th className="text-right">Monthly</th>
              <th className="text-right">As Of</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {debts?.map((debt: DebtWithValue) => (
              <>
                <tr 
                  key={debt.id} 
                  className={`${updateDebtId === debt.id ? 'bg-primary-50' : ''} ${expandedDebtId === debt.id ? 'bg-gray-50' : ''}`}
                >
                  <td>
                    <button
                      onClick={() => toggleExpand(debt.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-transform"
                      title="Show history"
                    >
                      <span className={`inline-block transition-transform ${expandedDebtId === debt.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </button>
                  </td>
                  <td className="font-medium">{debt.name}</td>
                  <td className="text-right text-gray-500 font-mono tabular-nums">{debt.interest_rate}%</td>
                  <td className="text-right font-semibold text-danger-600 font-mono tabular-nums">
                    {debt.latest_entry ? formatCurrency(debt.latest_entry.principal, debt.currency) : '-'}
                  </td>
                  <td className="text-right text-gray-500 font-mono tabular-nums">
                    {debt.latest_entry ? formatCurrency(debt.latest_entry.monthly_payment, debt.currency) : '-'}
                  </td>
                  <td className="text-right text-gray-500">
                    {debt.latest_entry?.entry_date || '-'}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="xs" onClick={() => openUpdate(debt)}>
                        Update
                      </Button>
                      <Button 
                        variant="danger" 
                        size="xs"
                        onClick={() => {
                          if (confirm(`Delete "${debt.name}" and all its history? This cannot be undone.`)) {
                            deleteMutation.mutate(debt.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>

                {/* Expanded History Row */}
                {expandedDebtId === debt.id && (
                  <tr key={`${debt.id}-history`} className="bg-gray-50">
                    <td colSpan={7} className="p-4">
                      <div className="ml-6 pl-4 border-l-2 border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">History</h4>
                        {expandedEntries && expandedEntries.length > 0 ? (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                                <th className="py-2 text-left font-semibold">Date</th>
                                <th className="py-2 text-right font-semibold">Principal</th>
                                <th className="py-2 text-right font-semibold">Monthly Payment</th>
                                <th className="py-2 text-left pl-4 font-semibold">Notes</th>
                                <th className="py-2 text-right font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedEntries.map((entry: DebtEntry) => (
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
                                        value={editEntryForm.principal}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, principal: e.target.value })}
                                        className="w-28 text-sm text-right"
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={editEntryForm.monthly_payment}
                                        onChange={(e) => setEditEntryForm({ ...editEntryForm, monthly_payment: e.target.value })}
                                        className="w-28 text-sm text-right"
                                      />
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
                                          onClick={(e) => handleEditEntrySubmit(e, debt.id, entry.id)}
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
                                    <td className="py-2 text-right font-semibold text-danger-600 font-mono tabular-nums">{formatCurrency(entry.principal, debt.currency)}</td>
                                    <td className="py-2 text-right text-gray-600 font-mono tabular-nums">{formatCurrency(entry.monthly_payment, debt.currency)}</td>
                                    <td className="py-2 text-left pl-4 text-gray-500">{entry.notes || '-'}</td>
                                    <td className="py-2 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="xs" onClick={() => openEditEntry(entry)}>
                                          Edit
                                        </Button>
                                        <Button variant="danger" size="xs" onClick={() => handleDeleteEntry(debt.id, entry.id)}>
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
                {updateDebtId === debt.id && (
                  <tr key={`${debt.id}-update`} className="bg-primary-50">
                    <td colSpan={7} className="p-4">
                      <form onSubmit={handleUpdateSubmit} className="flex flex-wrap items-end gap-4">
                        <FormField label="Date" className="w-auto">
                          <Input
                            type="date"
                            value={entryForm.entry_date}
                            onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })}
                            className="w-36"
                          />
                        </FormField>
                        <FormField label={`Principal (${debt.currency})`} className="w-auto">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={entryForm.principal}
                            onChange={(e) => setEntryForm({ ...entryForm, principal: e.target.value })}
                            placeholder="0"
                            className="w-32"
                          />
                        </FormField>
                        <FormField label={`Monthly (${debt.currency})`} className="w-auto">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={entryForm.monthly_payment}
                            onChange={(e) => setEntryForm({ ...entryForm, monthly_payment: e.target.value })}
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
                          <Button type="submit" size="sm" loading={addEntryMutation.isPending}>
                            Save
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setUpdateDebtId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </>
            ))}

            {(!debts || debts.length === 0) && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon="📉"
                    title="No debts yet"
                    description="Add your first debt to start tracking what you owe."
                    action={
                      <Button onClick={() => setShowForm(true)}>
                        + Add Debt
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
