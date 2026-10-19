import { useMemo, useState } from "react"
import { CircleCheckIcon, DatabaseIcon, ListOrderedIcon } from "lucide-react"

import { AppHeader } from "@/components/app-header"
import { CpuPanel } from "@/components/cpu-panel"
import { GanttChart } from "@/components/gantt-chart"
import { PlaybackControls } from "@/components/playback-controls"
import { ProcessTable } from "@/components/process-table"
import { ReportTable } from "@/components/report-table"
import {
  SimulationSetup,
  type SetupValues,
} from "@/components/simulation-setup"
import { StateColumn } from "@/components/state-column"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFetch } from "@/hooks/use-fetch"
import { useSimulationClock } from "@/hooks/use-simulation-clock"
import { endpoints, type CatalogDetail, type CatalogPage } from "@/lib/api"
import { buildSchedule, snapshotAt, type Schedule } from "@/lib/round-robin"

function parseMs(value: string) {
  const number = Number(value)
  if (value.trim() === "" || !Number.isInteger(number) || number < 1) {
    return null
  }
  return number
}

export function App() {
  const catalogs = useFetch<CatalogPage>(endpoints.catalogs())
  const [values, setValues] = useState<SetupValues>({
    catalog: null,
    th: "50",
    quantum: "200",
  })

  const catalogNumber =
    values.catalog ?? catalogs.data?.items[0]?.number ?? null
  const catalog = useFetch<CatalogDetail>(
    catalogNumber ? endpoints.catalog(catalogNumber) : null
  )

  const th = parseMs(values.th)
  const quantum = parseMs(values.quantum)
  const errors = {
    th: th === null ? "Entero ≥ 1" : undefined,
    quantum: quantum === null ? "Entero ≥ 1" : undefined,
  }

  const built = useMemo<{
    schedule: Schedule | null
    error: string | null
  }>(() => {
    if (!catalog.data || th === null || quantum === null) {
      return { schedule: null, error: null }
    }
    try {
      return {
        schedule: buildSchedule(catalog.data.processes, { th, quantum }),
        error: null,
      }
    } catch (error) {
      return { schedule: null, error: (error as Error).message }
    }
  }, [catalog.data, th, quantum])
  const schedule = built.schedule

  const clock = useSimulationClock(schedule?.duration ?? 0)
  const snapshot = useMemo(
    () => (schedule ? snapshotAt(schedule, clock.time) : null),
    [schedule, clock.time]
  )

  const locked = clock.status === "running" || clock.status === "paused"

  const handleChange = (patch: Partial<SetupValues>) => {
    clock.reset()
    setValues((current) => ({ ...current, ...patch }))
  }

  const finishedResults = useMemo(() => {
    if (!schedule) return []
    return schedule.results.filter((r) => r.finish <= clock.time)
  }, [schedule, clock.time])

  return (
    <div className="min-h-svh">
      <AppHeader />

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
          <SimulationSetup
            catalogs={catalogs.data?.items ?? null}
            catalogsLoading={catalogs.loading}
            catalogsError={catalogs.error}
            onRetry={catalogs.reload}
            values={{ ...values, catalog: catalogNumber }}
            errors={errors}
            disabled={locked}
            onChange={handleChange}
          />
          <PlaybackControls
            time={clock.time}
            duration={schedule?.duration ?? 0}
            status={clock.status}
            speed={clock.speed}
            disabled={!schedule}
            onSpeedChange={clock.setSpeed}
            onPlay={clock.play}
            onPause={clock.pause}
            onReset={clock.reset}
          />
        </aside>

        <section className="min-w-0">
          {built.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>No se puede simular</AlertTitle>
              <AlertDescription>{built.error}</AlertDescription>
            </Alert>
          )}

          {catalog.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar el catálogo</AlertTitle>
              <AlertDescription>{catalog.error.message}</AlertDescription>
            </Alert>
          ) : catalog.loading || catalogs.loading ? (
            <LoadingState />
          ) : !catalog.data ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DatabaseIcon />
                </EmptyMedia>
                <EmptyTitle>Sin catálogos</EmptyTitle>
                <EmptyDescription>
                  Captura procesos desde la aplicación de escritorio.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Tabs defaultValue="simulacion" className="gap-4">
              <TabsList>
                <TabsTrigger value="simulacion">Simulación</TabsTrigger>
                <TabsTrigger value="procesos">Procesos</TabsTrigger>
                <TabsTrigger value="reportes">Reportes</TabsTrigger>
              </TabsList>

              <TabsContent value="simulacion" className="flex flex-col gap-4">
                {schedule && snapshot && (
                  <>
                    <CpuPanel schedule={schedule} snapshot={snapshot} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <StateColumn
                        title="Listo"
                        icon={ListOrderedIcon}
                        ids={snapshot.ready}
                        schedule={schedule}
                        snapshot={snapshot}
                        emptyLabel="Cola vacía"
                      />
                      <StateColumn
                        title="Terminado"
                        icon={CircleCheckIcon}
                        ids={snapshot.finished}
                        schedule={schedule}
                        snapshot={snapshot}
                        emptyLabel="Ninguno todavía"
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="procesos">
                <ProcessTable catalog={catalog.data} schedule={schedule} />
              </TabsContent>

              <TabsContent value="reportes" className="flex flex-col gap-4">
                {schedule && (
                  <>
                    <GanttChart schedule={schedule} time={clock.time} />
                    <ReportTable
                      title="Listado de ejecución"
                      schedule={schedule}
                      results={finishedResults}
                    />
                    <ReportTable
                      title="Listado de procesos (no expulsivos)"
                      schedule={schedule}
                      results={finishedResults.filter(
                        (r) => schedule.processes[r.id].priority === 1
                      )}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64 rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  )
}

export default App
