import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Snapshot } from '../types'
import { formatSEK } from '../utils'

interface Props {
  snapshots: Snapshot[]
}

export default function NetWorthChart({ snapshots }: Props) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No historical data yet. Click "Save Snapshot" to start tracking.
      </div>
    )
  }

  const data = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('sv-SE'),
    netWorth: s.net_worth,
    assets: s.total_assets,
    debt: s.total_debt,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis 
          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number) => formatSEK(value)}
          labelStyle={{ color: '#374151' }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="netWorth" 
          name="Net Worth"
          stroke="#3B82F6" 
          strokeWidth={2}
          dot={{ fill: '#3B82F6' }}
        />
        <Line 
          type="monotone" 
          dataKey="assets" 
          name="Assets"
          stroke="#10B981" 
          strokeWidth={1}
          strokeDasharray="5 5"
        />
        <Line 
          type="monotone" 
          dataKey="debt" 
          name="Debt"
          stroke="#EF4444" 
          strokeWidth={1}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
