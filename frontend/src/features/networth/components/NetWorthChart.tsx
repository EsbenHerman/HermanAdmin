import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { NetWorthDataPoint } from '../types'
import { formatSEK } from '../utils'

interface Props {
  history: NetWorthDataPoint[]
}

export default function NetWorthChart({ history }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No historical data yet. Add entries with different dates to see the trend.
      </div>
    )
  }

  const data = history.map(h => ({
    date: new Date(h.date).toLocaleDateString('sv-SE'),
    netWorth: h.net_worth,
    assets: h.total_assets,
    debt: h.total_debt,
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
