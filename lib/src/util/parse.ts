export function parseNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = parseInt(value)
  return isNaN(parsed) ? fallback : parsed
}