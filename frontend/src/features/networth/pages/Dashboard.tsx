import { useQuery } from '@tanstack/react-query'
import { fetchNetWorthDashboard } from '../api'
import { formatSEK, formatYears } from '../utils'

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchNetWorthDashboard,
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

  const progressPercent = Math.min((data.total_passive_income / data.target_income) * 100, 100)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Net Worth Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Passive Income</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatSEK(data.total_passive_income)}/yr</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Target */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Progress to 1M SEK/year</h2>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-blue-600">
                {progressPercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-gray-600">
                Gap: {formatSEK(data.gap_to_target)}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-4 text-xs flex rounded bg-blue-100">
            <div
              style={{ width: `${progressPercent}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Scenario Projections */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Time to Target</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="text-sm font-medium text-green-800">Best Case (8% growth)</h3>
            <p className="mt-2 text-2xl font-bold text-green-900">{formatYears(data.scenarios.best_case)}</p>
          </div>
          <div className="border rounded-lg p-4 bg-yellow-50">
            <h3 className="text-sm font-medium text-yellow-800">Neutral Case (5% growth)</h3>
            <p className="mt-2 text-2xl font-bold text-yellow-900">{formatYears(data.scenarios.neutral_case)}</p>
          </div>
          <div className="border rounded-lg p-4 bg-red-50">
            <h3 className="text-sm font-medium text-red-800">Worst Case (2% growth)</h3>
            <p className="mt-2 text-2xl font-bold text-red-900">{formatYears(data.scenarios.worst_case)}</p>
          </div>
        </div>
      </div>

      {/* Income Breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Passive Income Breakdown</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="border-l-4 border-blue-500 pl-4">
            <dt className="text-sm font-medium text-gray-500">Projected Returns</dt>
            <dd className="mt-1 text-xl font-semibold text-gray-900">{formatSEK(data.projected_return)}/yr</dd>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <dt className="text-sm font-medium text-gray-500">Projected Dividends</dt>
            <dd className="mt-1 text-xl font-semibold text-gray-900">{formatSEK(data.projected_dividend)}/yr</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
