import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { fetchDetailedHistory } from '../api'
import { formatSEK } from '../utils'

interface Props {
  isOpen: boolean
  onClose: () => void
}

// Color palette for assets (greens/blues)
const ASSET_COLORS = [
  '#10B981', '#059669', '#047857', '#065F46', '#064E3B',
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A',
  '#6366F1', '#4F46E5', '#4338CA',
]

// Color palette for debts (reds/oranges)
const DEBT_COLORS = [
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D',
  '#F97316', '#EA580C', '#C2410C', '#9A3412',
]

export default function DetailedChartModal({ isOpen, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['detailed-history'],
    queryFn: fetchDetailedHistory,
    enabled: isOpen,
  })

  if (!isOpen) return null

  const chartData = data?.history.map(h => {
    const row: Record<string, number | string> = {
      date: new Date(h.date).toLocaleDateString('sv-SE'),
      netWorth: h.net_worth,
      totalAssets: h.total_assets,
      totalDebt: -h.total_debt, // Negative for display below zero
    }
    
    // Add individual assets
    for (const [name, value] of Object.entries(h.assets)) {
      row[`asset_${name}`] = value
    }
    
    // Add individual debts (negative)
    for (const [name, value] of Object.entries(h.debts)) {
      row[`debt_${name}`] = -value
    }
    
    return row
  }) || []

  const assetNames = data?.asset_names || []
  const debtNames = data?.debt_names || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Detailed Net Worth History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {isLoading ? (
            <div className="text-center py-8">Loading detailed history...</div>
          ) : !chartData.length ? (
            <div className="text-center py-8 text-gray-500">
              No historical data yet. Add entries with different dates to see the trend.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={500}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tickFormatter={(value) => {
                      const abs = Math.abs(value)
                      if (abs >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                      if (abs >= 1000) return `${(value / 1000).toFixed(0)}k`
                      return value.toString()
                    }}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      const numValue = typeof value === 'number' ? value : 0
                      const strName = String(name)
                      const displayValue = strName.startsWith('debt_') || strName === 'totalDebt' 
                        ? formatSEK(Math.abs(numValue))
                        : formatSEK(numValue)
                      const displayName = strName.replace('asset_', '').replace('debt_', '')
                      return [displayValue, displayName]
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value: string) => value.replace('asset_', '').replace('debt_', '')}
                  />
                  <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={1} />
                  
                  {/* Aggregate lines - thicker */}
                  <Line 
                    type="monotone" 
                    dataKey="netWorth" 
                    name="Net Worth"
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalAssets" 
                    name="Total Assets"
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalDebt" 
                    name="Total Debt"
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  
                  {/* Individual asset lines */}
                  {assetNames.map((name, i) => (
                    <Line
                      key={`asset_${name}`}
                      type="monotone"
                      dataKey={`asset_${name}`}
                      name={`asset_${name}`}
                      stroke={ASSET_COLORS[i % ASSET_COLORS.length]}
                      strokeWidth={1}
                      dot={false}
                    />
                  ))}
                  
                  {/* Individual debt lines (negative) */}
                  {debtNames.map((name, i) => (
                    <Line
                      key={`debt_${name}`}
                      type="monotone"
                      dataKey={`debt_${name}`}
                      name={`debt_${name}`}
                      stroke={DEBT_COLORS[i % DEBT_COLORS.length]}
                      strokeWidth={1}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Assets (positive axis)</h3>
                  <div className="space-y-1">
                    {assetNames.map((name, i) => (
                      <div key={name} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: ASSET_COLORS[i % ASSET_COLORS.length] }}
                        />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Debts (negative axis)</h3>
                  <div className="space-y-1">
                    {debtNames.map((name, i) => (
                      <div key={name} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }}
                        />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
