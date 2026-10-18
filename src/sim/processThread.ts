import type { FromThread, ToThread } from './protocol.ts'

/** Envoltorio sobre el Worker que representa el hilo de ejecución de un proceso. */
export class ProcessThread {
  onChar: (copied: number, char: string) => void = () => {}

  private worker: Worker
  private sliceDone: (() => void) | null = null

  constructor(text: string, th: number, paused: boolean) {
    this.worker = new Worker(new URL('./thread.worker.ts', import.meta.url), { type: 'module' })
    this.worker.onmessage = (event: MessageEvent<FromThread>) => {
      const message = event.data
      if (message.type === 'char') {
        this.onChar(message.copied, message.char)
      } else {
        const done = this.sliceDone
        this.sliceDone = null
        done?.()
      }
    }
    this.post({ type: 'init', text, th })
    if (paused) this.post({ type: 'pause' })
  }

  /** Ejecuta hasta `chars` caracteres; se resuelve al terminar el turno. */
  run(chars: number): Promise<void> {
    return new Promise((resolve) => {
      this.sliceDone = resolve
      this.post({ type: 'run', chars })
    })
  }

  pause() {
    this.post({ type: 'pause' })
  }

  resume() {
    this.post({ type: 'resume' })
  }

  terminate() {
    this.worker.terminate()
    const done = this.sliceDone
    this.sliceDone = null
    done?.()
  }

  private post(message: ToThread) {
    this.worker.postMessage(message)
  }
}
