import { RotateCwIcon } from "lucide-react"

import { Alert, AlertAction, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { CatalogSummary } from "@/lib/api"

export interface SetupValues {
  catalog: number | null
  th: string
  quantum: string
}

interface SimulationSetupProps {
  catalogs: CatalogSummary[] | null
  catalogsLoading: boolean
  catalogsError: Error | null
  onRetry: () => void
  values: SetupValues
  errors: Partial<Record<"th" | "quantum", string>>
  disabled: boolean
  onChange: (values: Partial<SetupValues>) => void
}

export function SimulationSetup({
  catalogs,
  catalogsLoading,
  catalogsError,
  onRetry,
  values,
  errors,
  disabled,
  onChange,
}: SimulationSetupProps) {
  const items = (catalogs ?? []).map((catalog) => ({
    value: catalog.number,
    label: `#${catalog.number} · ${catalog.name}`,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field data-disabled={disabled || undefined}>
            <FieldLabel htmlFor="catalog">Catálogo</FieldLabel>
            {catalogsLoading ? (
              <Skeleton className="h-8 w-full rounded-2xl" />
            ) : catalogsError ? (
              <Alert variant="destructive">
                <AlertTitle>No se pudo cargar</AlertTitle>
                <AlertAction>
                  <Button size="xs" variant="outline" onClick={onRetry}>
                    <RotateCwIcon data-icon="inline-start" />
                    Reintentar
                  </Button>
                </AlertAction>
              </Alert>
            ) : (
              <Select
                items={items}
                value={values.catalog}
                onValueChange={(catalog) => onChange({ catalog })}
                disabled={disabled || items.length === 0}
              >
                <SelectTrigger id="catalog" className="w-full">
                  <SelectValue placeholder="Sin catálogos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {catalogs?.map((catalog) => (
                      <SelectItem key={catalog.number} value={catalog.number}>
                        <span className="truncate">
                          #{catalog.number} · {catalog.name}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                          {catalog.processCount}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <MsField
              id="th"
              label="TH"
              value={values.th}
              error={errors.th}
              disabled={disabled}
              onChange={(th) => onChange({ th })}
            />
            <MsField
              id="quantum"
              label="Quantum"
              value={values.quantum}
              error={errors.quantum}
              disabled={disabled}
              onChange={(quantum) => onChange({ quantum })}
            />
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

interface MsFieldProps {
  id: string
  label: string
  value: string
  error?: string
  disabled: boolean
  onChange: (value: string) => void
}

function MsField({
  id,
  label,
  value,
  error,
  disabled,
  onChange,
}: MsFieldProps) {
  return (
    <Field
      data-invalid={error ? true : undefined}
      data-disabled={disabled || undefined}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
          className="tabular-nums"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>ms</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
