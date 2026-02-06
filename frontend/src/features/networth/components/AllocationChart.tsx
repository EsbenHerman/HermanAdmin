import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { AssetWithValue } from '../types'
import { formatSEK } from '../utils'

interface Props {
  assets: AssetWithValue[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']

export default function AllocationChart({ assets }: Props) {
  if (!assets || assets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
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
      <div className="text-center py-8 text-gray-500">
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
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [formatSEK(typeof value === 'number' ? value : 0), 'Value']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
