export function formatSEK(value: number): string {
  return formatCurrency(value, 'SEK')
}

export function formatCurrency(value: number, currency: string = 'SEK'): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: currency === 'SEK' ? 0 : 2,
  }).format(value)
}

export const CURRENCIES = ['SEK', 'EUR', 'USD', 'GBP', 'NOK', 'DKK'] as const
export type Currency = typeof CURRENCIES[number]

export function formatYears(years: number): string {
  if (years <= 0) return '✅ Achieved!'
  if (years < 0) return '∞'
  return `${years.toFixed(1)} years`
}
