import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchNetWorthDashboard, fetchNetWorthHistory, fetchAssets } from '../api'
import { formatSEK } from '../utils'
import NetWorthChart from '../components/NetWorthChart'
import AllocationChart from '../components/AllocationChart'
import DetailedChartModal from '../components/DetailedChartModal'

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
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Error loading dashboard: {(error as Error).message}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Net Worth Dashboard</h1>
          <p className="text-sm text-gray-500">As of {data.as_of_date}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/networth/assets"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            📈 Assets
          </Link>
          <Link
            to="/networth/debts"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            📉 Debts
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Net Worth</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatSEK(data.net_worth)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Assets</dt>
                  <dd className="text-lg font-semibold text-green-600">{formatSEK(data.total_assets)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📉</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Debt</dt>
                  <dd className="text-lg font-semibold text-red-600">{formatSEK(data.total_debt)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Net Worth History */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 
            className="text-lg font-medium text-gray-900 mb-4 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setShowDetailedChart(true)}
            title="Click for detailed breakdown"
          >
            Net Worth Over Time
            <span className="ml-2 text-sm text-gray-400 hover:text-blue-500">📊</span>
          </h2>
          <NetWorthChart history={history || []} />
        </div>

        {/* Asset Allocation */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Asset Allocation</h2>
          <AllocationChart assets={assets || []} />
        </div>
      </div>

      {/* Detailed Chart Modal */}
      <DetailedChartModal 
        isOpen={showDetailedChart} 
        onClose={() => setShowDetailedChart(false)} 
      />

      {/* Category Breakdown */}
      {Object.keys(data.by_category).length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">By Category</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(data.by_category).map(([category, value]) => (
              <div key={category} className="border-l-4 border-blue-500 pl-4">
                <dt className="text-sm font-medium text-gray-500">{category}</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{formatSEK(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
