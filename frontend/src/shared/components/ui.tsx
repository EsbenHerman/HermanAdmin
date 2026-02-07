import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { Link, useLocation, type LinkProps } from 'react-router-dom'

// Button
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'xs' | 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

const buttonSizes: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${buttonVariants[variant]} ${buttonSizes[size]} ${className} ${loading ? 'opacity-70 cursor-wait' : ''}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`${error ? 'input-error' : 'input'} ${className}`}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

// Select
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`${error ? 'input-error' : 'select'} ${className}`}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

// Label
interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  className?: string
}

export function Label({ children, htmlFor, className = '' }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`label ${className}`}>
      {children}
    </label>
  )
}

// Card
interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const cardPadding = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, className = '', hover = false, padding = 'md' }: CardProps) {
  return (
    <div className={`${hover ? 'card-hover' : 'card'} ${cardPadding[padding]} ${className}`}>
      {children}
    </div>
  )
}

// Metric Card
interface MetricCardProps {
  label: string
  value: string | number
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export function MetricCard({ label, value, icon, trend, trendValue, className = '' }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'metric-positive' : trend === 'down' ? 'metric-negative' : 'text-gray-500'
  
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
          {trendValue && (
            <p className={`text-sm font-medium ${trendColor}`}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <span className="text-2xl opacity-80">{icon}</span>
        )}
      </div>
    </Card>
  )
}

// NavLink
interface NavLinkProps extends Omit<LinkProps, 'className'> {
  children: React.ReactNode
  icon?: React.ReactNode
}

export function NavLink({ to, children, icon }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to as string))

  return (
    <Link
      to={to}
      className={isActive ? 'nav-link-active' : 'nav-link-inactive'}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Link>
  )
}

// Badge
type BadgeVariant = 'gray' | 'primary' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`badge-${variant} ${className}`}>
      {children}
    </span>
  )
}

// Page Header
interface PageHeaderProps {
  title: string
  subtitle?: string
  backLink?: string
  backLabel?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, backLink, backLabel = '← Back', actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        {backLink && (
          <Link to={backLink} className="link-subtle text-sm mb-1 inline-block hover:underline">
            {backLabel}
          </Link>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="section-subtitle mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}

// Section
interface SectionProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function Section({ title, subtitle, children, className = '', actions }: SectionProps) {
  return (
    <div className={className}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

// Empty State
interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <span className="text-4xl mb-3 block">{icon}</span>}
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  )
}

// Table wrapper for consistent styling
interface TableContainerProps {
  children: React.ReactNode
  className?: string
}

export function TableContainer({ children, className = '' }: TableContainerProps) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  )
}

// Form Field wrapper
interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, htmlFor, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
    </div>
  )
}
