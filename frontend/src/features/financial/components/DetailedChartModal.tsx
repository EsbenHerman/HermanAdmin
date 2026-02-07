import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
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

  if (!isOpen) return null

  const chartData = data?.history.map(h => {
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
  }) || []

  const assetNames = data?.asset_names || []
  const debtNames = data?.debt_names || []

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
          ) : !chartData.length ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              No historical data yet. Add entries with different dates to see the trend.
            </div>
          ) : (
            <>
              <Card padding="lg" className="mb-6">
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#737373' }}
                      axisLine={{ stroke: '#e8e8e8' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => {
                        const abs = Math.abs(value)
                        if (abs >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                        if (abs >= 1000) return `${(value / 1000).toFixed(0)}k`
                        return value.toString()
                      }}
                      tick={{ fontSize: 11, fill: '#737373' }}
                      axisLine={{ stroke: '#e8e8e8' }}
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
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e8e8e8',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value: string) => value.replace('asset_', '').replace('debt_', '')}
                      iconType="circle"
                    />
                    <ReferenceLine y={0} stroke="#a8a8a8" strokeWidth={1} />
                    
                    {/* Aggregate lines */}
                    <Line 
                      type="monotone" 
                      dataKey="netWorth" 
                      name="Net Worth"
                      stroke="#5a6ff2"
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
                    
                    {/* Individual debt lines */}
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
