import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDecimal, formatNumber } from "@/lib/format"
import type { ProcessResult, Schedule } from "@/lib/round-robin"

interface ReportTableProps {
  title: string
  schedule: Schedule
  results: ProcessResult[]
}

export function ReportTable({ title, schedule, results }: ReportTableProps) {
  const average = (pick: (r: ProcessResult) => number) =>
    results.length === 0
      ? 0
      : results.reduce((sum, r) => sum + pick(r), 0) / results.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>P</TableHead>
              <TableHead className="text-right">T.L</TableHead>
              <TableHead className="text-right">R</TableHead>
              <TableHead className="text-right">P.R</TableHead>
              <TableHead className="text-right">T.R</TableHead>
              <TableHead className="text-right">T.F</TableHead>
              <TableHead className="text-right">Ejec.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-20 text-center text-muted-foreground"
                >
                  Aún no hay procesos terminados
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => {
                const process = schedule.processes[result.id]
                return (
                  <TableRow key={result.id} className="animate-enter">
                    <TableCell className="font-medium">
                      {process.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(process.arrival)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(process.burst)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {process.priority}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(result.turnaround)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(result.finish)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {result.executions}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
          {results.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell>Promedio</TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">
                  {formatDecimal(
                    average((r) => schedule.processes[r.id].burst)
                  )}
                </TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">
                  {formatDecimal(average((r) => r.turnaround))}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </CardContent>
    </Card>
  )
}
