import type { Simulation } from '../../sim/simulation.ts'
import { dot, esc } from '../html.ts'

/** Archivo virtual que escribe el proceso que tiene (o tuvo por última vez) la CPU. */
export function renderFile(sim: Simulation): string {
  const lastSegment = sim.segments[sim.segments.length - 1]
  const process = sim.running ?? (lastSegment ? sim.procs[lastSegment.index] : null)

  if (!process) {
    return '<p class="notice">Cuando inicie la simulación verás aquí el archivo que escribe cada proceso.</p>'
  }

  const pendingText = [...process.description].slice(process.copiedChars).join('')
  return `
    <div class="file">
      <div class="file-head">
        ${dot(process)}
        <strong>${esc(process.name)}.txt</strong>
        <span class="muted">${process.copiedChars} de ${process.totalChars} caracteres copiados</span>
      </div>
      <pre>${esc(process.file)}<span class="pending">${esc(pendingText)}</span></pre>
    </div>`
}
