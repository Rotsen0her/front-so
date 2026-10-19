import { useMemo } from "react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { formatNumber } from "@/lib/format"
import type { Schedule } from "@/lib/round-robin"
import { cn } from "@/lib/utils"

interface Block {
  start: number
  end: number
}

const TICKS = 6

/** Une turnos consecutivos del mismo proceso para dibujar menos bloques. */
function mergeBlocks(schedule: Schedule): Block[][] {
  return schedule.slicesByProcess.map((slices) => {
    const blocks: Block[] = []
    for (const slice of slices) {
      const last = blocks.at(-1)
      if (last && last.end === slice.start) last.end = slice.end
      else blocks.push({ start: slice.start, end: slice.end })
    }
    return blocks
  })
}

interface GanttChartProps {
  schedule: Schedule
  time: number
}

export function GanttChart({ schedule, time }: GanttChartProps) {
  const blocksByProcess = useMemo(() => mergeBlocks(schedule), [schedule])
  const { duration, processes, results } = schedule
  const finishById = useMemo(
    () => new Map(results.map((r) => [r.id, r.finish])),
    [results]
  )
  const percent = (value: number) => `${(value / duration) * 100}%`
  const ticks = Array.from(
    { length: TICKS + 1 },
    (_, i) => (duration / TICKS) * i
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gráfico de comportamiento</CardTitle>
        <CardAction className="flex items-center gap-4 text-xs text-muted-foreground">
          <Legend className="bg-primary" label="Expulsivo" />
          <Legend className="bg-foreground/70" label="No expulsivo" />
          <Legend className="bg-muted" label="En espera" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ScrollArea>
          <div className="grid min-w-[640px] grid-cols-[9rem_1fr] gap-x-3 gap-y-1.5 pb-3">
            {processes.map((process) => {
              const visibleEnd = Math.min(
                time,
                finishById.get(process.id) ?? duration
              )
              return (
                <div key={process.id} className="contents">
                  <span className="truncate text-xs leading-5 text-muted-foreground">
                    {process.name}
                  </span>
                  <div className="relative h-5">
                    {visibleEnd > process.arrival && (
                      <span
                        className="absolute inset-y-1.5 rounded-full bg-muted"
                        style={{
                          left: percent(process.arrival),
                          width: percent(visibleEnd - process.arrival),
                        }}
                      />
                    )}
                    {blocksByProcess[process.id]
                      .filter((block) => block.start < time)
                      .map((block) => (
                        <span
                          key={block.start}
                          className={cn(
                            "absolute inset-y-0 min-w-px rounded-[3px]",
                            process.priority === 1
                              ? "bg-foreground/70"
                              : "bg-primary"
                          )}
                          style={{
                            left: percent(block.start),
                            width: percent(
                              Math.min(block.end, time) - block.start
                            ),
                          }}
                        />
                      ))}
                  </div>
                </div>
              )
            })}

            <span />
            <div className="relative mt-1 h-4 border-t text-[10px] text-muted-foreground tabular-nums">
              {ticks.map((tick, i) => (
                <span
                  key={tick}
                  className={cn(
                    "absolute top-1",
                    i === 0
                      ? "translate-x-0"
                      : i === TICKS
                        ? "-translate-x-full"
                        : "-translate-x-1/2"
                  )}
                  style={{ left: percent(tick) }}
                >
                  {formatNumber(tick)}
                </span>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  )
}
