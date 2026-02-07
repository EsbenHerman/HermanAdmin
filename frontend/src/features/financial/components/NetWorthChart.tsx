import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
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
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12, fill: '#737373' }} 
          axisLine={{ stroke: '#e8e8e8' }}
          tickLine={{ stroke: '#e8e8e8' }}
        />
        <YAxis 
          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          tick={{ fontSize: 12, fill: '#737373' }}
          axisLine={{ stroke: '#e8e8e8' }}
          tickLine={{ stroke: '#e8e8e8' }}
        />
        <Tooltip 
          formatter={(value) => formatSEK(typeof value === 'number' ? value : 0)}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
          }}
          labelStyle={{ color: '#404040', fontWeight: 500 }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '16px' }}
          iconType="circle"
        />
        <Line 
          type="monotone" 
          dataKey="netWorth" 
          name="Net Worth"
          stroke={COLORS.netWorth}
          strokeWidth={2}
          dot={{ fill: COLORS.netWorth, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line 
          type="monotone" 
          dataKey="assets" 
          name="Assets"
          stroke={COLORS.assets}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="debt" 
          name="Debt"
          stroke={COLORS.debt}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
