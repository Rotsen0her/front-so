import type { SimProcess } from '../../sim/types.ts'
import { dot, esc } from '../html.ts'

/** Turnaround (T.R) = tiempo de finalización − tiempo de llegada. */
const turnaround = (p: SimProcess) => p.finish! - p.arrival

function row(p: SimProcess): string {
  const done = p.finish !== null
  return `
    <tr>
      <td>${dot(p)}${esc(p.name)}</td>
      <td class="num">${p.arrival}</td>
      <td class="num">${p.burst}</td>
      <td class="num">${p.labPriority}</td>
      <td class="num">${done ? turnaround(p) : '—'}</td>
      <td class="num">${done ? p.finish : '—'}</td>
      <td class="num">${p.executions}</td>
    </tr>`
}

function averageTurnaround(procs: SimProcess[]): string {
  const done = procs.filter((p) => p.finish !== null)
  if (done.length === 0) return '—'
  const total = done.reduce((sum, p) => sum + turnaround(p), 0)
  return (total / done.length).toFixed(1)
}

function table(procs: SimProcess[], emptyMessage: string): string {
  if (procs.length === 0) return `<p class="notice">${emptyMessage}</p>`
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th title="Nombre del proceso">P</th>
          <th class="num" title="Tiempo de llegada">T.L</th>
          <th class="num" title="Ráfaga">R</th>
          <th class="num" title="Prioridad asignada">P.R</th>
          <th class="num" title="Turnaround = T.F − T.L">T.R</th>
          <th class="num" title="Tiempo de finalización">T.F</th>
          <th class="num" title="Veces que usó la CPU">Ejec.</th>
        </tr></thead>
        <tbody>${procs.map(row).join('')}</tbody>
        <tfoot><tr>
          <td colspan="4">Turnaround promedio</td>
          <td class="num">${averageTurnaround(procs)}</td>
          <td colspan="2"></td>
        </tr></tfoot>
      </table>
    </div>`
}

/** Listado de ejecución (todos) y listado de procesos no expulsivos. */
export function renderReports(procs: SimProcess[]): { all: string; nonPreemptive: string } {
  return {
    all: table(procs, 'No hay procesos.'),
    nonPreemptive: table(
      procs.filter((p) => !p.preemptive),
      'Este catálogo no tiene procesos no expulsivos.',
    ),
  }
}
