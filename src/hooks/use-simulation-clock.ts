import { useCallback, useEffect, useRef, useState } from "react"

export type ClockStatus = "idle" | "running" | "paused" | "finished"

// Al volver de una pestaña oculta, evita un salto enorme de tiempo.
const MAX_FRAME_MS = 250

export function useSimulationClock(duration: number) {
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timeRef = useRef(0)

  useEffect(() => {
    if (!running) return
    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const delta = Math.min(now - last, MAX_FRAME_MS) * speed
      last = now
      const next = Math.min(timeRef.current + delta, duration)
      timeRef.current = next
      setTime(next)
      if (next >= duration) {
        setRunning(false)
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, speed, duration])

  const reset = useCallback(() => {
    timeRef.current = 0
    setTime(0)
    setRunning(false)
  }, [])

  const play = useCallback(() => {
    if (duration <= 0) return
    if (timeRef.current >= duration) {
      timeRef.current = 0
      setTime(0)
    }
    setRunning(true)
  }, [duration])

  const pause = useCallback(() => setRunning(false), [])

  const finished = duration > 0 && time >= duration
  const status: ClockStatus = running
    ? "running"
    : finished
      ? "finished"
      : time > 0
        ? "paused"
        : "idle"

  return { time, status, speed, setSpeed, play, pause, reset }
}
