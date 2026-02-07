import { NavLink } from 'react-router-dom'

interface Tab {
  to: string
  label: string
  icon: string
}

const TABS: Tab[] = [
  { to: '/health', label: 'Overview', icon: '📊' },
  { to: '/health/sleep', label: 'Sleep', icon: '😴' },
  { to: '/health/activity', label: 'Activity', icon: '🏃' },
  { to: '/health/body', label: 'Body', icon: '💪' },
  { to: '/health/insights', label: 'Insights', icon: '💡' },
]

export function TabNav() {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex gap-1 overflow-x-auto pb-px">
        {TABS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/health'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            <span>{icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
