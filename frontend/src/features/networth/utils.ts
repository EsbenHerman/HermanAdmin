export function formatSEK(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatYears(years: number): string {
  if (years <= 0) return '✅ Achieved!'
  if (years < 0) return '∞'
  return `${years.toFixed(1)} years`
}
