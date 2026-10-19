const integer = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 })
const date = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
})

export const formatMs = (value: number) => `${integer.format(value)} ms`
export const formatNumber = (value: number) => integer.format(value)
export const formatDecimal = (value: number) => decimal.format(value)
export const formatDate = (value: string) => date.format(new Date(value))

export function formatBytes(bytes: number | null) {
  if (bytes === null) return "—"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${decimal.format(value)} ${units[unit]}`
}

export const priorityLabel = (priority: number) =>
  priority === 1 ? "No expulsivo" : "Expulsivo"
