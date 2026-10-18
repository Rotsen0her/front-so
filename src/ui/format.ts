// Formateo de valores para mostrarlos al usuario.

export function fmtBytes(bytes: number | null): string {
  if (bytes === null) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export function fmtPercent(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Color estable por proceso (el ángulo áureo separa bien los tonos). */
export function colorOf(index: number): string {
  return `hsl(${(index * 137.5) % 360} 62% 50%)`
}
