import { Link } from 'react-router-dom'
import { Card, Badge } from '../shared/components/ui'

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
    title: 'Health',
    description: 'Oura ring data and health insights.',
    icon: '💪',
    path: '/health',
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
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="section-subtitle mt-1">
          Welcome to HermanAdmin. Select a feature to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          feature.status === 'active' ? (
            <Link key={feature.title} to={feature.path} className="group">
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{feature.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ) : (
            <Card key={feature.title} className="h-full opacity-60">
              <div className="flex items-start gap-4">
                <span className="text-3xl grayscale">{feature.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <Badge variant="gray">Coming Soon</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        ))}
      </div>
    </div>
  )
}
