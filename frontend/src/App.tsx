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
      className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
    >
      {children}
    </Link>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <span className="text-2xl">🐻</span>
                <span className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  HermanAdmin
                </span>
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <NavLink to="/">Home</NavLink>
                <NavLink to="/financial">Financial</NavLink>
                <NavLink to="/health">Health</NavLink>
              </div>
            </div>
            
            {/* Mobile menu button - could add hamburger here later */}
            <div className="flex sm:hidden">
              <button className="btn-ghost btn-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
