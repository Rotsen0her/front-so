import { CpuIcon, FileTextIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { formatNumber, priorityLabel } from "@/lib/format"
import { charsWritten, type Schedule, type Snapshot } from "@/lib/round-robin"

interface CpuPanelProps {
  schedule: Schedule
  snapshot: Snapshot
}

export function CpuPanel({ schedule, snapshot }: CpuPanelProps) {
  const running = snapshot.running
  const process = running ? schedule.processes[running.processId] : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CpuIcon className="size-4 text-muted-foreground" />
          Ejecución
        </CardTitle>
        {process && (
          <CardAction>
            <Badge variant={process.priority === 1 ? "secondary" : "outline"}>
              {priorityLabel(process.priority)}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {process && running ? (
          <RunningProcess
            key={running.slice.start}
            schedule={schedule}
            snapshot={snapshot}
          />
        ) : (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CpuIcon />
              </EmptyMedia>
              <EmptyTitle>
                {snapshot.finished.length === schedule.processes.length &&
                snapshot.time > 0
                  ? "Todos los procesos terminaron"
                  : "CPU libre"}
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}

function RunningProcess({ schedule, snapshot }: CpuPanelProps) {
  const { slice, processId } = snapshot.running!
  const process = schedule.processes[processId]
  const { th } = schedule.params
  const executed = snapshot.executed[processId]
  const written = charsWritten(process, executed, th)
  const sliceProgress =
    ((snapshot.time - slice.start) / (slice.end - slice.start)) * 100

  return (
    <div className="flex animate-enter flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="font-heading text-xl font-semibold tracking-tight">
          {process.name}
        </span>
        <CardDescription className="tabular-nums">
          PID {process.pid} · {process.user ?? "Sistema"}
        </CardDescription>
      </div>

      <div className="rounded-xl border bg-muted/40">
        <div className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
          <FileTextIcon className="size-3.5" />
          <span className="truncate font-mono">{process.fileName}</span>
          <span className="ml-auto tabular-nums">
            {written}/{process.content.length}
          </span>
        </div>
        <p className="min-h-16 px-3 py-3 font-mono text-sm break-all whitespace-pre-wrap">
          {process.content.slice(0, written)}
          <span className="caret" aria-hidden />
          <span className="text-muted-foreground/40">
            {process.content.slice(written)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Meter
          label="Turno"
          value={sliceProgress}
          detail={`${formatNumber(snapshot.time - slice.start)} / ${formatNumber(slice.end - slice.start)} ms`}
        />
        <Meter
          label="Ráfaga"
          value={(executed / process.burst) * 100}
          detail={`${formatNumber(executed)} / ${formatNumber(process.burst)} ms`}
        />
      </div>
    </div>
  )
}

function Meter({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{detail}</span>
      </div>
      <Progress value={Math.min(100, value)} aria-label={label} />
    </div>
  )
}
