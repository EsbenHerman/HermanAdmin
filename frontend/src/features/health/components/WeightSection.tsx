import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Line } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
import { fetchWeightTrend, createWeightEntry, deleteWeightEntry } from '../api'
import { Card } from '../../../shared/components/ui'
import type { WeightTrend } from '../types'

function TrendArrow({ trend, delta }: { trend: 'up' | 'down' | 'stable', delta: number }) {
  if (trend === 'stable') {
    return <span className="text-gray-400 text-sm">→</span>
  }
  if (trend === 'up') {
    return (
      <span className="text-amber-600 text-sm flex items-center gap-0.5">
        ↑ <span className="font-mono text-xs">+{delta.toFixed(1)}kg</span>
      </span>
    )
  }
  return (
    <span className="text-success-600 text-sm flex items-center gap-0.5">
      ↓ <span className="font-mono text-xs">{delta.toFixed(1)}kg</span>
    </span>
  )
}

function WeightChart({ data, avg7d }: { data: WeightTrend, avg7d?: number }) {
  const chartData = useMemo(() => {
    if (!data.history || data.history.length === 0) return null

    // Get last 30 entries for the chart
    const entries = data.history.slice(-30)

    return {
      labels: entries.map(e => e.date.slice(5)), // MM-DD
      datasets: [
        {
          data: entries.map(e => e.weight_kg),
          borderColor: '#8b5cf6',
          backgroundColor: '#8b5cf6',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
        },
      ],
    }
  }, [data.history])

  const options: ChartOptions<'line'> = useMemo(() => {
    const weights = data.history?.map(e => e.weight_kg) || []
    const minWeight = Math.min(...weights) - 1
    const maxWeight = Math.max(...weights) + 1

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            title: (items) => {
              const idx = items[0]?.dataIndex
              if (idx !== undefined) {
                const entries = data.history?.slice(-30) || []
                return entries[idx]?.date || ''
              }
              return ''
            },
            label: (ctx) => `Weight: ${(ctx.parsed.y ?? 0).toFixed(1)} kg`,
          },
        },
        annotation: avg7d ? {
          annotations: {
            avgLine: {
              type: 'line' as const,
              yMin: avg7d,
              yMax: avg7d,
              borderColor: '#94a3b8',
              borderWidth: 1,
              borderDash: [3, 3],
              label: {
                display: true,
                content: `7d avg: ${avg7d.toFixed(1)}`,
                position: 'end',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                font: { size: 10 },
              },
            },
          },
        } : undefined,
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: { size: 11 },
          },
          border: {
            display: false,
          },
        },
        y: {
          min: minWeight,
          max: maxWeight,
          grid: {
            display: false,
          },
          ticks: {
            font: { size: 11 },
          },
          border: {
            display: false,
          },
        },
      },
    }
  }, [data.history, avg7d])

  if (!chartData) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        No weight data yet
      </div>
    )
  }

  return (
    <div className="h-48">
      <Line data={chartData} options={options} />
    </div>
  )
}

function AddWeightModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean
  onClose: () => void
  onAdd: (weight: number, date: string, notes: string) => void
}) {
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const w = parseFloat(weight)
    if (w > 0) {
      onAdd(w, date, notes)
      setWeight('')
      setNotes('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Log Weight</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={e => { setWeight(e.target.value); }}
              placeholder="75.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => { setNotes(e.target.value); }}
              placeholder="Morning, after gym..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function WeightSection() {
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['weight-trend'],
    queryFn: () => fetchWeightTrend(90),
  })

  const addMutation = useMutation({
    mutationFn: ({ weight, date, notes }: { weight: number; date: string; notes: string }) =>
      createWeightEntry({ weight_kg: weight, date, notes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weight-trend'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWeightEntry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weight-trend'] })
    },
  })

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-gray-100 rounded-lg" />
  }

  const trend = data || { history: [], trend: 'stable' as const, trend_delta: 0 }
  const latest = trend.latest

  return (
    <div className="space-y-4">
      {/* Latest weight card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
            <span className="text-2xl">⚖️</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Latest Weight</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold font-mono tabular-nums text-gray-900">
                {latest ? latest.weight_kg.toFixed(1) : '—'}
              </p>
              <span className="text-gray-500">kg</span>
              {latest && <TrendArrow trend={trend.trend} delta={trend.trend_delta} />}
            </div>
            {trend.avg_7d && trend.avg_30d && (
              <p className="text-xs text-gray-400 mt-0.5">
                7d: <span className="font-mono">{trend.avg_7d.toFixed(1)}</span>
                <span className="ml-2">30d: <span className="font-mono">{trend.avg_30d.toFixed(1)}</span></span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => { setShowModal(true); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <span>+</span>
          <span className="hidden sm:inline">Log Weight</span>
        </button>
      </div>

      {/* Chart */}
      <Card>
        <WeightChart data={trend} avg7d={trend.avg_7d} />
      </Card>

      {/* Recent entries */}
      {trend.history.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Recent Entries</h4>
          <div className="space-y-1">
            {trend.history.slice(-5).reverse().map(entry => (
              <div 
                key={entry.date} 
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{entry.date}</span>
                  <span className="font-mono font-medium">{entry.weight_kg.toFixed(1)} kg</span>
                  {entry.notes && <span className="text-gray-400">— {entry.notes}</span>}
                </div>
                <button
                  onClick={() => { deleteMutation.mutate(entry.date); }}
                  className="text-gray-400 hover:text-danger-600 p-1"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddWeightModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); }}
        onAdd={(weight, date, notes) => { addMutation.mutate({ weight, date, notes }); }}
      />
    </div>
  )
}
