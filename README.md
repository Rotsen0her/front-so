# Simulador de gestión de procesos (Round Robin)

Aplicación web del laboratorio de Sistemas Operativos. Toma los catálogos de procesos que captura la
aplicación de escritorio (vía API REST) y simula su planificación con **Round Robin** y el modelo de
estados **Listo → Ejecución → Terminado**.

## Cómo correrlo

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # comprueba tipos y genera dist/
```

La URL de la API se lee de `URL_API` en `.env` (ver `.env.example`).

## Reglas de la simulación

| Concepto | Regla |
|---|---|
| Ráfaga (R) | `TH × caracteres de la descripción` |
| Quantum | Lo escribe el usuario (ms). Un turno copia `floor(quantum ÷ TH)` caracteres, mínimo 1 |
| Expulsivo (P.R = 0) | Suelta la CPU al terminar su turno y vuelve al final de la cola |
| No expulsivo (P.R = 1) | Usa la CPU hasta terminar |
| Llegada (T.L) | El primero en 0; cada siguiente 1 ms después del anterior |
| Finalización (T.F) | Valor del reloj simulado cuando el proceso termina |
| Turnaround (T.R) | `T.F − T.L` |

Cada proceso tiene su propio hilo (un Web Worker) que "copia" un carácter a un archivo virtual cada TH ms.

## Dónde está cada cosa

```
index.html            Estructura de la página (secciones y contenedores con id)
src/main.ts           Punto de entrada
src/style.css         Estilos
src/api/              Cliente de la API y sus tipos
src/sim/              Motor de simulación (no toca el DOM)
  types.ts              Tipos: SimProcess, SimConfig, Segment...
  process.ts            Convierte los procesos del catálogo en SimProcess
  simulation.ts         Planificador Round Robin  ← la lógica principal
  processThread.ts      Envoltorio del Worker de un proceso
  thread.worker.ts      Código que corre dentro del hilo de cada proceso
  protocol.ts           Mensajes entre el hilo principal y los hilos
src/ui/               Interfaz
  app.ts                Conecta la página con la simulación (eventos y redibujado)
  catalogs.ts           Tabla paginada de catálogos
  html.ts, format.ts    Helpers compartidos (escapar HTML, formatear valores)
  views/                Una función por sección: processes, states, file, gantt, reports
```

## Cambios habituales

- **Cambiar un valor por defecto** (TH, quantum): atributo `value` en `index.html`.
- **Cambiar cómo se planifica**: `src/sim/simulation.ts` (`run`, `giveCpuTo`, `turnLength`).
- **Cambiar cómo se calcula llegada o ráfaga**: `src/sim/process.ts`.
- **Cambiar un reporte o una tabla**: el archivo correspondiente en `src/ui/views/`.
- **Escala del Gantt**: constantes al inicio de `src/ui/views/gantt.ts`.
- **Cuánto se tarda en pantalla**: depende de TH. Con descripciones largas conviene un TH pequeño (10–50 ms).

El motor (`src/sim/`) no conoce la interfaz: la interfaz solo se suscribe con `sim.subscribe(...)`
y lee su estado (`ready`, `running`, `finished`, `segments`, `clock`).
