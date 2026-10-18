import type { ProcessSnapshot } from '../api/types.ts'
import type { SimProcess } from './types.ts'

/** Convierte los procesos del catálogo en procesos listos para simular. */
export function buildProcesses(snapshots: ProcessSnapshot[], th: number): SimProcess[] {
  return snapshots.map((snapshot, index) => {
    const description = snapshot.description ?? ''
    // [...texto] cuenta caracteres Unicode completos (no mitades de un emoji).
    const totalChars = [...description].length

    return {
      index,
      pid: snapshot.pid,
      name: snapshot.name,
      user: snapshot.user,
      description,
      windowsPriority: snapshot.priority,
      cpuUsagePercent: snapshot.cpuUsagePercent,
      memoryUsageBytes: snapshot.memoryUsageBytes,

      preemptive: snapshot.isPreemptive,
      labPriority: snapshot.isPreemptive ? 0 : 1,

      totalChars,
      burst: th * totalChars,
      // El primero llega en 0; cada uno después llega 1 ms tras el anterior.
      arrival: index,

      state: 'por-llegar',
      copiedChars: 0,
      executions: 0,
      finish: null,
      file: '',
    }
  })
}
