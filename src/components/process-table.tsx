import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CatalogDetail } from "@/lib/api"
import {
  formatBytes,
  formatDate,
  formatDecimal,
  formatMs,
  priorityLabel,
} from "@/lib/format"
import type { Schedule } from "@/lib/round-robin"

interface ProcessTableProps {
  catalog: CatalogDetail
  schedule: Schedule | null
}

export function ProcessTable({ catalog, schedule }: ProcessTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          #{catalog.number} · {catalog.name}
        </CardTitle>
        <CardDescription>
          {catalog.processCount} procesos · por{" "}
          {catalog.selectionOrder === "cpu" ? "CPU" : "memoria"} ·{" "}
          {formatDate(catalog.capturedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>PID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead className="text-right">CPU</TableHead>
              <TableHead className="text-right">Memoria</TableHead>
              <TableHead className="text-right">T.L</TableHead>
              <TableHead className="text-right">Ráfaga</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalog.processes.map((process, index) => {
              const sim = schedule?.processes[index]
              return (
                <TableRow key={process.position}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell className="tabular-nums">{process.pid}</TableCell>
                  <TableCell className="font-medium">{process.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {process.user ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-muted-foreground">
                    {process.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={process.priority === 1 ? "secondary" : "outline"}
                    >
                      {process.priority} · {priorityLabel(process.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {process.cpuUsagePercent === null
                      ? "—"
                      : `${formatDecimal(process.cpuUsagePercent)} %`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBytes(process.memoryUsageBytes)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {sim ? sim.arrival : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {sim ? formatMs(sim.burst) : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
