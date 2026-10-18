import type { ProcessSnapshot } from '../api/types.ts'
import { buildProcesses } from './process.ts'
import { ProcessThread } from './processThread.ts'
import type { Segment, SimConfig, SimProcess, SimStatus } from './types.ts'

/**
 * Simulación Round Robin con el modelo de estados Listo → Ejecución → Terminado.
 *
 * - Un proceso expulsivo usa la CPU durante un quantum y vuelve al final de la cola.
 * - Un proceso no expulsivo usa la CPU hasta terminar.
 * - El reloj (`clock`) es virtual: avanza TH ms por cada carácter copiado.
 *
 * La interfaz se entera de los cambios con `subscribe`.
 */
export class Simulation {
  readonly config: SimConfig
  readonly procs: SimProcess[]
  /** Caracteres que un proceso expulsivo copia por turno (quantum ÷ TH, mínimo 1). */
  readonly sliceChars: number

  status: SimStatus = 'idle'
  /** Reloj virtual, en ms. */
  clock = 0

  /** Aún no llegan (ordenados por tiempo de llegada). */
  incoming: SimProcess[]
  /** Cola de LISTO: el primero es el siguiente en usar la CPU. */
  ready: SimProcess[] = []
  /** Proceso que tiene la CPU ahora mismo. */
  running: SimProcess | null = null
  finished: SimProcess[] = []
  /** Historial de usos de CPU, para el gráfico. */
  segments: Segment[] = []

  private threads = new Map<number, ProcessThread>()
  private listeners: (() => void)[] = []
  private resumeCallbacks: (() => void)[] = []
  private disposed = false

  constructor(snapshots: ProcessSnapshot[], config: SimConfig) {
    this.config = config
    this.procs = buildProcesses(snapshots, config.th)
    this.incoming = [...this.procs]
    this.sliceChars = Math.max(1, Math.floor(config.quantum / config.th))
  }

  // ---- Control (lo que usa la interfaz) ----

  subscribe(listener: () => void) {
    this.listeners.push(listener)
  }

  start() {
    if (this.status !== 'idle') return
    this.status = 'running'
    this.emit()
    void this.run()
  }

  pause() {
    if (this.status !== 'running') return
    this.status = 'paused'
    this.threads.forEach((thread) => thread.pause())
    this.emit()
  }

  resume() {
    if (this.status !== 'paused') return
    this.status = 'running'
    this.threads.forEach((thread) => thread.resume())
    this.wakeWaiters()
    this.emit()
  }

  /** Detiene todo y libera los hilos. La simulación no se puede reutilizar. */
  dispose() {
    this.disposed = true
    this.threads.forEach((thread) => thread.terminate())
    this.threads.clear()
    this.listeners = []
    this.wakeWaiters()
  }

  // ---- Planificador ----

  private async run() {
    while (!this.disposed) {
      await this.waitWhilePaused()
      if (this.disposed) return

      this.admitArrivals()
      const next = this.ready.shift()

      if (next) {
        await this.giveCpuTo(next)
      } else if (this.incoming.length > 0) {
        // Nadie está listo: el reloj salta hasta la próxima llegada.
        this.clock = Math.max(this.clock, this.incoming[0].arrival)
      } else {
        break
      }
    }

    if (this.disposed) return
    this.status = 'finished'
    this.emit()
  }

  /** Pasa a LISTO los procesos cuyo tiempo de llegada ya se cumplió. */
  private admitArrivals() {
    while (this.incoming.length > 0 && this.incoming[0].arrival <= this.clock) {
      const process = this.incoming.shift()!
      process.state = 'listo'
      this.ready.push(process)
    }
  }

  /** Cuántos caracteres copia el proceso en este turno. */
  private turnLength(process: SimProcess): number {
    const remaining = process.totalChars - process.copiedChars
    return process.preemptive ? Math.min(this.sliceChars, remaining) : remaining
  }

  /** Un turno de CPU: el proceso copia caracteres y luego termina o vuelve a LISTO. */
  private async giveCpuTo(process: SimProcess) {
    const segment: Segment = { index: process.index, start: this.clock, end: this.clock }
    this.segments.push(segment)
    process.state = 'ejecucion'
    process.executions++
    this.running = process

    const thread = this.threadFor(process)
    let copiedThisTurn = 0
    thread.onChar = (copied, char) => {
      copiedThisTurn++
      process.copiedChars = copied
      process.file += char
      segment.end = segment.start + copiedThisTurn * this.config.th
      this.clock = segment.end
      this.emit()
    }
    this.emit()

    await thread.run(this.turnLength(process))
    if (this.disposed) return

    this.running = null
    this.admitArrivals() // los que llegaron durante el turno van antes que el expulsado
    if (process.copiedChars >= process.totalChars) {
      this.terminate(process, thread)
    } else {
      process.state = 'listo'
      this.ready.push(process)
    }
    this.emit()
  }

  private terminate(process: SimProcess, thread: ProcessThread) {
    process.state = 'terminado'
    process.finish = this.clock
    this.finished.push(process)
    thread.terminate()
    this.threads.delete(process.index)
  }

  // ---- Hilos y pausa ----

  /** Cada proceso tiene su propio hilo, que se crea la primera vez que usa la CPU. */
  private threadFor(process: SimProcess): ProcessThread {
    let thread = this.threads.get(process.index)
    if (!thread) {
      thread = new ProcessThread(process.description, this.config.th, this.status === 'paused')
      this.threads.set(process.index, thread)
    }
    return thread
  }

  private async waitWhilePaused() {
    while (this.status === 'paused' && !this.disposed) {
      await new Promise<void>((resolve) => this.resumeCallbacks.push(resolve))
    }
  }

  private wakeWaiters() {
    const callbacks = this.resumeCallbacks
    this.resumeCallbacks = []
    callbacks.forEach((callback) => callback())
  }

  private emit() {
    this.listeners.forEach((listener) => listener())
  }
}
