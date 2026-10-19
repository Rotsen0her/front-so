# Simulador de gestión de procesos · Round Robin

Aplicación web del laboratorio **Gestión de procesos** (Sistemas Operativos, Universidad de Córdoba, 2026‑II).
Consume los catálogos de procesos que guarda la aplicación de escritorio en la API REST y simula su
planificación con **Round Robin** sobre el modelo de estados _Listo → Ejecución → Terminado_.

- API: <https://api-schedule.salesconnect.dev> ([OpenAPI](https://api-schedule.salesconnect.dev/openapi/v1.json))
- Stack: React 19, TypeScript, Vite, Tailwind CSS v4 y shadcn/ui (Base UI)

## Ejecutar

```bash
bun install
bun dev          # http://localhost:5173
bun run build    # compila a dist/
```

La URL de la API se configura en `.env` (ver `.env.example`):

```env
VITE_API_URL=https://api-schedule.salesconnect.dev
```

> La API solo permite CORS desde `http://localhost:5173`, por eso el servidor de desarrollo usa ese puerto.

## Uso

1. **Catálogo**: se elige uno de los catálogos guardados (`GET /api/catalogs`). Se carga el detalle con
   `GET /api/catalogs/{number}`.
2. **TH (ms)**: tiempo que tarda el hilo de un proceso en copiar un carácter en su archivo.
3. **Quantum (ms)**: tiempo máximo que un proceso expulsivo usa la CPU en cada turno.
4. **Iniciar / Interrumpir / Reanudar / Reiniciar**: la simulación puede interrumpirse y reanudarse en
   cualquier momento. La velocidad (0.5× a 10×) solo cambia la reproducción, no los resultados.

Mientras la simulación está en curso o interrumpida, los parámetros quedan bloqueados; al reiniciar se
pueden cambiar de nuevo.

### Pestañas

| Pestaña    | Contenido                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Simulación | Proceso en **Ejecución** (archivo escribiéndose carácter a carácter), cola **Listo** y **Terminado** |
| Procesos   | Listado del catálogo: PID, nombre, usuario, descripción, prioridad, CPU, memoria, T.L y ráfaga   |
| Reportes   | Gráfico de comportamiento (Gantt), _Listado de ejecución_ y _Listado de procesos (no expulsivos)_ |

## Reglas de la simulación

Todas salen de la guía del laboratorio; la implementación está en `src/lib/round-robin.ts`.

| Concepto                 | Regla                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Actividad                | Cada proceso crea `<nombre>.txt` y copia su descripción. Cada carácter tarda **TH** ms.         |
| Ráfaga (R)               | `R = TH × cantidad de caracteres de la descripción`                                             |
| Tiempo de llegada (T.L)  | Si _Listo_ está vacío → `0`; si no → `T.L del último proceso + 1`                               |
| Prioridad (P.R)          | `0` = expulsivo, `1` = no expulsivo (procesos del sistema)                                      |
| Listo → Ejecución        | Cuando no hay ningún proceso usando la CPU                                                      |
| Ejecución → Listo        | Solo procesos expulsivos, al agotar el quantum sin haber terminado                              |
| Ejecución → Terminado    | Cuando el proceso copió todos sus caracteres                                                    |
| Tiempo de finalización   | Instante del reloj en que el proceso termina (T.F)                                              |
| Turnaround (T.R)         | `T.R = T.F − T.L`                                                                               |
| Ejecuciones (Ejec.)      | Veces que el proceso usó la CPU                                                                 |

Decisiones tomadas donde la guía no es explícita:

- **Procesos sin descripción**: muchos procesos del SO llegan con `description: null`. En ese caso el
  proceso escribe su **nombre**, para que su ráfaga nunca sea 0.
- **Llegadas durante un turno**: los procesos que llegan mientras otro usa la CPU entran a la cola
  _antes_ que el proceso expulsado al final de ese turno (convención habitual de Round Robin).
- **Unidad de tiempo**: todo se expresa en milisegundos. A velocidad 1× el reloj de la simulación avanza
  al mismo ritmo que el reloj real.

## Estructura

```
src/
├── App.tsx                      # Composición de la pantalla y estado global
├── lib/
│   ├── api.ts                   # Tipos de la API y cliente fetch
│   ├── round-robin.ts           # Motor de planificación (funciones puras)
│   └── format.ts                # Formato de números, fechas y bytes (es-CO)
├── hooks/
│   ├── use-fetch.ts             # Petición GET con cancelación y reintento
│   └── use-simulation-clock.ts  # Reloj con requestAnimationFrame: iniciar, pausar, reiniciar, velocidad
└── components/
    ├── app-header.tsx           # Título, estado de la API (/health) y tema claro/oscuro
    ├── simulation-setup.tsx     # Catálogo, TH y quantum
    ├── playback-controls.tsx    # Reloj, progreso y controles
    ├── cpu-panel.tsx            # Estado Ejecución y archivo del proceso
    ├── state-column.tsx         # Estructuras Listo y Terminado
    ├── process-table.tsx        # Listado de procesos del catálogo
    ├── report-table.tsx         # Reportes P, T.L, R, P.R, T.R, T.F
    ├── gantt-chart.tsx          # Gráfico de comportamiento
    └── ui/                      # Componentes shadcn/ui
```

### Cómo funciona el motor

`buildSchedule(procesos, { th, quantum })` calcula de una vez toda la planificación: la lista de turnos
(`Slice`: proceso, inicio, fin, cola de listos en ese momento) y los resultados de cada proceso.
`snapshotAt(schedule, t)` reconstruye en cualquier instante `t` qué proceso está en cada estado y cuántos
caracteres lleva escritos, con búsqueda binaria sobre los turnos.

Separar el cálculo de la reproducción permite interrumpir, reanudar, cambiar la velocidad o reiniciar sin
alterar los resultados. El navegador ejecuta JavaScript en un solo hilo, así que el "hilo" de cada
proceso se representa con su avance propio (tiempo ejecutado ÷ TH = caracteres copiados) en lugar de un
`Thread` real.

## Interfaz

- Componentes de shadcn/ui: `Card`, `Select`, `InputGroup`, `Field`, `Tabs`, `Table`, `ToggleGroup`,
  `Progress`, `ScrollArea`, `Badge`, `Empty`, `Alert`, `Skeleton`, `Tooltip`.
- Animación siguiendo los criterios de Emil Kowalski: solo se anima lo que aporta (un proceso que entra a
  una estructura aparece con opacidad, 4 px de desplazamiento y un leve desenfoque en 220 ms con
  `cubic-bezier(0.23, 1, 0.32, 1)` usando `@starting-style`), los botones se reducen a `scale(0.97)` al
  presionarlos, las barras que avanzan con el reloj no llevan transición para no quedarse atrás, y se
  respeta `prefers-reduced-motion`.
- Tema claro/oscuro con el botón del encabezado o la tecla `d`.
