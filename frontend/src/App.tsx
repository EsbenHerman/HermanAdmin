import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Dashboard as NetWorthDashboard, Assets, Debts } from './features/financial'
import { Dashboard as HealthDashboard } from './features/health'
import Dashboard from './pages/Dashboard'

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
  
  return (
    <Link
      to={to}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
        isActive
          ? 'border-blue-500 text-gray-900'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {children}
    </Link>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">🐻 HermanAdmin</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink to="/">Home</NavLink>
                <NavLink to="/financial">Financial</NavLink>
                <NavLink to="/health">Health</NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/financial" element={<NetWorthDashboard />} />
          <Route path="/financial/assets" element={<Assets />} />
          <Route path="/financial/debts" element={<Debts />} />
          <Route path="/health" element={<HealthDashboard />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
