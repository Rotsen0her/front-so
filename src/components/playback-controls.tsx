import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ClockStatus } from "@/hooks/use-simulation-clock"
import { formatNumber } from "@/lib/format"

const SPEEDS = [0.5, 1, 2, 5, 10]

const STATUS_LABEL: Record<ClockStatus, string> = {
  idle: "Detenida",
  running: "En curso",
  paused: "Interrumpida",
  finished: "Finalizada",
}

interface PlaybackControlsProps {
  time: number
  duration: number
  status: ClockStatus
  speed: number
  disabled: boolean
  onSpeedChange: (speed: number) => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
}

export function PlaybackControls({
  time,
  duration,
  status,
  speed,
  disabled,
  onSpeedChange,
  onPlay,
  onPause,
  onReset,
}: PlaybackControlsProps) {
  const running = status === "running"
  const progress = duration > 0 ? (time / duration) * 100 : 0

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {STATUS_LABEL[status]}
            </span>
            <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {formatNumber(time)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                ms
              </span>
            </span>
          </div>
          <span className="pb-1 text-xs text-muted-foreground tabular-nums">
            / {formatNumber(duration)} ms
          </span>
        </div>

        <Progress value={progress} aria-label="Avance de la simulación" />

        <div className="flex gap-2">
          {running ? (
            <Button className="flex-1" variant="secondary" onClick={onPause}>
              <PauseIcon data-icon="inline-start" />
              Interrumpir
            </Button>
          ) : (
            <Button className="flex-1" onClick={onPlay} disabled={disabled}>
              <PlayIcon data-icon="inline-start" />
              {status === "paused"
                ? "Reanudar"
                : status === "finished"
                  ? "Repetir"
                  : "Iniciar"}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label="Reiniciar"
            onClick={onReset}
            disabled={status === "idle"}
          >
            <RotateCcwIcon />
          </Button>
        </div>

        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          className="w-full"
          value={[String(speed)]}
          onValueChange={(value) => {
            if (value.length > 0) onSpeedChange(Number(value[0]))
          }}
          aria-label="Velocidad"
        >
          {SPEEDS.map((option) => (
            <ToggleGroupItem
              key={option}
              value={String(option)}
              className="flex-1 tabular-nums"
            >
              {option}×
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardContent>
    </Card>
  )
}
