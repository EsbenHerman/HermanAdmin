import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchNetWorthDashboard, fetchNetWorthHistory, fetchAssets } from '../api'
import { formatSEK } from '../utils'
import NetWorthChart from '../components/NetWorthChart'
import AllocationChart from '../components/AllocationChart'
import DetailedChartModal from '../components/DetailedChartModal'
import { Card, MetricCard, Button, PageHeader, Section } from '../../../shared/components/ui'

export default function Dashboard() {
  const [showDetailedChart, setShowDetailedChart] = useState(false)
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetchNetWorthDashboard(),
  })

  const { data: history } = useQuery({
    queryKey: ['history'],
    queryFn: fetchNetWorthHistory,
  })

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: fetchAssets,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-danger-50 border-danger-200">
        <p className="text-danger-800">Error loading dashboard: {(error as Error).message}</p>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      <PageHeader
        title="Net Worth Dashboard"
        subtitle={`As of ${data.as_of_date}`}
        actions={
          <>
            <Link to="/financial/assets">
              <Button variant="secondary" size="sm">
                <span>📈</span> <span className="hidden sm:inline">Assets</span>
              </Button>
            </Link>
            <Link to="/financial/debts">
              <Button variant="secondary" size="sm">
                <span>📉</span> <span className="hidden sm:inline">Debts</span>
              </Button>
            </Link>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Net Worth"
          value={formatSEK(data.net_worth)}
          icon="💰"
        />
        <MetricCard
          label="Total Assets"
          value={formatSEK(data.total_assets)}
          icon="📈"
          trend="up"
        />
        <MetricCard
          label="Total Debt"
          value={formatSEK(data.total_debt)}
          icon="📉"
          trend="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Net Worth Over Time">
          <Card>
            <button
              onClick={() => setShowDetailedChart(true)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 group-hover:text-primary-600 transition-colors">
                  Click for detailed breakdown →
                </span>
              </div>
              <NetWorthChart history={history || []} />
            </button>
          </Card>
        </Section>

        <Section title="Asset Allocation">
          <Card>
            <AllocationChart assets={assets || []} />
          </Card>
        </Section>
      </div>

      {/* Detailed Chart Modal */}
      <DetailedChartModal 
        isOpen={showDetailedChart} 
        onClose={() => setShowDetailedChart(false)} 
      />

      {/* Category Breakdown */}
      {Object.keys(data.by_category).length > 0 && (
        <Section title="By Category">
          <Card>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(data.by_category).map(([category, value]) => (
                <div key={category} className="border-l-2 border-primary-500 pl-3 sm:pl-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{category}</p>
                  <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-gray-900 font-mono">
                    {formatSEK(value)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}
    </div>
  )
}
