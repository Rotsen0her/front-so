import { MoonIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFetch } from "@/hooks/use-fetch"
import { endpoints, type Readiness } from "@/lib/api"
import { cn } from "@/lib/utils"

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const health = useFetch<Readiness>(endpoints.health())
  const online = health.data?.status === "ready"

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <span className="font-heading text-sm font-semibold tracking-tight">
            Gestión de procesos
          </span>
          <Badge variant="secondary">Round Robin</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="flex items-center gap-2 px-2 text-xs text-muted-foreground" />
              }
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  health.loading
                    ? "bg-muted-foreground"
                    : online
                      ? "bg-primary"
                      : "bg-destructive"
                )}
              />
              {health.loading ? "Conectando" : online ? "API" : "Sin conexión"}
            </TooltipTrigger>
            <TooltipContent>{endpoints.health()}</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cambiar tema"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </div>
    </header>
  )
}
