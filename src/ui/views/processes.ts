import type { SimProcess } from '../../sim/types.ts'
import { fmtBytes, fmtPercent } from '../format.ts'
import { dot, esc, kindTag } from '../html.ts'

function row(p: SimProcess): string {
  return `
    <tr>
      <td class="num">${p.index + 1}</td>
      <td class="num">${p.pid}</td>
      <td>${dot(p)}${esc(p.name)}</td>
      <td>${p.user ? esc(p.user) : '—'}</td>
      <td class="desc">${p.description ? esc(p.description) : '<em>sin descripción</em>'}</td>
      <td>${kindTag(p)}</td>
      <td class="num">${p.labPriority}</td>
      <td class="num">${p.windowsPriority}</td>
      <td class="num">${fmtPercent(p.cpuUsagePercent)}</td>
      <td class="num">${fmtBytes(p.memoryUsageBytes)}</td>
      <td class="num">${p.totalChars}</td>
      <td class="num">${p.burst}</td>
      <td class="num">${p.arrival}</td>
    </tr>`
}

/** Avisa de los procesos sin descripción: su ráfaga es 0. */
function emptyDescriptionWarning(procs: SimProcess[]): string {
  const count = procs.filter((p) => p.totalChars === 0).length
  if (count === 0) return ''
  return `<p class="notice warn">${count} proceso(s) no tienen descripción: su ráfaga es 0 y terminan apenas reciben la CPU.</p>`
}

/** Listado de los procesos del catálogo con sus tiempos calculados. */
export function renderProcesses(procs: SimProcess[]): string {
  return `
    ${emptyDescriptionWarning(procs)}
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th class="num">#</th>
          <th class="num">PID</th>
          <th>Nombre</th>
          <th>Usuario</th>
          <th>Descripción</th>
          <th>Tipo</th>
          <th class="num" title="Prioridad asignada: 0 = expulsivo, 1 = no expulsivo">P.R</th>
          <th class="num" title="Prioridad base de Windows">Prio. Win</th>
          <th class="num">CPU</th>
          <th class="num">Memoria</th>
          <th class="num" title="Caracteres de la descripción">Car.</th>
          <th class="num" title="Ráfaga = TH × caracteres">R (ms)</th>
          <th class="num" title="Tiempo de llegada">T.L (ms)</th>
        </tr></thead>
        <tbody>${procs.map(row).join('')}</tbody>
      </table>
    </div>`
}
