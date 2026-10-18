// Piezas de HTML que se repiten en varias vistas.
import type { SimProcess } from '../sim/types.ts'
import { colorOf } from './format.ts'

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Escapa texto que viene de la API antes de meterlo en un template HTML. */
export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char])
}

/** Puntico con el color del proceso. */
export function dot(process: SimProcess): string {
  return `<span class="dot" style="background:${colorOf(process.index)}"></span>`
}

/** Etiqueta "Expulsivo" / "No expulsivo". */
export function kindTag(process: SimProcess): string {
  return process.preemptive
    ? '<span class="tag exp">Expulsivo</span>'
    : '<span class="tag noexp">No expulsivo</span>'
}
