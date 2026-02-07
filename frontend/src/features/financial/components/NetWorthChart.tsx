import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import '../../../lib/chartjs'
import { tooltipStyle } from '../../../lib/chartjs'
import type { NetWorthDataPoint } from '../types'
import { formatSEK } from '../utils'

interface Props {
  history: NetWorthDataPoint[]
}

// Mercury-style chart colors
const COLORS = {
  netWorth: '#5a6ff2',  // primary-500
  assets: '#10b981',    // success-500
  debt: '#ef4444',      // danger-500
}

export default function NetWorthChart({ history }: Props) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null

    return {
      labels: history.map(h => new Date(h.date).toLocaleDateString('sv-SE')),
      datasets: [
        {
          label: 'Net Worth',
          data: history.map(h => h.net_worth),
          borderColor: COLORS.netWorth,
          backgroundColor: COLORS.netWorth,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
        },
        {
          label: 'Assets',
          data: history.map(h => h.total_assets),
          borderColor: COLORS.assets,
          backgroundColor: COLORS.assets,
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: 'Debt',
          data: history.map(h => h.total_debt),
          borderColor: COLORS.debt,
          backgroundColor: COLORS.debt,
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    }
  }, [history])

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
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatSEK(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#e8e8e8',
        },
        ticks: {
          font: { size: 10 },
          color: '#737373',
          maxTicksLimit: 8,
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
          font: { size: 10 },
          color: '#737373',
          callback: (value) => `${(Number(value) / 1000000).toFixed(1)}M`,
        },
        border: {
          color: '#e8e8e8',
        },
      },
    },
  }), [])

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-gray-500 text-sm text-center px-4">
        No historical data yet. Add entries with different dates to see the trend.
      </div>
    )
  }

  return (
    <div className="h-[200px] sm:h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  )
}
