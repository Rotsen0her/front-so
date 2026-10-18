/** Estados de un proceso. 'por-llegar' es previo al modelo Listo → Ejecución → Terminado. */
export type ProcState = 'por-llegar' | 'listo' | 'ejecucion' | 'terminado'

export type SimStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface SimConfig {
  /** TH: milisegundos que tarda copiar un carácter. */
  th: number
  /** Quantum de Round Robin, en milisegundos. */
  quantum: number
}

export interface SimProcess {
  /** Posición del proceso en el catálogo (base 0). */
  index: number
  pid: number
  name: string
  user: string | null
  /** Texto que el proceso copia al archivo; vacío si el catálogo no trae descripción. */
  description: string
  windowsPriority: number
  cpuUsagePercent: number | null
  memoryUsageBytes: number | null

  preemptive: boolean
  /** Prioridad asignada del laboratorio: 0 = expulsivo, 1 = no expulsivo. */
  labPriority: 0 | 1

  /** Caracteres de la descripción (cada uno cuesta un TH). */
  totalChars: number
  /** Ráfaga (ms) = TH * totalChars. */
  burst: number
  /** Tiempo de llegada (ms). */
  arrival: number

  // Estado que cambia durante la simulación.
  state: ProcState
  copiedChars: number
  /** Veces que el proceso ha recibido la CPU. */
  executions: number
  /** Tiempo de finalización (ms); null mientras no termina. */
  finish: number | null
  /** Contenido del archivo virtual que el proceso va escribiendo. */
  file: string
}

/** Intervalo continuo en el que un proceso usó la CPU (una barra del Gantt). */
export interface Segment {
  index: number
  start: number
  end: number
}
