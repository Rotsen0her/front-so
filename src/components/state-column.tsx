import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatNumber } from "@/lib/format"
import { charsWritten, type Schedule, type Snapshot } from "@/lib/round-robin"

interface StateColumnProps {
  title: string
  icon: LucideIcon
  ids: number[]
  schedule: Schedule
  snapshot: Snapshot
  emptyLabel: string
}

export function StateColumn({
  title,
  icon: Icon,
  ids,
  schedule,
  snapshot,
  emptyLabel,
}: StateColumnProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardAction>
          <Badge variant="secondary" className="tabular-nums">
            {ids.length}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {ids.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {emptyLabel}
            </p>
          ) : (
            <ol className="flex flex-col gap-1 pr-3">
              {ids.map((id, index) => (
                <QueueItem
                  key={id}
                  position={index + 1}
                  id={id}
                  schedule={schedule}
                  snapshot={snapshot}
                />
              ))}
            </ol>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function QueueItem({
  position,
  id,
  schedule,
  snapshot,
}: {
  position: number
  id: number
  schedule: Schedule
  snapshot: Snapshot
}) {
  const process = schedule.processes[id]
  const written = charsWritten(
    process,
    snapshot.executed[id],
    schedule.params.th
  )
  const progress = written / process.content.length

  return (
    <li className="relative flex animate-enter items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-sm">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 origin-left bg-muted"
        style={{ width: "100%", transform: `scaleX(${progress})` }}
      />
      <span className="relative w-5 text-xs text-muted-foreground tabular-nums">
        {position}
      </span>
      <span className="relative min-w-0 flex-1 truncate font-medium">
        {process.name}
      </span>
      {process.priority === 1 && (
        <Badge variant="outline" className="relative">
          No expulsivo
        </Badge>
      )}
      <span className="relative text-xs text-muted-foreground tabular-nums">
        {formatNumber(written)}/{formatNumber(process.content.length)}
      </span>
    </li>
  )
}
