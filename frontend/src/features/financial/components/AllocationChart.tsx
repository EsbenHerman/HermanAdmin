import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
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
  if (!assets || assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No assets yet.
      </div>
    )
  }

  // Group by category
  const byCategory = assets.reduce((acc, asset) => {
    const cat = asset.category || 'Other'
    acc[cat] = (acc[cat] || 0) + asset.total_value
    return acc
  }, {} as Record<string, number>)

  const data = Object.entries(byCategory)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No asset values recorded yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [formatSEK(typeof value === 'number' ? value : 0), 'Value']}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
          }}
        />
        <Legend 
          iconType="circle"
          wrapperStyle={{ paddingTop: '16px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
