# Reporte Ejecutivo de Testing

Testing y Calidad de Software 2026 · TaskFlow Project

## Contexto

- Proyecto: `TaskFlow`
- Guía aplicada: `test_management_modulo2.docx`
- Alcance de esta entrega: configuración Allure, anotación de 5 tests y plantilla ejecutiva completada con evidencia del repo
- Fecha: 2026-06-08

## A. Estado general del ciclo de testing

TaskFlow cuenta con una estrategia de testing multicapa ya integrada en el repositorio: unit, integration, BDD, E2E, contract y performance. La configuración de Allure ya estaba presente en la raíz del proyecto y se complementó esta entrega con trazabilidad en cinco tests representativos y con exclusión de artefactos generados en `.gitignore`.

El ciclo actual muestra buena cobertura funcional sobre autenticación, proyectos y tareas, pero mantiene riesgos operativos por bugs documentados en tests y por deuda en suites que todavía requieren estabilización y ejecución completa en entorno local.

## B. Métricas clave del ciclo

| Métrica | Valor observado | Umbral / Meta | Interpretación |
|---|---:|---:|---|
| Pass Rate | 100% en la muestra validada (34/34 tests) | >= 95% | Se validaron las 3 suites modificadas para la guía y todas pasaron. |
| Cobertura de código | Umbral configurado: lines 80%, functions 80%, statements 80%, branches 75% | >= 80% | El proyecto tiene objetivos definidos en `apps/api/vitest.config.ts`, pero no se confirmó el valor global porque no se corrió `test:unit` completo con cobertura. |
| Tests anotados en Allure | 5 | 5 | Objetivo de la guía cumplido. |
| Suites con reporting Allure verificadas | 3 suites / 34 tests | 1+ | Las anotaciones nuevas quedaron integradas y el reporte HTML se generó sin errores. |
| Capas de prueba presentes | Unit, Integration, BDD, E2E, Pact, k6 | Cobertura multi-capa | Señal positiva de madurez de estrategia de calidad. |

## C. Resumen de defectos

| Total defectos identificados en artefactos del repo | Corregidos en esta entrega | Diferidos | Escaped defects |
|---|---|---|---|
| 2 bugs explícitamente documentados en tests (`BUG-05`, `BUG-07`) | 0 | 2, porque esta guía pedía reporting y trazabilidad, no corrección funcional | No validado |

Defecto más crítico del ciclo y causa raíz identificada:

- `BUG-05` en autenticación: el bloqueo por intentos fallidos presenta una condición `off-by-one`, dejando la cuenta sin bloqueo en el umbral esperado.
- Causa raíz: validación del límite implementada con una comparación incorrecta según la especificación funcional descrita en los tests.

## D. Evaluación del riesgo residual

| Área / Módulo | Probabilidad | Impacto | Medida de mitigación |
|---|---|---|---|
| Autenticación | Medio | Alto | Corregir `BUG-05` y `BUG-07`, luego regenerar Allure y validar login con unit + integration. |
| Gestión de tareas | Medio | Medio | Mantener la cobertura de máquina de estados y ampliar rutas con casos de error coherentes. |
| Ejecución de suite local | Alto | Medio | Resolver el problema de ejecución `spawn EPERM` o correr la suite fuera del sandbox para validar métricas reales. |

## E. Deuda técnica identificada en tests

| Tipo de deuda | Archivo / Módulo | Prioridad | Acción propuesta |
|---|---|---|---|
| Falta de trazabilidad homogénea | `apps/api/tests/**` | Media | Extender anotaciones Allure al resto de pruebas críticas. |
| Artefactos generados sin ignorar por defecto | `.gitignore` | Baja | Resuelto en esta entrega agregando `allure-results/` y `allure-report/`. |
| Ejecución no verificable en este entorno | raíz / Vitest | Alta | Reejecutar `npm test` y `npm run allure:generate` con permisos de ejecución completos. |

## F. Conclusión y recomendación de release

Decisión sugerida: `GO con observaciones`.

La base de testing del proyecto es sólida y la guía de management/reporting quedó aplicada en el repositorio, especialmente en trazabilidad con Allure. La validación parcial de las suites intervenidas fue exitosa y el reporte HTML se generó correctamente, pero no recomendaría un `GO` pleno hasta confirmar la corrida integral del proyecto y revisar los bugs funcionales ya documentados en autenticación.

## Registro de los 5 tests anotados

| Archivo / Test | feature | story | severity | link |
|---|---|---|---|---|
| `apps/api/tests/unit/auth.service.spec.ts` · `lanza ConflictError si el email ya existe` | Autenticación | US-01 | normal | `AuthService.register` |
| `apps/api/tests/unit/auth.service.spec.ts` · `retorna token para credenciales válidas` | Autenticación | US-02 | critical | `AuthService.login` |
| `apps/api/tests/unit/auth.service.spec.ts` · `bloquea la cuenta después de 5 intentos fallidos — BUG-05` | Autenticación | US-02 | critical | `BUG-05 auth lockout` |
| `apps/api/tests/integration/auth.routes.spec.ts` · `201 — registro exitoso devuelve user y token` | Autenticación | US-01 | critical | `POST /api/auth/register` |
| `apps/api/tests/unit/task.state-machine.spec.ts` · `TODO → DONE ✗ (saltar IN_PROGRESS)` | Tareas | US-06 | critical | `TaskService.updateTask` |

## Comandos de validación previstos

```bash
npm test
npm run allure:generate
npm run allure:open
npm run test:unit
```

## Nota de verificación

La validación se realizó en dos etapas:

- La corrida completa de `npm test` necesitó salir del sandbox y luego mostró fallas preexistentes del repositorio, incluyendo tests que dependen de PostgreSQL en `localhost:5432`, un import roto en `project.integration.test.ts` y una suite de ejercicios con uso inconsistente de `Allure`/`allure`.
- La validación específica de las suites modificadas para esta guía sí quedó cerrada con éxito: `34/34` tests pasaron y `npm run allure:generate` produjo `allure-report/` sin errores.
