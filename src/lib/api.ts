export const API_URL = (
  import.meta.env.VITE_API_URL ?? "https://api-schedule.salesconnect.dev"
).replace(/\/$/, "")

export type SelectionOrder = "cpu" | "memory"

/** 0 = expulsivo, 1 = no expulsivo */
export type Priority = 0 | 1

export interface CatalogSummary {
  number: number
  name: string
  capturedAt: string
  createdAt: string
  selectionOrder: SelectionOrder
  processCount: number
}

export interface CatalogPage {
  items: CatalogSummary[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ProcessSnapshot {
  position: number
  pid: number
  name: string
  user: string | null
  description: string | null
  priority: Priority
  cpuUsagePercent: number | null
  memoryUsageBytes: number | null
}

export interface CatalogDetail extends CatalogSummary {
  processes: ProcessSnapshot[]
}

export interface Readiness {
  status: "ready" | "unavailable"
}

export const endpoints = {
  catalogs: (page = 1, pageSize = 100) =>
    `${API_URL}/api/catalogs?page=${page}&pageSize=${pageSize}`,
  catalog: (number: number) => `${API_URL}/api/catalogs/${number}`,
  health: () => `${API_URL}/health`,
}

export async function getJson<T>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new Error(problem?.title ?? `Error ${response.status}`)
  }
  return response.json() as Promise<T>
}
