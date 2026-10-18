import type { CatalogDetail, CatalogPage, ProblemDetails } from './types.ts'

const DEFAULT_URL = 'https://api-schedule.salesconnect.dev'
const BASE_URL = (import.meta.env.URL_API || DEFAULT_URL).replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  problem: ProblemDetails | null

  constructor(message: string, status: number, problem: ProblemDetails | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers: { Accept: 'application/json' } })
  } catch {
    throw new ApiError('No se pudo conectar con la API.', 0, null)
  }

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as ProblemDetails | null
    const message = problem?.detail || problem?.title || `La API respondió ${res.status}.`
    throw new ApiError(message, res.status, problem)
  }
  return (await res.json()) as T
}

export function listCatalogs(page: number, pageSize: number): Promise<CatalogPage> {
  return get<CatalogPage>(`/api/catalogs?page=${page}&pageSize=${pageSize}`)
}

export function getCatalog(number: number): Promise<CatalogDetail> {
  return get<CatalogDetail>(`/api/catalogs/${number}`)
}
