import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Line } from 'react-chartjs-2'
import type { ChartOptions, ChartData } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
import { fetchDetailedHistory } from '../api'
import { formatSEK } from '../utils'
import { Button, Card } from '../../../shared/components/ui'

interface Props {
  isOpen: boolean
  onClose: () => void
}

// Coordinated color palettes
const ASSET_COLORS = [
  '#10B981', '#059669', '#047857', 
  '#3B82F6', '#2563EB', '#1D4ED8',
  '#6366F1', '#4F46E5', '#4338CA',
  '#8B5CF6', '#7C3AED',
]

const DEBT_COLORS = [
  '#EF4444', '#DC2626', '#B91C1C',
  '#F97316', '#EA580C', '#C2410C',
]

export default function DetailedChartModal({ isOpen, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['detailed-history'],
    queryFn: fetchDetailedHistory,
    enabled: isOpen,
  })

  const { chartData, assetNames, debtNames } = useMemo((): {
    chartData: ChartData<'line'> | null
    assetNames: string[]
    debtNames: string[]
  } => {
    if (!data?.history) {
      return { chartData: null, assetNames: [], debtNames: [] }
    }

    const processed = data.history.map(h => {
      const row: Record<string, number | string> = {
        date: new Date(h.date).toLocaleDateString('sv-SE'),
        netWorth: h.net_worth,
        totalAssets: h.total_assets,
        totalDebt: -h.total_debt,
      }
      
      for (const [name, value] of Object.entries(h.assets)) {
        row[`asset_${name}`] = value
      }
      
      for (const [name, value] of Object.entries(h.debts)) {
        row[`debt_${name}`] = -value
      }
      
      return row
    })

    const assetNamesData = data.asset_names || []
    const debtNamesData = data.debt_names || []

    // Build Chart.js dataset
    const datasets = [
      {
        label: 'Net Worth',
        data: processed.map(r => r.netWorth as number),
        borderColor: '#5a6ff2',
        backgroundColor: '#5a6ff2',
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'Total Assets',
        data: processed.map(r => r.totalAssets as number),
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'Total Debt',
        data: processed.map(r => r.totalDebt as number),
        borderColor: '#EF4444',
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.3,
      },
      ...assetNamesData.map((name, i) => ({
        label: name,
        data: processed.map(r => (r[`asset_${name}`] ?? null) as number | null),
        borderColor: ASSET_COLORS[i % ASSET_COLORS.length],
        backgroundColor: ASSET_COLORS[i % ASSET_COLORS.length],
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
      })),
      ...debtNamesData.map((name, i) => ({
        label: name,
        data: processed.map(r => (r[`debt_${name}`] ?? null) as number | null),
        borderColor: DEBT_COLORS[i % DEBT_COLORS.length],
        backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length],
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
      })),
    ]

    return {
      chartData: {
        labels: processed.map(r => r.date as string),
        datasets,
      },
      assetNames: assetNamesData,
      debtNames: debtNamesData,
    }
  }, [data])

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed.y ?? 0
            const label = ctx.dataset.label || ''
            const isDebt = debtNames.includes(label) || label === 'Total Debt'
            const displayValue = isDebt ? formatSEK(Math.abs(value)) : formatSEK(value)
            return `${label}: ${displayValue}`
          },
        },
      },
      annotation: {
        annotations: {
          zeroLine: {
            type: 'line' as const,
            yMin: 0,
            yMax: 0,
            borderColor: '#a8a8a8',
            borderWidth: 1,
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#e8e8e8',
        },
        ticks: {
          font: { size: 11 },
          color: '#737373',
        },
        border: {
          color: '#e8e8e8',
        },
      },
      y: {
        grid: {
          color: '#e8e8e8',
        },
        ticks: {
          font: { size: 11 },
          color: '#737373',
          callback: (value) => {
            const v = Number(value)
            const abs = Math.abs(v)
            if (abs >= 1000000) return `${(v / 1000000).toFixed(1)}M`
            if (abs >= 1000) return `${(v / 1000).toFixed(0)}k`
            return String(v)
          },
        },
        border: {
          color: '#e8e8e8',
        },
      },
    },
  }), [debtNames])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Detailed Net Worth History</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-gray-500">Loading detailed history...</p>
              </div>
            </div>
          ) : !chartData ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              No historical data yet. Add entries with different dates to see the trend.
            </div>
          ) : (
            <>
              <Card padding="lg" className="mb-6">
                <div className="h-[500px]">
                  <Line data={chartData} options={options} />
                </div>
              </Card>

              {/* Legend cards */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-3">Assets (positive axis)</h3>
                  <div className="space-y-2">
                    {assetNames.map((name, i) => (
                      <div key={name} className="flex items-center gap-3 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: ASSET_COLORS[i % ASSET_COLORS.length] }}
                        />
                        <span className="text-gray-700">{name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-3">Debts (negative axis)</h3>
                  <div className="space-y-2">
                    {debtNames.map((name, i) => (
                      <div key={name} className="flex items-center gap-3 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }}
                        />
                        <span className="text-gray-700">{name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
