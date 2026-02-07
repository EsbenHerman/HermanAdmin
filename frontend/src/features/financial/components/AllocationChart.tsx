import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
import type { AssetWithValue } from '../types'
import { formatSEK } from '../utils'

interface Props {
  assets: AssetWithValue[]
}

// Mercury-style coordinated palette
const COLORS = [
  '#5a6ff2', // primary
  '#10b981', // success
  '#f59e0b', // warning
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#3b82f6', // blue
]

export default function AllocationChart({ assets }: Props) {
  const data = useMemo(() => {
    if (!assets || assets.length === 0) return null

    // Group by category
    const byCategory = assets.reduce<Record<string, number>>((acc, asset) => {
      const cat = asset.category || 'Other'
      acc[cat] = (acc[cat] || 0) + asset.total_value
      return acc
    }, {})

    const entries = Object.entries(byCategory)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])

    if (entries.length === 0) return null

    return {
      labels: entries.map(([name]) => name),
      datasets: [
        {
          data: entries.map(([_, value]) => value),
          backgroundColor: entries.map((_, i) => COLORS[i % COLORS.length]),
          borderColor: 'white',
          borderWidth: 2,
        },
      ],
    }
  }, [assets])

  const options: ChartOptions<'doughnut'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `${ctx.label}: ${formatSEK(ctx.parsed ?? 0)}`,
        },
      },
    },
  }), [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-gray-500 text-sm">
        {!assets || assets.length === 0 ? 'No assets yet.' : 'No asset values recorded yet.'}
      </div>
    )
  }

  return (
    <div className="h-[200px] sm:h-[300px]">
      <Doughnut data={data} options={options} />
    </div>
  )
}
