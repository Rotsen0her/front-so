import type { Simulation } from '../../sim/simulation.ts'
import type { SimProcess } from '../../sim/types.ts'
import { colorOf } from '../format.ts'
import { esc, kindTag } from '../html.ts'

function card(p: SimProcess, isRunning: boolean): string {
  const percent = p.totalChars === 0 ? 100 : Math.round((p.copiedChars / p.totalChars) * 100)
  return `
    <li class="card ${isRunning ? 'current' : ''}" style="--c:${colorOf(p.index)}">
      <div class="card-top"><strong>${esc(p.name)}</strong><span class="muted">PID ${p.pid}</span></div>
      <div class="bar"><span style="width:${percent}%"></span></div>
      <div class="card-bottom">
        <span>${p.copiedChars}/${p.totalChars} car.</span>
        <span>${p.executions} ejec.</span>
        ${kindTag(p)}
      </div>
    </li>`
}

function column(title: string, hint: string, procs: SimProcess[], isRunning = false): string {
  const cards = procs.map((p) => card(p, isRunning)).join('')
  return `
    <div class="column">
      <h3>${title} <span class="count">${procs.length}</span></h3>
      <p class="muted small">${hint}</p>
      <ul class="cards">${cards || '<li class="empty">—</li>'}</ul>
    </div>`
}

/** Modelo de estados: Listo → Ejecución → Terminado. */
export function renderStates(sim: Simulation): string {
  const running = sim.running ? [sim.running] : []
  return `
    <div class="columns">
      ${column('Listo', 'Cola Round Robin: el primero toma la CPU.', sim.ready)}
      ${column('Ejecución', 'Un único proceso usa la CPU.', running, true)}
      ${column('Terminado', 'Completaron su actividad.', sim.finished)}
    </div>
    <p class="muted small">Pendientes de llegar: ${sim.incoming.length}</p>`
}
