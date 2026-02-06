import { Link } from 'react-router-dom'

interface FeatureCard {
  title: string
  description: string
  icon: string
  path: string
  status: 'active' | 'coming-soon'
}

const features: FeatureCard[] = [
  {
    title: 'Net Worth',
    description: 'Track assets, debts, and progress toward financial independence.',
    icon: '💰',
    path: '/financial',
    status: 'active',
  },
  {
    title: 'Calendar',
    description: 'View and manage your schedule.',
    icon: '📅',
    path: '/calendar',
    status: 'coming-soon',
  },
  {
    title: 'Tasks',
    description: 'Track todos and projects.',
    icon: '✅',
    path: '/tasks',
    status: 'coming-soon',
  },
  {
    title: 'Health',
    description: 'Oura ring data and health insights.',
    icon: '💪',
    path: '/health',
    status: 'active',
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to HermanAdmin. Select a feature to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`relative bg-white overflow-hidden shadow rounded-lg ${
              feature.status === 'coming-soon' ? 'opacity-60' : 'hover:shadow-md transition-shadow'
            }`}
          >
            {feature.status === 'active' ? (
              <Link to={feature.path} className="block p-6">
                <div className="flex items-center">
                  <span className="text-3xl">{feature.icon}</span>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{feature.title}</h3>
                </div>
                <p className="mt-3 text-sm text-gray-500">{feature.description}</p>
              </Link>
            ) : (
              <div className="p-6">
                <div className="flex items-center">
                  <span className="text-3xl">{feature.icon}</span>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{feature.title}</h3>
                  <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Coming Soon
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-500">{feature.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
