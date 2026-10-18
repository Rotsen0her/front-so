import type { Simulation } from '../../sim/simulation.ts'
import { colorOf } from '../format.ts'
import { dot, esc } from '../html.ts'

const PX_PER_CHAR = 14 // ancho en pantalla de un carácter (= TH ms)
const ROW_HEIGHT = 30
const AXIS_HEIGHT = 26
const NEAR_END_PX = 60 // si el usuario está a menos de esto del final, el gráfico lo sigue

export interface GanttElements {
  labels: HTMLElement
  scroll: HTMLElement
  canvas: HTMLElement
}

function labelsHtml(sim: Simulation): string {
  const rows = sim.procs
    .map(
      (p) => `
      <div class="g-label" style="height:${ROW_HEIGHT}px" title="${esc(p.name)}">
        ${dot(p)}${esc(p.name)}
      </div>`,
    )
    .join('')
  return `<div class="g-axis-label" style="height:${AXIS_HEIGHT}px">Proceso</div>${rows}`
}

/** Marcas del eje de tiempo: una cada `step` caracteres, rotulada en ms. */
function axisHtml(totalChars: number, th: number): string {
  const step = totalChars > 1000 ? 50 : 5
  let ticks = ''
  for (let chars = 0; chars <= totalChars + step; chars += step) {
    ticks += `<span class="tick" style="left:${chars * PX_PER_CHAR}px">${chars * th}</span>`
  }
  return `<div class="g-axis" style="height:${AXIS_HEIGHT}px">${ticks}</div>`
}

/** Una fila por proceso, con una barra por cada vez que usó la CPU. */
function rowsHtml(sim: Simulation, toPx: (ms: number) => number): string {
  const barsByProcess: string[] = sim.procs.map(() => '')

  for (const segment of sim.segments) {
    const p = sim.procs[segment.index]
    const left = toPx(segment.start)
    const width = Math.max(toPx(segment.end - segment.start), 3)
    barsByProcess[segment.index] += `
      <div class="g-bar" style="left:${left}px;width:${width}px;background:${colorOf(p.index)}"
        title="${esc(p.name)}: ${segment.start}–${segment.end} ms"></div>`
  }

  return barsByProcess
    .map((bars) => `<div class="g-row" style="height:${ROW_HEIGHT}px">${bars}</div>`)
    .join('')
}

/** Gráfico de comportamiento (Gantt). Se redibuja completo en cada actualización. */
export function renderGantt(sim: Simulation, { labels, scroll, canvas }: GanttElements) {
  const th = sim.config.th
  const toPx = (ms: number) => (ms / th) * PX_PER_CHAR
  const totalChars = sim.procs.reduce((sum, p) => sum + p.totalChars, 0)

  labels.innerHTML = labelsHtml(sim)

  const wasNearEnd = scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft < NEAR_END_PX
  canvas.style.width = `${Math.max(totalChars * PX_PER_CHAR + 40, 200)}px`
  canvas.innerHTML =
    axisHtml(totalChars, th) +
    rowsHtml(sim, toPx) +
    `<div class="g-now" style="left:${toPx(sim.clock)}px"></div>`

  if (sim.status === 'running' && wasNearEnd) scroll.scrollLeft = scroll.scrollWidth
}
