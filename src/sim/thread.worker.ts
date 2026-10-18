// Hilo de un proceso: copia su descripción a un archivo virtual, un carácter
// cada TH ms. Cada carácter copiado consume una unidad de ejecución.
import type { FromThread, ToThread } from './protocol.ts'

let chars: string[] = []
let th = 1
let copied = 0
let paused = false
let wake: (() => void) | null = null

const send = (message: FromThread) => self.postMessage(message)
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function untilResumed() {
  while (paused) {
    await new Promise<void>((resolve) => {
      wake = resolve
    })
  }
}

async function runSlice(count: number) {
  let done = 0
  while (done < count && copied < chars.length) {
    await untilResumed()
    await sleep(th)
    await untilResumed()
    const char = chars[copied]
    copied++
    done++
    send({ type: 'char', copied, char })
  }
  send({ type: 'slice', copied })
}

self.onmessage = (event: MessageEvent<ToThread>) => {
  const message = event.data
  switch (message.type) {
    case 'init':
      chars = [...message.text]
      th = message.th
      break
    case 'run':
      void runSlice(message.chars)
      break
    case 'pause':
      paused = true
      break
    case 'resume':
      paused = false
      wake?.()
      wake = null
      break
  }
}
