export type SelectionOrder = 'cpu' | 'memory'

export interface CatalogSummary {
  number: number
  name: string
  capturedAt: string
  createdAt: string
  selectionOrder: SelectionOrder | string
  processCount: number
}

export interface ProcessSnapshot {
  position: number
  pid: number
  name: string
  user: string | null
  description: string | null
  /** Prioridad base de Windows (0-31). */
  priority: number
  /** true = expulsivo (prioridad de laboratorio 0), false = no expulsivo (1). */
  isPreemptive: boolean
  cpuUsagePercent: number | null
  memoryUsageBytes: number | null
}

export interface CatalogDetail extends CatalogSummary {
  processes: ProcessSnapshot[]
}

export interface CatalogPage {
  items: CatalogSummary[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ProblemDetails {
  title?: string | null
  status?: number | null
  detail?: string | null
  errors?: Record<string, string[]>
}
