import type { CatalogDetail } from '../api/types.ts'
import { Simulation } from '../sim/simulation.ts'
import type { SimConfig, SimStatus } from '../sim/types.ts'
import { mountCatalogs } from './catalogs.ts'
import { esc } from './html.ts'
import { renderFile } from './views/file.ts'
import { renderGantt } from './views/gantt.ts'
import { renderProcesses } from './views/processes.ts'
import { renderReports } from './views/reports.ts'
import { renderStates } from './views/states.ts'

const STATUS_LABEL: Record<SimStatus, string> = {
  idle: 'Listo para iniciar',
  running: 'En ejecución',
  paused: 'Pausada',
  finished: 'Finalizada',
}

/** Texto del botón principal según el estado de la simulación. */
const PRIMARY_LABEL: Record<SimStatus, string> = {
  idle: 'Iniciar',
  running: 'Pausar',
  paused: 'Reanudar',
  finished: 'Iniciar',
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

/**
 * Conecta la página (index.html) con el catálogo elegido y la simulación.
 *
 * Flujo: elegir catálogo → `rebuild()` crea una Simulation en reposo →
 * la simulación avisa cada cambio y `render()` redibuja todas las vistas.
 */
export function mountApp() {
  const thInput = byId<HTMLInputElement>('th')
  const quantumInput = byId<HTMLInputElement>('quantum')
  const primaryButton = byId<HTMLButtonElement>('primary')
  const resetButton = byId<HTMLButtonElement>('reset')

  let catalog: CatalogDetail | null = null
  let sim: Simulation | null = null
  let renderQueued = false

  /** TH y quantum válidos (enteros ≥ 1), o null si el usuario escribió otra cosa. */
  function readConfig(): SimConfig | null {
    const th = Number(thInput.value)
    const quantum = Number(quantumInput.value)
    const isValid = (n: number) => Number.isInteger(n) && n >= 1
    return isValid(th) && isValid(quantum) ? { th, quantum } : null
  }

  /** Agrupa los cambios que llegan en ráfaga en un solo redibujado por frame. */
  function queueRender() {
    if (renderQueued) return
    renderQueued = true
    requestAnimationFrame(() => {
      renderQueued = false
      render()
    })
  }

  /** Descarta la simulación actual y crea una nueva, en reposo, con los parámetros actuales. */
  function rebuild() {
    const config = readConfig()
    if (catalog && config) {
      sim?.dispose()
      sim = new Simulation(catalog.processes, config)
      sim.subscribe(queueRender)
      byId('processes').innerHTML = renderProcesses(sim.procs)
    }
    render()
  }

  function render() {
    if (!sim || !catalog) return
    renderControls(sim)
    renderStatus(sim, catalog)
    renderViews(sim)
  }

  function renderControls(sim: Simulation) {
    const config = readConfig()
    const idle = sim.status === 'idle'

    thInput.disabled = !idle
    quantumInput.disabled = !idle
    primaryButton.textContent = PRIMARY_LABEL[sim.status]
    primaryButton.disabled = sim.status === 'finished' || (idle && !config)

    byId('config-hint').innerHTML = config
      ? `Cada turno de un proceso expulsivo copia <strong>${sim.sliceChars}</strong> carácter(es) (quantum ÷ TH, mínimo 1). Los procesos no expulsivos se ejecutan hasta terminar.`
      : '<span class="error-text">TH y quantum deben ser enteros mayores o iguales a 1.</span>'
  }

  function renderStatus(sim: Simulation, catalog: CatalogDetail) {
    byId('status').innerHTML = `
      <span><b>Estado</b> ${STATUS_LABEL[sim.status]}</span>
      <span><b>Reloj</b> ${sim.clock} ms</span>
      <span><b>Terminados</b> ${sim.finished.length}/${sim.procs.length}</span>
      <span><b>Catálogo</b> #${catalog.number}</span>`
    byId('catalog-name').innerHTML = `${esc(catalog.name)} · ${sim.procs.length} procesos`
  }

  function renderViews(sim: Simulation) {
    const reports = renderReports(sim.procs)
    byId('states').innerHTML = renderStates(sim)
    byId('file').innerHTML = renderFile(sim)
    byId('report-all').innerHTML = reports.all
    byId('report-non').innerHTML = reports.nonPreemptive
    renderGantt(sim, {
      labels: byId('g-labels'),
      scroll: byId('g-scroll'),
      canvas: byId('g-canvas'),
    })
  }

  // ---- Eventos ----

  primaryButton.addEventListener('click', () => {
    if (sim?.status === 'idle') sim.start()
    else if (sim?.status === 'running') sim.pause()
    else if (sim?.status === 'paused') sim.resume()
  })

  resetButton.addEventListener('click', rebuild)

  // Mientras la simulación está en reposo, cambiar TH o quantum recalcula todo.
  for (const input of [thInput, quantumInput]) {
    input.addEventListener('input', () => {
      if (sim?.status === 'idle') rebuild()
    })
  }

  mountCatalogs(byId('catalogs'), (selected) => {
    catalog = selected
    byId('workspace').hidden = false
    rebuild()
    byId('workspace').scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
