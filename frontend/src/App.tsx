import { useState, useEffect, useCallback, useRef } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Dashboard as NetWorthDashboard, Assets, Debts } from './features/financial'
import { Dashboard as HealthDashboard } from './features/health'
import { Dashboard as CalendarDashboard } from './features/calendar'
import { Dashboard as PeopleDashboard, Person } from './features/people'
import Dashboard from './pages/Dashboard'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/financial', label: 'Financial', icon: '💰' },
  { to: '/health', label: 'Health', icon: '💪' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/people', label: 'People', icon: '👥' },
]

function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
    >
      {children}
    </Link>
  )
}

function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)

  // Close menu on route change (but not on mount)
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      onClose()
    }
    prevPathRef.current = location.pathname
  }, [location.pathname, onClose])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 sm:hidden shadow-xl">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link to="/" className="flex items-center" onClick={onClose}>
            <span className="text-lg font-semibold text-gray-900">HermanAdmin</span>
          </Link>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} onClick={onClose}>
              <span className="mr-3">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeMobileMenu = useCallback(() => { setMobileMenuOpen(false); }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center group">
                <span className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  HermanAdmin
                </span>
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                {NAV_ITEMS.map(({ to, label }) => (
                  <NavLink key={to} to={to}>{label}</NavLink>
                ))}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button 
              className="flex sm:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              onClick={() => { setMobileMenuOpen(true); }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/financial" element={<NetWorthDashboard />} />
          <Route path="/financial/assets" element={<Assets />} />
          <Route path="/financial/debts" element={<Debts />} />
          <Route path="/health/*" element={<HealthDashboard />} />
          <Route path="/calendar" element={<CalendarDashboard />} />
          <Route path="/people" element={<PeopleDashboard />} />
          <Route path="/people/:id" element={<Person />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
