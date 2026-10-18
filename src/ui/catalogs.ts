import { ApiError, getCatalog, listCatalogs } from '../api/client.ts'
import type { CatalogDetail, CatalogPage, CatalogSummary } from '../api/types.ts'
import { fmtDate } from './format.ts'
import { esc } from './html.ts'

const PAGE_SIZE = 6

const SELECTION_LABEL: Record<string, string> = { cpu: 'CPU', memory: 'Memoria' }

const errorMessage = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback)

function rowHtml(catalog: CatalogSummary, isSelected: boolean): string {
  const selection = SELECTION_LABEL[catalog.selectionOrder] ?? esc(catalog.selectionOrder)
  return `
    <tr data-number="${catalog.number}" class="${isSelected ? 'selected' : ''}" tabindex="0">
      <td class="num">${catalog.number}</td>
      <td>${esc(catalog.name)}</td>
      <td>${selection}</td>
      <td class="num">${catalog.processCount}</td>
      <td>${fmtDate(catalog.capturedAt)}</td>
    </tr>`
}

/** Tabla de catálogos paginada. Al elegir una fila se carga el catálogo completo. */
export function mountCatalogs(root: HTMLElement, onSelected: (catalog: CatalogDetail) => void) {
  let page = 1
  let data: CatalogPage | null = null
  let selectedNumber: number | null = null
  let error = ''
  let loading = false
  let latestRequest = 0 // descarta respuestas viejas si el usuario cambia de página rápido

  root.innerHTML = `
    <div class="section-head">
      <h2>1. Catálogo de procesos</h2>
      <button type="button" id="cat-refresh">Actualizar</button>
    </div>
    <div id="cat-body"></div>
    <div class="pager">
      <button type="button" id="cat-prev">‹ Anterior</button>
      <span id="cat-page"></span>
      <button type="button" id="cat-next">Siguiente ›</button>
    </div>`

  const body = root.querySelector<HTMLElement>('#cat-body')!
  const prevButton = root.querySelector<HTMLButtonElement>('#cat-prev')!
  const nextButton = root.querySelector<HTMLButtonElement>('#cat-next')!
  const pageLabel = root.querySelector<HTMLElement>('#cat-page')!

  function bodyHtml(): string {
    if (error) return `<p class="notice error">${esc(error)}</p>`
    if (!data) return '<p class="notice">Cargando catálogos…</p>'
    if (data.items.length === 0) {
      return '<p class="notice">Todavía no hay catálogos. Genera uno desde la aplicación de escritorio.</p>'
    }
    const rows = data.items.map((c) => rowHtml(c, c.number === selectedNumber)).join('')
    return `
      <table class="clickable">
        <thead><tr>
          <th class="num">N.°</th><th>Nombre</th><th>Selección</th><th class="num">Procesos</th><th>Capturado</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`
  }

  function render() {
    const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1
    prevButton.disabled = loading || page <= 1
    nextButton.disabled = loading || page >= totalPages
    pageLabel.textContent = data ? `Página ${page} de ${totalPages} · ${data.totalCount} catálogos` : ''
    body.innerHTML = bodyHtml()
  }

  async function loadPage(target: number) {
    const request = ++latestRequest
    loading = true
    error = ''
    render()

    try {
      const result = await listCatalogs(target, PAGE_SIZE)
      if (request !== latestRequest) return
      data = result
      page = result.page
    } catch (e) {
      if (request !== latestRequest) return
      error = errorMessage(e, 'Error inesperado al listar los catálogos.')
    }
    loading = false
    render()
  }

  async function select(number: number) {
    selectedNumber = number
    render()
    try {
      onSelected(await getCatalog(number))
    } catch (e) {
      error = errorMessage(e, 'Error inesperado al cargar el catálogo.')
      render()
    }
  }

  /** Número de catálogo de la fila donde ocurrió el evento (si hubo una). */
  function numberFromEvent(event: Event): number | null {
    const row = (event.target as HTMLElement).closest<HTMLElement>('tr[data-number]')
    return row ? Number(row.dataset.number) : null
  }

  body.addEventListener('click', (event) => {
    const number = numberFromEvent(event)
    if (number !== null) void select(number)
  })

  // Accesibilidad: Enter o espacio eligen la fila enfocada.
  body.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const number = numberFromEvent(event)
    if (number === null) return
    event.preventDefault()
    void select(number)
  })

  prevButton.addEventListener('click', () => void loadPage(page - 1))
  nextButton.addEventListener('click', () => void loadPage(page + 1))
  root.querySelector('#cat-refresh')!.addEventListener('click', () => void loadPage(page))

  void loadPage(1)
}
