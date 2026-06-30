# Resultados de Performance - Clase 9

Valores obtenidos en el load test y el spike test.

## Comparativa Load vs Spike

| Métrica                      | Load (50 VUs) | Spike (200 VUs) | Threshold (SLO) | Cumple? |
| :--------------------------- | :------------ | :-------------- | :-------------- | :------ |
| **p95 total (latencia)**     | 26.08 ms      | 359.24 ms       | < 500 ms        | **Sí**  |
| **p99 total (latencia)**     | 38.58 ms      | 495.45 ms       | < 1000 ms       | **Sí**  |
| **error_rate**               | 0.00%         | 0.00%           | < 1%            | **Sí**  |
| **list_duration p95**        | 5.84 ms       | 191.12 ms       | < 400 ms        | **Sí**  |
| **tasks_duration p95**       | 32.25 ms      | 221.13 ms       | < 400 ms        | **Sí**  |
| **create_task_duration p95** | 8.21 ms       | 298.51 ms       | < 500 ms        | **Sí**  |
| **Throughput (req/s)**       | 48.09 req/s   | 199.57 req/s    | —               | —       |

## Interpretación de los resultados

- Bajo `load` y bajo `spike`, la aplicación mantuvo `error_rate = 0.00%`.
- La latencia aumenta de forma clara durante el `spike`, pero se mantiene dentro de los thresholds definidos.
- El problema observado es de rendimiento bajo pico de carga, no de disponibilidad ni de errores funcionales.
