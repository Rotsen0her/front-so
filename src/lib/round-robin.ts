import type { Priority, ProcessSnapshot } from "@/lib/api"

export interface SimulationParams {
  /** Milisegundos que tarda el hilo en copiar un carácter (TH). */
  th: number
  /** Tiempo máximo en CPU por turno para procesos expulsivos (ms). */
  quantum: number
}

export interface SimProcess {
  id: number
  pid: number
  name: string
  user: string | null
  priority: Priority
  /** Texto que el proceso escribe en su archivo. */
  content: string
  fileName: string
  /** T.L */
  arrival: number
  /** R = TH × caracteres */
  burst: number
}

export interface Slice {
  processId: number
  start: number
  end: number
  /** Tiempo ya ejecutado por el proceso antes de este turno. */
  doneBefore: number
  /** Cola de listos mientras corre este turno. */
  ready: number[]
}

export interface ProcessResult {
  id: number
  /** T.F */
  finish: number
  /** T.R = T.F − T.L */
  turnaround: number
  waiting: number
  /** Veces que el proceso usó la CPU. */
  executions: number
}

export interface Schedule {
  params: SimulationParams
  processes: SimProcess[]
  slices: Slice[]
  slicesByProcess: Slice[][]
  results: ProcessResult[]
  duration: number
}

export type ProcessState = "nuevo" | "listo" | "ejecucion" | "terminado"

export interface Snapshot {
  time: number
  running: { processId: number; slice: Slice } | null
  ready: number[]
  finished: number[]
  /** Milisegundos de CPU consumidos por cada proceso al instante `time`. */
  executed: number[]
  states: ProcessState[]
}

const MAX_SLICES = 200_000

export class ScheduleTooLargeError extends Error {}

export function toSimProcesses(
  snapshots: ProcessSnapshot[],
  th: number
): SimProcess[] {
  return snapshots.map((snapshot, index) => {
    // Sin descripción del SO, el proceso escribe su propio nombre.
    const content = snapshot.description || snapshot.name
    return {
      id: index,
      pid: snapshot.pid,
      name: snapshot.name,
      user: snapshot.user,
      priority: snapshot.priority,
      content,
      fileName: `${snapshot.name}`,
      // Listo vacío → 0; si no, llegada del último + 1.
      arrival: index,
      burst: th * content.length,
    }
  })
}

export function buildSchedule(
  snapshots: ProcessSnapshot[],
  params: SimulationParams
): Schedule {
  const { th, quantum } = params
  const processes = toSimProcesses(snapshots, th)

  const estimate = processes.reduce(
    (total, p) => total + (p.priority === 1 ? 1 : Math.ceil(p.burst / quantum)),
    0
  )
  if (estimate > MAX_SLICES) {
    throw new ScheduleTooLargeError(
      "El quantum es demasiado pequeño para este catálogo."
    )
  }

  const remaining = processes.map((p) => p.burst)
  const executions = processes.map(() => 0)
  const finish = processes.map(() => 0)
  const slices: Slice[] = []
  const slicesByProcess: Slice[][] = processes.map(() => [])
  const queue: number[] = []

  let time = 0
  let nextArrival = 0
  let finishedCount = 0

  const admitUntil = (instant: number) => {
    while (
      nextArrival < processes.length &&
      processes[nextArrival].arrival <= instant
    ) {
      queue.push(nextArrival++)
    }
  }

  admitUntil(0)

  while (finishedCount < processes.length) {
    if (queue.length === 0) {
      time = processes[nextArrival].arrival
      admitUntil(time)
      continue
    }

    const id = queue.shift()!
    const process = processes[id]
    const run =
      process.priority === 1 ? remaining[id] : Math.min(quantum, remaining[id])

    const slice: Slice = {
      processId: id,
      start: time,
      end: time + run,
      doneBefore: process.burst - remaining[id],
      ready: [...queue],
    }
    slices.push(slice)
    slicesByProcess[id].push(slice)

    time += run
    remaining[id] -= run
    executions[id]++

    // Los que llegaron durante el turno entran antes que el expulsado.
    admitUntil(time)

    if (remaining[id] > 0) {
      queue.push(id)
    } else {
      finish[id] = time
      finishedCount++
    }
  }

  const results = processes
    .map((p) => ({
      id: p.id,
      finish: finish[p.id],
      turnaround: finish[p.id] - p.arrival,
      waiting: finish[p.id] - p.arrival - p.burst,
      executions: executions[p.id],
    }))
    .sort((a, b) => a.finish - b.finish || a.id - b.id)

  return {
    params,
    processes,
    slices,
    slicesByProcess,
    results,
    duration: time,
  }
}

/** Índice del último elemento con `start <= time`, o -1. */
function lastStartedIndex(slices: Slice[], time: number) {
  let low = 0
  let high = slices.length - 1
  let found = -1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (slices[mid].start <= time) {
      found = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return found
}

export function snapshotAt(schedule: Schedule, time: number): Snapshot {
  const { processes, slices, slicesByProcess, results } = schedule

  const executed = processes.map((p) => {
    const own = slicesByProcess[p.id]
    const index = lastStartedIndex(own, time)
    if (index === -1) return 0
    const slice = own[index]
    return slice.doneBefore + Math.min(time, slice.end) - slice.start
  })

  const finished = results.filter((r) => r.finish <= time).map((r) => r.id)
  const finishedSet = new Set(finished)

  const index = lastStartedIndex(slices, time)
  const current = index === -1 ? null : slices[index]
  const isRunning =
    current !== null &&
    time < current.end &&
    !finishedSet.has(current.processId)

  let ready: number[] = []
  if (current && isRunning) {
    const queued = new Set(current.ready)
    const arrivedDuringSlice = processes
      .filter(
        (p) =>
          p.arrival > current.start &&
          p.arrival <= time &&
          !queued.has(p.id) &&
          p.id !== current.processId
      )
      .map((p) => p.id)
    ready = [...current.ready, ...arrivedDuringSlice]
  }

  const readySet = new Set(ready)
  const states = processes.map<ProcessState>((p) => {
    if (finishedSet.has(p.id)) return "terminado"
    if (isRunning && current!.processId === p.id) return "ejecucion"
    if (readySet.has(p.id)) return "listo"
    return p.arrival <= time ? "listo" : "nuevo"
  })

  return {
    time,
    running: isRunning
      ? { processId: current!.processId, slice: current! }
      : null,
    ready,
    finished,
    executed,
    states,
  }
}

export function charsWritten(
  process: SimProcess,
  executed: number,
  th: number
) {
  return Math.min(process.content.length, Math.floor(executed / th + 1e-9))
}
